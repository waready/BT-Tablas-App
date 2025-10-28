// stores/auth.js
import { defineStore } from 'pinia'

// --- helpers sin librerías ---
function decodeJwt(token) {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

function nowSec() {
  return Math.floor(Date.now() / 1000)
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    expAt: null,          // epoch seconds
    user: null,
    roles: [],
    permissions: []
  }),
  getters: {
    isLogged: (s) => !!s.accessToken && s.expAt && s.expAt > nowSec(),
    secondsLeft: (s) => (s.expAt ? Math.max(0, s.expAt - nowSec()) : 0)
  },
  actions: {
    // Guarda todo el payload que recibiste del backend (como el JSON que pasaste)
    setSession(payload) {
      const token = payload?.token || payload?.access_token
      if (!token) return this.clear()

      const decoded = decodeJwt(token)
      const exp = Number(decoded?.exp) || null

      this.accessToken = token
      this.expAt = exp
      this.user = payload.user || null
      this.roles = payload.roles || []
      this.permissions = payload.permissions || []

      try {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('expAt', exp ? String(exp) : '')
        localStorage.setItem('user', this.user ? JSON.stringify(this.user) : '')
        localStorage.setItem('roles', JSON.stringify(this.roles || []))
        localStorage.setItem('permissions', JSON.stringify(this.permissions || []))
      } catch {}
    },

    // Compatible con código previo que solo te daba token
    setAccessToken(token) {
      if (!token) return this.clear()
      const decoded = decodeJwt(token)
      const exp = Number(decoded?.exp) || null
      this.accessToken = token
      this.expAt = exp
      try {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('expAt', exp ? String(exp) : '')
      } catch {}
    },

    rehydrateFromStorage() {
      try {
        const token = localStorage.getItem('accessToken')
        const expAt = Number(localStorage.getItem('expAt')) || null
        const user = localStorage.getItem('user')
        const roles = localStorage.getItem('roles')
        const permissions = localStorage.getItem('permissions')

        this.accessToken = token || null
        this.expAt = expAt
        this.user = user ? JSON.parse(user) : null
        this.roles = roles ? JSON.parse(roles) : []
        this.permissions = permissions ? JSON.parse(permissions) : []
      } catch {
        this.clear()
      }
    },

    clear() {
      this.accessToken = null
      this.expAt = null
      this.user = null
      this.roles = []
      this.permissions = []
      try {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('expAt')
        localStorage.removeItem('user')
        localStorage.removeItem('roles')
        localStorage.removeItem('permissions')
      } catch {}
    }
  }
})
