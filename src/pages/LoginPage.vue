<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="bt-bg row items-center justify-center">
        <!-- Glows decorativos -->
        <div class="bt-glow bt-glow--1"></div>
        <div class="bt-glow bt-glow--2"></div>

        <q-card class="bt-card q-pa-xl" bordered>
          <!-- Branding -->
          <div class="column items-center q-gutter-xs q-mb-lg">
            <img
              src="~assets/logo.png"
              alt="Bantotal"
              class="bt-logo"
              width="160"
              height="40"
              decoding="async"
              draggable="false"
              @error="logoFallback = true"
            />
            <div v-if="logoFallback" class="text-h5" style="color:#DA291C">Bantotal</div>

            <div class="bt-title">{{ tt('login.title', 'Acceso a Bantotal') }}</div>
          </div>

          <!-- Formulario -->
          <q-form @submit.prevent="onSubmit" class="q-gutter-md" ref="formRef">
            <div class="bt-field">
              <label class="bt-label">{{ tt('login.user', 'Usuario') }}</label>
              <q-input
                dense filled
                v-model="form.username"
                autocomplete="username"
                :error="errors.username"
                :error-message="tt('login.errors.required', 'Este campo es requerido')"
              >
                <template #prepend><q-icon name="person" /></template>
              </q-input>
            </div>

            <div class="bt-field">
              <label class="bt-label">{{ tt('login.pass', 'Contraseña') }}</label>
              <q-input
                dense filled
                v-model="form.password"
                :type="show ? 'text' : 'password'"
                autocomplete="current-password"
                :error="errors.password"
                :error-message="tt('login.errors.required', 'Este campo es requerido')"
              >
                <template #prepend><q-icon name="lock" /></template>
                <template #append>
                  <q-icon
                    :name="show ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer"
                    @click="show = !show"
                    aria-label="Mostrar/ocultar contraseña"
                    role="button"
                    tabindex="0"
                  />
                </template>
              </q-input>
            </div>

            <!-- Opciones -->
            <div class="row items-center justify-between q-pt-xs q-pb-none">
              <q-toggle
                dense
                v-model="form.remember"
                :label="tt('login.remember', 'Recordarme en este equipo')"
                :style="{ color: css.gray9 }"
              />
              <q-btn
                flat dense no-caps
                class="bt-link"
                :label="tt('login.forgot', '¿Olvidaste tu contraseña?')"
                @click="onForgot"
              />
            </div>

            <!-- CTA principal -->
            <q-btn
              type="submit"
              class="bt-btn q-mt-sm"
              no-caps
              :loading="loading"
              :label="tt('login.submit', 'Ingresar')"
            />

            <q-separator spaced class="bt-sep" />

            <!-- SSO -->
            <q-btn
              outline no-caps
              class="bt-btn--secondary"
              icon="domain"
              :label="tt('login.sso', 'Ingresar con SSO')"
              @click="onSSO"
            />
          </q-form>

          <div class="bt-legal q-mt-lg">
            {{ tt('login.foot_legal', 'Acceso restringido. La actividad puede ser monitoreada según políticas de la organización.') }}
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { useAuthStore } from 'stores/auth' // ⬅️ si no resuelve, usa '../stores/auth'

