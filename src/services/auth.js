import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({ accessToken: null, expAt: null }),
  actions: {
    setAccessToken (token, expiresIn = 3600) {
      this.accessToken = token
      this.expAt = new Date(Date.now() + expiresIn * 1000).toISOString()
    },
    clear () {
      this.accessToken = null
      this.expAt = null
    }
  },
  getters: { isLogged: (s) => !!s.accessToken }
})
