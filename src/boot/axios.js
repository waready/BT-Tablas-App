import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
// ✅ relativo desde src/boot a src/stores
import { useAuthStore } from '../stores/auth'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:4000/'

export const api = axios.create({ baseURL, withCredentials: true })

export default defineBoot(({ app }) => {
  const auth = useAuthStore()

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
      const isRefreshCall = original?.url?.includes('/auth/refresh')
      if (err.response?.status === 401 && !original?._retry && !isRefreshCall) {
        if (!refreshing) {
          refreshing = (async () => {
            const { data } = await api.post('/auth/refresh')
            auth.setAccessToken(data.access_token, data.expires_in || 3600)
          })().finally(() => { refreshing = null })
        }
        await refreshing
        original._retry = true
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${auth.accessToken}`
        return api(original)
      }
      return Promise.reject(err)
    }
  )

  ;(async () => {
    try {
      const { data } = await api.post('/auth/refresh')
      auth.setAccessToken(data.access_token, data.expires_in || 3600)
    } catch {}
  })()

  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
  window.$api = api
})
