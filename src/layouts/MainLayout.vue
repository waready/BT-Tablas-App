<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'">
      <q-toolbar class="app-toolbar">
        <div class="row items-center no-wrap q-gutter-sm">
          <q-btn class="btn-soft" flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
          <div class="brand">
            <!-- Logo opcional -->
            <!-- <q-avatar size="26px" class="brand-logo"><img src="/logo.svg" /></q-avatar> -->
            <div class="brand-name">
              <span>BT</span><span class="muted">-Tablas</span>
              <i class="brand-underline" />
            </div>
          </div>
        </div>

        <q-space />
        <div class="only-lg text-center">
          <q-badge :class="['ver-badge', $q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark']" outline :label="`v${$q.version}`" />
        </div>
        <q-space />

        <!-- Right: search + actions -->
        <div class="row items-center no-wrap q-gutter-sm">
          <q-btn class="btn-soft" flat dense round :icon="$q.dark.isActive ? 'dark_mode' : 'light_mode'"
            :aria-label="$q.dark.isActive ? 'Desactivar modo oscuro' : 'Activar modo oscuro'"
            @click="onToggleDark($event)" />

          <q-btn class="btn-soft" flat dense round icon="notifications_none" />
          <q-btn class="btn-soft" flat dense round>
            <q-avatar size="24px">
              <img src="https://i.pravatar.cc/80?img=3" alt="user">
            </q-avatar>
            <q-menu anchor="bottom right" self="top right">
              <q-list style="min-width: 180px">
                <q-item clickable v-ripple><q-item-section>Mi perfil</q-item-section></q-item>
                <q-item clickable v-ripple><q-item-section>Preferencias</q-item-section></q-item>
                <q-separator />
                <q-item clickable v-ripple><q-item-section>Cerrar sesión</q-item-section></q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered
      :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'">
      <q-list>
        <q-item-label header>Essential Links</q-item-label>
        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
        <q-separator spaced />
        <q-item clickable v-ripple @click="onToggleDark($event)">
          <q-item-section avatar><q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" /></q-item-section>
          <q-item-section>{{ $q.dark.isActive ? 'Tema oscuro' : 'Tema claro' }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container :class="$q.dark.isActive ? 'bg-dark-page' : 'bg-grey-2'">
      <router-view />
    </q-page-container>

</q-layout>
</template>

<script>
import { defineComponent } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import { toggleDarkEclipse } from 'src/utils/eclipseDark'

const linksList = [
  { title: 'Docs', caption: 'quasar.dev', icon: 'school', link: 'https://quasar.dev' },
  { title: 'Github', caption: 'github.com/quasarframework', icon: 'code', link: 'https://github.com/quasarframework' },
  { title: 'Discord Chat Channel', caption: 'chat.quasar.dev', icon: 'chat', link: 'https://chat.quasar.dev' },
  { title: 'Forum', caption: 'forum.quasar.dev', icon: 'record_voice_over', link: 'https://forum.quasar.dev' },
  { title: 'Twitter', caption: '@quasarframework', icon: 'rss_feed', link: 'https://twitter.quasar.dev' },
  { title: 'Facebook', caption: '@QuasarFramework', icon: 'public', link: 'https://facebook.quasar.dev' },
  { title: 'Quasar Awesome', caption: 'Community Quasar projects', icon: 'favorite', link: 'https://awesome.quasar.dev' }
]

export default defineComponent({
  name: 'MainLayout',
  components: { EssentialLink },

  data() {
    return {
      linksList,
      leftDrawerOpen: false
    }
  },

  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen
    },
    onToggleDark(evt) {
      toggleDarkEclipse(evt, {
        darkBg: '#121212',
        lightBg: '#ffffff',
        duration: 700,
        mode: 'reveal'
      })
    }
  }
})
</script>
<style scoped>
.app-header {
  background: rgba(255, 255, 255, .75);
  backdrop-filter: saturate(1.2) blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, .06);
}

.body--dark .app-header {
  background: rgba(18, 18, 18, .65);
  border-bottom: 1px solid rgba(255, 255, 255, .08);
}

.app-toolbar {
  min-height: 56px;
  padding-inline: 10px;
}

.btn-soft {
  transition: transform .15s ease, background-color .15s ease;
  border-radius: 999px;
}

.btn-soft:hover {
  background: rgba(0, 0, 0, .06)
}

.body--dark .btn-soft:hover {
  background: rgba(255, 255, 255, .08)
}

.btn-soft:active {
  transform: scale(.96)
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-logo {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .08);
}

.brand-name {
  position: relative;
  line-height: 1;
  font-weight: 700;
  letter-spacing: .2px;
  font-size: 16px;
}

.brand-name .muted {
  opacity: .75;
  font-weight: 600
}

.brand-underline {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 2px;
  display: inline-block;
  border-radius: 2px;
  background: linear-gradient(90deg, #CE1F22, transparent);
  transform: scaleX(.6);
  transform-origin: left;
  opacity: .7;
  transition: transform .25s ease, opacity .25s ease;
}

.brand-name:hover .brand-underline {
  transform: scaleX(1);
  opacity: 1
}

.ver-badge {
  font-weight: 600;
  border-color: currentColor;
  opacity: .85;
}

.search-input {
  min-width: 220px;
  border-radius: 10px;
  background: rgba(0, 0, 0, .04);
}

.search-input .q-field__control {
  height: 36px
}

.body--dark .search-input {
  background: rgba(255, 255, 255, .06)
}

.only-lg {
  display: none
}

.only-sm-up {
  display: none
}

@media (min-width: 1024px) {
  .only-lg {
    display: block
  }
}

@media (min-width: 600px) {
  .only-sm-up {
    display: block
  }
}
</style>
