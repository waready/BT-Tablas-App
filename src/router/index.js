// src/router/index.js
import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth'

export default defineRouter(({ store }) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    history: createHistory(process.env.VUE_ROUTER_BASE),
    routes,
    scrollBehavior: () => ({ left: 0, top: 0 })
  })

  Router.beforeEach((to) => {
    const auth = useAuthStore(store)

    // rehidrata (una vez) si no hay nada en memoria
    if (!auth.accessToken) auth.rehydrateFromStorage()

    const isLogged = auth.isLogged
    const isPublic = to.meta?.public === true
    const isGuestOnly = to.meta?.guestOnly === true

    // Si el token está vencido, limpiar y tratar como no logueado
    if (auth.accessToken && !isLogged) {
      auth.clear()
    }

    // A) Logueado y /login (guestOnly) -> home
    if (isLogged && isGuestOnly) {
      return { name: 'home' }
    }

    // B) Ruta pública -> pasa
    if (isPublic) return true

    // C) Ruta privada y no logueado -> /login?redirect=...
    if (!isLogged) {
      const redirect = to.fullPath && to.fullPath !== '/login' ? { redirect: to.fullPath } : undefined
      return { name: 'login', query: redirect }
    }

    // D) Privada y logueado -> pasa
    return true
  })

  return Router
})
