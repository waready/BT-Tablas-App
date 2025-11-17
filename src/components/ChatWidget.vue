<template>
  <div>
    <!-- FAB FLOTANTE -->
    <q-btn
      fab
      icon="chat"
      class="chat-fab"
      color="primary"
      unelevated
      @click="toggleChat"
    >
      <q-tooltip>Asistente BT-Tablas</q-tooltip>
    </q-btn>

    <!-- CONTENEDOR DEL CHAT -->
    <transition name="chat-slide">
      <div v-if="isOpen" class="chat-shell">
        <q-card class="chat-card">
          <!-- HEADER -->
          <div class="chat-header">
            <div class="row items-center no-wrap">
              <q-avatar size="32px" class="q-mr-sm">
                <q-icon name="smart_toy" />
              </q-avatar>
              <div class="col">
                <div class="text-weight-medium text-body1">
                  Asistente BT-Tablas
                </div>
                <div class="row items-center text-caption text-positive">
                  <span
                    class="status-dot q-mr-xs"
                    :class="{ 'status-dot--idle': !isReady }"
                  />
                  <span>{{ isReady ? 'En línea' : 'Conectando...' }}</span>
                </div>
              </div>
              <q-btn
                round
                dense
                flat
                icon="close"
                @click="toggleChat"
              />
            </div>
          </div>

          <!-- CUERPO (MENSAJES) -->
          <q-scroll-area
            ref="scrollArea"
            class="chat-messages"
          >
            <div class="q-pa-md">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="q-mb-sm"
                :class="msg.from === 'user' ? 'justify-end row' : 'row'"
              >
                <div
                  class="bubble-wrapper"
                  :class="msg.from === 'user' ? 'bubble-wrapper--right' : 'bubble-wrapper--left'"
                >
                  <div
                    class="bubble"
                    :class="msg.from === 'user'
                      ? 'bubble--user'
                      : 'bubble--bot'"
                  >
                    <div class="bubble-text">
                      {{ msg.text }}
                    </div>
                    <div class="bubble-meta">
                      {{ formatTime(msg.ts) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Indicador escribiendo -->
              <div v-if="isTyping" class="row">
                <div class="bubble-wrapper bubble-wrapper--left">
                  <div class="bubble bubble--bot typing-bubble">
                    <span class="typing-dot" />
                    <span class="typing-dot" />
                    <span class="typing-dot" />
                  </div>
                </div>
              </div>
            </div>
          </q-scroll-area>

          <!-- INPUT -->
          <div class="chat-input">
            <q-input
              v-model="draft"
              dense
              standout="bg-grey-2 text-body1"
              :placeholder="isReady ? 'Escribe tu mensaje…' : 'Conectando…'"
              borderless
              @keyup.enter="handleEnter"
            >
              <template #prepend>
                <q-btn
                  round
                  dense
                  flat
                  icon="refresh"
                  @click="resetConversation"
                >
                  <q-tooltip>Reiniciar conversación</q-tooltip>
                </q-btn>
              </template>

              <template #append>
                <q-btn
                  round
                  dense
                  flat
                  icon="send"
                  :disable="!canSend"
                  :loading="sending"
                  @click="sendMessage"
                />
              </template>
            </q-input>
          </div>
        </q-card>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const isOpen = ref(false)
const isReady = ref(true) // si quisieras hacer un "handshake" con el back, lo manejas aquí
const sending = ref(false)
const isTyping = ref(false)
const draft = ref('')

const currentUserId = ref('user-1')

const messages = ref([
  {
    id: 'welcome-1',
    from: 'bot',
    text: 'Hola 👋 Soy el asistente de BT-Tablas.\nCuéntame qué necesitas consultar del inventario.',
    ts: new Date()
  }
])

const scrollArea = ref(null)

const canSend = computed(() =>
  draft.value.trim().length > 0 && !sending.value && isReady.value
)

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    // pequeño delay para que exista el scrollArea
    nextTick(scrollToBottom)
  }
}

const scrollToBottom = () => {
  if (!scrollArea.value) return
  // scroll vertical muy abajo
  scrollArea.value.setScrollPosition('vertical', 999999, 250)
}

