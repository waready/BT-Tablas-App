<template>
  <button
    class="moon-toggle"
    :class="{ 'is-dark': isDark }"
    :aria-label="isDark ? 'Desactivar modo oscuro' : 'Activar modo oscuro'"
    @click="toggle"
  >
    <!-- El disco (sol/luna) -->
    <span class="orb" aria-hidden="true"></span>
    <!-- Para accesibilidad -->
    <span class="sr-only">{{ isDark ? 'Modo oscuro activado' : 'Modo claro activado' }}</span>
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { Dark, LocalStorage } from 'quasar'

const isDark = computed(() => Dark.isActive)
const toggle = () => {
  Dark.toggle()
  LocalStorage.set('prefers-dark', Dark.isActive)
}
</script>

<style scoped>
/* Botón base */
.moon-toggle {
  --size: 28px; /* ajusta el tamaño del icono */
  --sun: #ffd166;
  --moon: #e5e7eb;
  --sky: #121212; /* debería coincidir con $dark-page */
  --rays: rgba(255, 209, 102, 0.9);
  --stars: rgba(255,255,255,0.95);

  position: relative;
  width: var(--size);
  height: var(--size);
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  border-radius: 999px;
  outline: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* El disco (sol/luna) */
.orb {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: var(--sun);
  box-shadow:
    0 0 0 2px rgba(0,0,0,.06) inset,
    0 2px 8px rgba(0,0,0,.15);
  transition:
    background .35s ease,
    transform .6s cubic-bezier(.22,1,.36,1),
    box-shadow .35s ease;
  will-change: transform, background, box-shadow;
}

/* “Mordida” para crear la luna (círculo desplazado que enmascara) */
.orb::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 999px;
  background: transparent;
  /* círculo que se desplaza para simular la fase */
  box-shadow: calc(var(--size) * .28) calc(var(--size) * -.28) 0 calc(var(--size) * .08) var(--sky);
  mix-blend-mode: normal;
  transform: translate(0, 0);
  transition: box-shadow .6s cubic-bezier(.22,1,.36,1);
}

/* Rayos del sol (salen cuando es claro) */
.moon-toggle::before {
  content: "";
  position: absolute;
  width: calc(var(--size) * 1.9);
  height: calc(var(--size) * 1.9);
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, var(--rays) 0 20%, transparent 22% 100%);
  filter: blur(6px);
  opacity: .55;
  transition: opacity .35s ease, transform .6s cubic-bezier(.22,1,.36,1);
  transform: scale(0.7);
  pointer-events: none;
}

/* Estrellas (solo se ven en oscuro) */
.moon-toggle::after {
  content: "";
  position: absolute;
  width: var(--size);
  height: var(--size);
  top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  background:
    radial-gradient(circle, var(--stars) 0 1px, transparent 2px) 4px 2px / 8px 8px,
    radial-gradient(circle, var(--stars) 0 1px, transparent 2px) 12px 10px / 10px 10px,
    radial-gradient(circle, var(--stars) 0 1px, transparent 2px) 18px 6px / 12px 12px;
  border-radius: 8px;
  opacity: 0;
  transition: opacity .4s ease .1s;
  pointer-events: none;
}

/* ESTADO OSCURO */
.is-dark .orb {
  background: var(--moon);
  /* un ligero “temblor” agradable al activar */
  transform: rotate(15deg) scale(0.96);
  box-shadow:
    0 0 0 2px rgba(255,255,255,.06) inset,
    0 2px 8px rgba(0,0,0,.3);
}

.is-dark .orb::after {
  /* aumenta la “mordida” para la luna */
  box-shadow: calc(var(--size) * .38) calc(var(--size) * -.20) 0 calc(var(--size) * .08) var(--sky);
}

.is-dark::before {
  opacity: 0;            /* rayos se apagan */
  transform: scale(0.5); /* se contraen */
}

.is-dark::after {
  opacity: 1;            /* estrellas aparecen */
}

/* Accesibilidad */
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .orb, .moon-toggle::before, .moon-toggle::after, .orb::after {
    transition: none !important;
  }
}
</style>
