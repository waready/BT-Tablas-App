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
    expAt: null,          // epoch seconds del ACCESS token
    refreshToken: null,
    refreshExpAt: null,   // epoch seconds del REFRESH token
    user: null,
    roles: [],
    permissions: []
  }),
  getters: {
    isLogged: (s) => !!s.accessToken && s.expAt && s.expAt > nowSec(),
    secondsLeft: (s) => (s.expAt ? Math.max(0, s.expAt - nowSec()) : 0)
  },
  actions: {
    // Guarda todo el payload que recibiste del backend (login)
    setSession(payload) {
      const token = payload?.token || payload?.access_token
      if (!token) return this.clear()

      const decoded = decodeJwt(token)
      const exp = Number(decoded?.exp) || null

      this.accessToken = token
      this.expAt = exp
      this.user = payload.user || this.user || null
      this.roles = payload.roles || this.roles || []
      this.permissions = payload.permissions || this.permissions || []

      // 👇 manejar también el refreshToken si viene
      if (payload.refreshToken) {
        const decodedRefresh = decodeJwt(payload.refreshToken)
        const refreshExp = Number(decodedRefresh?.exp) || null
        this.refreshToken = payload.refreshToken
        this.refreshExpAt = refreshExp
      }

      try {
        localStorage.setItem('accessToken', this.accessToken || '')
        localStorage.setItem('expAt', this.expAt ? String(this.expAt) : '')
        localStorage.setItem('user', this.user ? JSON.stringify(this.user) : '')
        localStorage.setItem('roles', JSON.stringify(this.roles || []))
        localStorage.setItem('permissions', JSON.stringify(this.permissions || []))
        localStorage.setItem('refreshToken', this.refreshToken || '')
        localStorage.setItem('refreshExpAt', this.refreshExpAt ? String(this.refreshExpAt) : '')
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

    // guardar sólo refreshToken (por si lo necesitas)
    setRefreshToken(token) {
      if (!token) {
        this.refreshToken = null
        this.refreshExpAt = null
        try {
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('refreshExpAt')
        } catch {}
        return
      }
      const decoded = decodeJwt(token)
      const exp = Number(decoded?.exp) || null
      this.refreshToken = token
      this.refreshExpAt = exp
      try {
        localStorage.setItem('refreshToken', token)
        localStorage.setItem('refreshExpAt', exp ? String(exp) : '')
      } catch {}
    },

    getRefreshToken() {
      if (this.refreshToken) return this.refreshToken
      try {
        const rt = localStorage.getItem('refreshToken')
        this.refreshToken = rt || null
        return this.refreshToken
      } catch {
        return null
      }
    },

    rehydrateFromStorage() {
      try {
        const token = localStorage.getItem('accessToken')
        const expAt = Number(localStorage.getItem('expAt')) || null
        const user = localStorage.getItem('user')
        const roles = localStorage.getItem('roles')
        const permissions = localStorage.getItem('permissions')
        const refreshToken = localStorage.getItem('refreshToken')
        const refreshExpAt = Number(localStorage.getItem('refreshExpAt')) || null

        this.accessToken = token || null
        this.expAt = expAt
        this.user = user ? JSON.parse(user) : null
        this.roles = roles ? JSON.parse(roles) : []
        this.permissions = permissions ? JSON.parse(permissions) : []
        this.refreshToken = refreshToken || null
        this.refreshExpAt = refreshExpAt || null
      } catch {
        this.clear()
      }
    },

    clear() {
      this.accessToken = null
      this.expAt = null
      this.refreshToken = null
      this.refreshExpAt = null
      this.user = null
      this.roles = []
      this.permissions = []
      try {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('expAt')
        localStorage.removeItem('user')
        localStorage.removeItem('roles')
        localStorage.removeItem('permissions')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('refreshExpAt')
      } catch {}
    }
  }
})