const formatTime = (date) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const pushMessage = (msg) => {
  messages.value.push({
    id: msg.id || String(Date.now() + Math.random()),
    ts: msg.ts || new Date(),
    ...msg
  })
  nextTick(scrollToBottom)
}

const resetConversation = () => {
  messages.value = [
    {
      id: 'welcome-1',
      from: 'bot',
      text: 'Conversación reiniciada ✅ ¿En qué más te ayudo?',
      ts: new Date()
    }
  ]
  draft.value = ''
}

// ENTER sin Shift envía
const handleEnter = (evt) => {
  if (!evt.shiftKey) {
    evt.preventDefault()
    sendMessage()
  }
}

const sendMessage = async () => {
  if (!canSend.value) return

  const text = draft.value.trim()
  draft.value = ''
  sending.value = true

  // 1) mensaje del usuario
  pushMessage({
    from: 'user',
    text,
    userId: currentUserId.value
  })

  try {
    // 2) indicador "escribiendo"
    isTyping.value = true

    // 3) llamada al backend (ajusta la ruta a la tuya real)
    let replyText = 'No pude obtener una respuesta del servidor 😕'

    if (window.$api) {
      const { data } = await window.$api.post('/api/v1/chat', {
        message: text
      })
      // ajusta según tu respuesta real
      replyText = data?.reply || data?.message || JSON.stringify(data)
    } else {
      // fallback demo
      await new Promise(r => setTimeout(r, 700))
      replyText = 'Respuesta de ejemplo del asistente (conecta tu API en /api/v1/chat).'
    }

    // 4) mostramos respuesta del bot
    isTyping.value = false
    pushMessage({
      from: 'bot',
      text: replyText
    })
  } catch (err) {
    console.error(err)
    isTyping.value = false
    pushMessage({
      from: 'bot',
      text: 'Se produjo un error al contactar al servidor. Inténtalo de nuevo en unos segundos 🙏'
    })
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* FAB FLOTANTE */
.chat-fab {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2100;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
}

/* CONTENEDOR */
.chat-shell {
  position: fixed;
  right: 18px;
  bottom: 86px;
  z-index: 2100;
  width: 380px;
  max-height: 72vh;
}

.chat-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.35);
}

/* HEADER */
.chat-header {
  padding: 10px 14px;
  background: linear-gradient(135deg, #2563eb, #0ea5e9);
  color: white;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25);
}

.status-dot--idle {
  background: #facc15;
  box-shadow: 0 0 0 4px rgba(250, 204, 21, 0.25);
}

/* MENSAJES */
.chat-messages {
  height: 330px;
  background: linear-gradient(180deg, #f9fafb, #eef2ff);
}

.body--dark .chat-messages {
  background: radial-gradient(circle at top, #111827, #020617);
}

.bubble-wrapper {
  max-width: 80%;
  display: flex;
}

.bubble-wrapper--right {
  justify-content: flex-end;
  margin-left: auto;
}

.bubble-wrapper--left {
  justify-content: flex-start;
  margin-right: auto;
}

.bubble {
  border-radius: 16px;
  padding: 8px 11px 6px;
  font-size: 0.88rem;
  line-height: 1.4;
  white-space: pre-line;
}

.bubble--user {
  background: #2563eb;
  color: white;
  border-bottom-right-radius: 4px;
}

.bubble--bot {
  background: white;
  color: #0f172a;
  border-bottom-left-radius: 4px;
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.body--dark .bubble--bot {
  background: rgba(15, 23, 42, 0.9);
  color: #e5e7eb;
  border-color: rgba(30, 64, 175, 0.6);
}

.bubble-text {
  word-break: break-word;
}

.bubble-meta {
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 2px;
  text-align: right;
}

/* Typing indicator */
.typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #94a3b8;
  animation: typing 1s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  40% {
    transform: translateY(-3px);
    opacity: 1;
  }
}

/* INPUT */
.chat-input {
  padding: 8px 10px 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(248, 250, 252, 0.95);
}

.body--dark .chat-input {
  background: rgba(15, 23, 42, 0.96);
  border-top-color: rgba(30, 64, 175, 0.7);
}

/* TRANSICIÓN */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.18s ease-out;
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  transform: translateY(10px) scale(0.98);
  opacity: 0;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .chat-shell {
    left: 8px;
    right: 8px;
    width: auto;
    bottom: 80px;
  }
}
</style>
