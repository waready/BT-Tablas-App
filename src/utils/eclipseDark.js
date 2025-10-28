import { Dark, LocalStorage } from 'quasar'

export function toggleDarkEclipse (evt, {
  darkBg   = '#121212',   // $dark-page
  lightBg  = '#ffffff',   // fondo claro base
  duration = 700,         // ms
  mode     = 'reveal'
} = {}) {
  const x = evt?.clientX ?? window.innerWidth / 2
  const y = evt?.clientY ?? window.innerHeight / 2
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  const goingDark = !Dark.isActive

  if (reduce) {
    Dark.set(goingDark)
    LocalStorage.set('prefers-dark', Dark.isActive)
    return
  }

  const overlay = document.createElement('div')
  overlay.setAttribute('aria-hidden', 'true')
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    pointerEvents: 'none',
    willChange: 'clip-path, background-color, opacity',
    transition: `clip-path ${duration}ms cubic-bezier(.22,1,.36,1), opacity ${Math.round(duration/2)}ms ease`
  })

  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  const prevBg = Dark.isActive ? darkBg : lightBg
  const nextBg = goingDark ? darkBg : lightBg

  let start, end

  if (mode === 'reveal') {
    // Cambiamos tema primero, dejamos "capa" con color anterior y la encogemos
    Dark.set(goingDark)
    LocalStorage.set('prefers-dark', Dark.isActive)
    overlay.style.background = prevBg
    start = `circle(${r}px at ${x}px ${y}px)`
    end   = `circle(0px at ${x}px ${y}px)`
  } else {
    // Cubre con color del nuevo tema
    overlay.style.background = nextBg
    start = `circle(0px at ${x}px ${y}px)`
    end   = `circle(${r}px at ${x}px ${y}px)`
    setTimeout(() => {
      Dark.set(goingDark)
      LocalStorage.set('prefers-dark', Dark.isActive)
    }, Math.min(200, duration / 3))
  }

  overlay.style.clipPath = start
  document.body.appendChild(overlay)
  overlay.offsetHeight
  overlay.style.clipPath = end

  setTimeout(() => overlay.remove(), duration + 60)
}