export default {
  name: 'LoginStandalone',
  data () {
    return {
      show: false,
      loading: false,
      logoFallback: false,
      form: { username: '', password: '', remember: true },
      errors: { username: false, password: false },
      css: {
        primary: '#DA291C',
        gray9:  '#8D8F91',
        gray4:  '#E0E2E3',
        darkBg: '#0E1114',
        cardBg: '#15191D'
      }
    }
  },
  methods: {
    tt (key, fallback) {
      try {
        const v = this.$t ? this.$t(key) : ''
        return (typeof v === 'string' && v !== key && v.trim()) ? v : fallback
      } catch (_) { return fallback }
    },
    validate () {
      this.errors.username = !this.form.username
      this.errors.password = !this.form.password
      return !(this.errors.username || this.errors.password)
    },
    async onSubmit () {
      if (!this.validate()) {
        this.$q.notify({ type: 'warning', message: this.tt('login.errors.required', 'Completa los campos requeridos') })
        return
      }
      this.loading = true
      try {
        // 🔐 Fastify setea cookie httpOnly (RT) y devuelve { access_token, expires_in }
        const { data } = await this.$api.post('/api/v1/login', {
          email: this.form.username,
          username: this.form.username,
          password: this.form.password,
          remember: this.form.remember
        })

        const auth = useAuthStore()
        auth.setAccessToken(data.access_token, data.expires_in || 3600)

        this.$q.notify({ type: 'positive', message: `Bienvenido, ${this.form.username}` })
        this.$router.push({ name: 'home' })
      } catch (e) {
        this.$q.notify({ type: 'negative', message: this.tt('login.errors.invalid', 'Credenciales inválidas') })
      } finally {
        this.loading = false
      }
    },
    onForgot () {
      this.$q.dialog({
        title: 'Recuperar contraseña',
        message: 'Contacte a la mesa de ayuda o utilice el portal de recuperación.',
        ok: 'Entendido'
      })
    },
    onSSO () { this.$q.notify({ message: 'Redirigiendo a proveedor SSO…' }) }
  }
}
</script>

<style scoped>
.bt-logo { height: 48px; object-fit: contain; }
.bt-title { font-size: 22px; font-weight: 600; letter-spacing: .2px; }
@media (min-width: 1024px) { .bt-logo { height: 56px; } .bt-title { font-size: 24px; } }

:root {
  --bt-primary: #DA291C;
  --bt-gray9:  #8D8F91;
  --bt-gray4:  #E0E2E3;
  --bt-darkBg: #0E1114;
  --bt-cardBg: #15191D;
}

.bt-bg {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 15% 10%, rgba(218,41,28,.08), transparent 60%),
    radial-gradient(900px 500px at 85% 90%, rgba(218,41,28,.06), transparent 60%),
    var(--bt-darkBg);
  position: relative;
  overflow: hidden;
}
.bt-glow { position: absolute; filter: blur(40px); opacity: .35; pointer-events: none; }
.bt-glow--1 { width: 420px; height: 420px; border-radius: 50%; background: rgba(218,41,28,.20); top: -120px; left: -80px; }
.bt-glow--2 { width: 520px; height: 520px; border-radius: 50%; background: rgba(218,41,28,.12); bottom: -160px; right: -140px; }

.bt-card {
  width: 100%;
  max-width: 460px;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(21,25,29,.85) 0%, rgba(21,25,29,.95) 100%);
  backdrop-filter: saturate(140%) blur(8px);
  border: 1px solid rgba(224,226,227,.06);
  box-shadow: 0 16px 50px rgba(0,0,0,.48), 0 1px 0 rgba(255,255,255,.04) inset;
}

.bt-field { display: grid; gap: 6px; }
.bt-label { font-size: 12px; color: var(--bt-gray9); letter-spacing: .2px; }
:deep(.q-field--filled .q-field__control) { border-radius: 12px; background: rgba(255,255,255,.04); transition: box-shadow .2s ease, background .2s ease; }
:deep(.q-field--filled.q-field--focused .q-field__control) { box-shadow: 0 0 0 2px rgba(218,41,28,.35); background: rgba(255,255,255,.06); }

.bt-btn {
  width: 100%;
  border-radius: 14px;
  height: 42px;
  font-weight: 600;
  letter-spacing: .2px;
  background: var(--bt-primary);
  color: #fff;
  box-shadow: 0 8px 20px rgba(218,41,28,.25);
  transition: transform .08s ease, box-shadow .2s ease, filter .2s ease;
}
.bt-btn:hover { filter: brightness(1.03); }
.bt-btn:active { transform: translateY(1px) scale(0.998); }

.bt-btn--secondary {
  width: 100%;
  border-radius: 14px;
  height: 42px;
  font-weight: 600;
  letter-spacing: .2px;
  color: var(--bt-gray9);
  border-color: rgba(224,226,227,.22) !important;
}

.bt-link { color: var(--bt-gray4) !important; opacity: .9; }
.bt-link:hover { opacity: 1; }
.bt-sep { opacity: .6; border-color: rgba(224,226,227,.12) !important; }
.bt-legal { text-align: center; font-size: 11px; color: var(--bt-gray9); }
</style>
