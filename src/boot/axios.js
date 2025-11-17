// src/boot/axios.js
import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

// withCredentials no molesta, pero ya no es requerido si el refresh va por body
export const api = axios.create({ baseURL, withCredentials: true })

export default defineBoot(({ app, router }) => {
  const auth = useAuthStore()

  // 👉 Helper para cerrar sesión y mandar al login
  function forceLogoutAndGoLogin () {
    auth.clear()
    router.push({ name: 'login' }) // o router.push('/login')
  }

  // Añadir Authorization a cada request si hay accessToken
  api.interceptors.request.use(cfg => {
    if (auth.accessToken) {
      cfg.headers = cfg.headers || {}
      cfg.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return cfg
  })

  let refreshing = null

  api.interceptors.response.use(
    r => r,
    async err => {
      const original = err.config
      const status = err.response?.status
      const isRefreshCall = original?.url?.includes('/auth/refresh')

      // 🔴 Si el propio /auth/refresh responde 401 → ya no hay nada que hacer
      if (isRefreshCall && status === 401) {
        forceLogoutAndGoLogin()
        return Promise.reject(err)
      }

      // 🟡 Intentar refresh solo 1 vez si recibo 401 en otra ruta
      if (status === 401 && !original?._retry && !isRefreshCall) {
        const rt = auth.getRefreshToken?.() || auth.refreshToken
        if (!rt) {
          // no hay refresh token guardado → cerrar sesión
          forceLogoutAndGoLogin()
          return Promise.reject(err)
        }

        if (!refreshing) {
          refreshing = (async () => {
            const { data } = await api.post('/auth/refresh', {
              refreshToken: rt
            })
            // back devuelve { access_token, expires_in, ... }
            auth.setAccessToken(data.access_token, data.expires_in || 3600)
          })().finally(() => {
            refreshing = null
          })
        }

        try {
          await refreshing
        } catch (e) {
          // 🔴 El refresh falló (401, 400, etc.) → sesión fuera
          forceLogoutAndGoLogin()
          return Promise.reject(e)
        }

        // Reintentar la request original con el nuevo access token
        original._retry = true
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${auth.accessToken}`
        return api(original)
      }

      // Cualquier otro error
      return Promise.reject(err)
    }
  )

  // 🔁 Intentar refrescar al cargar la app (por si el user ya tenía refreshToken)
  ;(async () => {
    try {
      const rt = auth.getRefreshToken?.() || auth.refreshToken
      if (!rt) return

      const { data } = await api.post('/auth/refresh', {
        refreshToken: rt
      })

      auth.setAccessToken(data.access_token, data.expires_in || 3600)
    } catch (e) {
      console.error('Refresh inicial falló', e)
      // aquí puedes decidir limpiar sesión si quieres
      // forceLogoutAndGoLogin()
    }
  })()

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  window.$api = api
})
