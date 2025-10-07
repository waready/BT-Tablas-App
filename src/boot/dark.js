import { Dark, LocalStorage } from 'quasar'

export default () => {
  const saved = LocalStorage.getItem('prefers-dark')
  if (typeof saved === 'boolean') return Dark.set(saved)

  const system = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  Dark.set(system)
}
