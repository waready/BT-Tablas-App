<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="bt-bg flex flex-center">
        <q-card class="bt-card q-pa-lg" bordered>
          <q-form @submit.prevent="login" class="q-gutter-md" ref="formRef">
            <!-- Branding -->
            <q-card-section class="text-center q-pt-sm q-pb-md">
              <q-img src="~assets/logoB.png" alt="Bantotal" class="bt-logo" contain @error="logoFallback = true" />
              <div v-if="logoFallback" class="text-h6 text-negative">Bantotal</div>
            </q-card-section>

            <!-- Campos -->
            <q-card-section class="q-pt-none">
              <q-input dense standout="bg-white" input-class="text-black" class="bt-input" v-model="form.username" type="text"
                autocomplete="username" :label="tt('login.user', 'Usuario')" :error="errors.username"
                :error-message="tt('login.errors.required', 'Este campo es requerido')">
                <template #prepend><q-icon name="person" /></template>
              </q-input>

              <q-input dense standout="bg-white" input-class="text-black" class="bt-input q-mt-sm" v-model="form.password"
                :type="show ? 'text' : 'password'" autocomplete="current-password"
                :label="tt('login.pass', 'Contraseña')" :error="errors.password"
                :error-message="tt('login.errors.required', 'Este campo es requerido')">
                <template #prepend><q-icon name="lock" /></template>
                <template #append>
                  <q-icon :name="show ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="show = !show"
                    aria-label="Mostrar/ocultar contraseña" role="button" tabindex="0" />
                </template>
              </q-input>

              <div class="row items-center justify-between q-mt-xs">
                <q-toggle dense v-model="form.remember" :label="tt('login.remember', 'Recordarme')" color="grey-8" />
                <q-btn flat dense no-caps class="bt-link" :label="tt('login.forgot', '¿Olvidaste tu contraseña?')"
                  @click="onForgot" />
              </div>
            </q-card-section>

            <!-- CTA principal -->
            <q-card-section class="q-pt-sm">
              <q-btn class="bt-btn full-width" :label="tt('login.submit', 'Sign in')" color="dark" rounded size="md"
                no-caps type="submit" :loading="loading" />
            </q-card-section>

            <!-- Footer -->
            <q-card-section class="text-center q-pt-none">
              <div class="text-grey-7">
                Don't have an account yet?
                <a href="#" class="bt-link-strong">
                  <span class="text-red-9">Signup.</span>
                </a>
              </div>
            </q-card-section>
          </q-form>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script>
import { nextTick } from 'vue'
import { useAuthStore } from 'stores/auth'

export default {
  mounted(){
    this.$q.dark.set(false)
  },
  name: 'Login',
  data() {
    return {
      show: false,
      loading: false,
      logoFallback: false,
      form: { username: '', password: '', remember: true },
      errors: { username: false, password: false }
    }
  },
  methods: {
    tt(key, fallback) {
      try {
        const v = this.$t ? this.$t(key) : ''
        return (typeof v === 'string' && v !== key && v.trim()) ? v : fallback
      } catch (_) { return fallback }
    },
    validate() {
      this.errors.username = !this.form.username
      this.errors.password = !this.form.password
      return !(this.errors.username || this.errors.password)
    },
    async login() {
      if (!this.validate()) {
        this.$q.notify({ type: 'warning', message: this.tt('login.errors.required', 'Completa los campos requeridos') })
        return
      }

      this.loading = true
      const auth = useAuthStore()

      try {
        // Llama a tu backend
        const { data } = await this.$api.post('login', {
          username: this.form.username,
          email: this.form.username,
          password: this.form.password,
          remember: this.form.remember
          // (si tu backend requiere también "email", puedes enviar email: this.form.username)
        })

        // Guarda sesión completa (lee token || access_token, calcula exp, persiste user/roles/permissions)
        // Requiere que tengas el store con action setSession(payload) como te pasé.
        auth.setSession(data)

        // UX
        this.$q.notify({ type: 'positive', message: `Bienvenido, ${data?.user?.name || this.form.username}` })

        // Redirección segura
        await this.$nextTick?.() // o import { nextTick } y usar await nextTick()
        const q = this.$route?.query?.redirect
        const target = (typeof q === 'string' && q.trim()) ? q : { name: 'home' }
        await this.$router.replace(target)

      } catch (e) {
        const msg = (e?.response?.data?.message || e?.response?.data?.error) ||
          this.tt('login.errors.invalid', 'Credenciales inválidas')
        this.$q.notify({ type: 'negative', message: msg })
      } finally {
        this.loading = false
      }
    },

    onForgot() {
      this.$q.dialog({
        title: this.tt('login.forgot_title', 'Recuperar contraseña'),
        message: this.tt('login.forgot_msg', 'Contacte a la mesa de ayuda o utilice el portal de recuperación.'),
        ok: this.tt('ok', 'Entendido')
      })
    }
  }
}
</script>

<style scoped>
/* Fondo suave con patrón y degradé */
.bt-bg {
  min-height: 100vh;
  background:
    radial-gradient(800px 400px at 15% 5%, rgba(0, 0, 0, .04), transparent 60%),
    radial-gradient(700px 350px at 85% 95%, rgba(0, 0, 0, .035), transparent 60%),
    linear-gradient(180deg, #f6f7f9 0%, #edf0f3 100%);
}

/* Card refinada */
.bt-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, .06);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, .08),
    0 1px 0 rgba(255, 255, 255, .8) inset;
}

/* Logo centrado */
.bt-logo {
  width: 180px;
  max-width: 70%;
  filter: drop-shadow(0 0 0 transparent);
}

/* Inputs con foco elegante */
.bt-input :deep(.q-field__control) {
  border-radius: 12px;
  color: #141414;
  transition: box-shadow .18s ease, transform .08s ease, background .18s ease;
}

.bt-input :deep(.q-field--focused .q-field__control) {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, .08), 0 6px 18px rgba(0, 0, 0, .06);
  background: #fff !important;
}

/* Botón principal con gradiente y elevación */
.bt-btn {
  height: 44px;
  font-weight: 700;
  letter-spacing: .2px;
  border-radius: 12px;
  background: linear-gradient(180deg, #2b2b2b 0%, #141414 100%);
  box-shadow: 0 10px 22px rgba(0, 0, 0, .22), 0 2px 0 rgba(255, 255, 255, .08) inset;
  transition: transform .07s ease, box-shadow .18s ease, filter .18s ease;
}

.bt-btn:hover {
  filter: brightness(1.03);
  box-shadow: 0 14px 28px rgba(0, 0, 0, .26);
}

.bt-btn:active {
  transform: translateY(1px) scale(.998);
}

/* Links */
.bt-link,
.bt-link-strong {
  color: #5f6b7a !important;
}

.bt-link:hover {
  text-decoration: underline;
}

.bt-link-strong {
  font-weight: 600;
  text-decoration: none;
}
</style>
