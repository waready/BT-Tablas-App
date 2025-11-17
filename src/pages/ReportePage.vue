<template>
  <q-page class="q-pa-md">
    <q-card>
      <!-- HEADER -->
      <q-card-section>
        <div class="row items-center justify-between">
          <div>
            <div class="text-h5 text-weight-bold">Editor de consultas SQL</div>
            <div class="text-caption text-grey-7">
              Genera reportes en Excel a partir de tus consultas sobre el modelo BT-Tablas.
            </div>
          </div>

          <div class="row items-center q-gutter-sm">
            <q-btn
              flat
              round
              dense
              icon="schema"
              color="primary"
              @click="openErModal"
            >
              <q-tooltip>Ver modelo de datos</q-tooltip>
            </q-btn>

            <q-btn
              flat
              round
              dense
              icon="refresh"
              @click="resetEditor"
              :disable="isGenerating"
            >
              <q-tooltip>Limpiar consulta</q-tooltip>
            </q-btn>
          </div>
        </div>

        <q-banner class="bg-warning text-black q-mt-md">
          Recuerda que solo se permiten hasta <strong>26 columnas (A - Z)</strong>.
        </q-banner>
      </q-card-section>

      <q-separator inset />

      <!-- EDITOR SQL -->
      <q-card-section>
        <div class="row items-center q-gutter-sm q-mb-sm">
          <q-icon name="terminal" size="22px" color="primary" />
          <div class="text-subtitle2 text-weight-medium">
            Consulta SQL
          </div>
        </div>

        <div id="editor" class="q-mt-sm editor-sql"></div>

        <div class="row justify-end q-mt-md">
          <q-btn
            color="primary"
            label="Generar reporte"
            icon="download"
            :loading="isGenerating"
            @click="generarReporte"
          />
        </div>

        <!-- ERROR -->
        <q-banner v-if="errorMsg" class="bg-red text-white q-mt-md">
          {{ errorMsg }}
        </q-banner>

        <!-- ÉXITO -->
        <q-banner v-if="successMsg" class="bg-green text-white q-mt-md">
          {{ successMsg }}
        </q-banner>
      </q-card-section>
    </q-card>

    <!-- MODAL: DIAGRAMA ER -->
    <q-dialog
      v-model="showErModal"
      persistent
      :maximized="maximizedToggle"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="column bg-white-er full-width full-height">
        <!-- BARRA SUPERIOR TIPO VENTANA -->
        <q-bar class="bg-primary text-white">
          <div class="row items-center q-gutter-sm">
            <q-icon name="schema" size="20px" />
            <div class="text-subtitle2">
              Modelo de datos BT-Tablas
            </div>
          </div>

          <q-space />

          <q-btn
            dense
            flat
            icon="minimize"
            @click="maximizedToggle = false"
            :disable="!maximizedToggle"
          >
            <q-tooltip v-if="maximizedToggle" class="bg-white text-primary">
              Minimizar
            </q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            icon="crop_square"
            @click="maximizedToggle = true"
            :disable="maximizedToggle"
          >
            <q-tooltip v-if="!maximizedToggle" class="bg-white text-primary">
              Maximizar
            </q-tooltip>
          </q-btn>

          <q-btn
            dense
            flat
            icon="close"
            @click="showErModal = false"
          >
            <q-tooltip class="bg-white text-primary">Cerrar</q-tooltip>
          </q-btn>
        </q-bar>

        <!-- HEADER CONTENIDO -->
        <q-card-section class="row items-start justify-between">
          <div class="row items-start q-gutter-sm">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Modelo de datos BT-Tablas
              </div>
              <div class="text-caption text-grey-7">
                Referencia rápida para armar tus <strong>JOIN</strong> entre
                <code>inventariotabla</code>, <code>sistemas</code>,
                <code>areafuncional</code>, <code>paises</code>,
                <code>catalogversion</code> y seguridad
                (<code>users</code>, <code>role</code>, <code>permission</code>).
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="col q-pt-md q-pb-lg scroll">
          <!-- Leyenda -->
          <div class="row q-gutter-sm q-mb-md">
            <q-badge color="primary" outline>PK</q-badge>
            <q-badge color="secondary" outline>FK</q-badge>
            <q-badge color="grey-7" outline>Relaciones principales</q-badge>
          </div>

          <div id="er-diagram-modal" class="er-diagram">
            <!-- Mermaid inyecta aquí el SVG -->
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ApiService from 'src/ApiService'
import ace from 'ace-builds'
import 'ace-builds/src-noconflict/mode-sql'
import 'ace-builds/src-noconflict/theme-monokai'
import mermaid from 'mermaid'

const errorMsg = ref('')
const successMsg = ref('')
const isGenerating = ref(false)
const showErModal = ref(false)
const maximizedToggle = ref(true) // 👈 controla pantalla completa
let editor

// ========================
// DIAGRAMA ER (Mermaid)
// ========================
const erCode = `
erDiagram
  %% =====================
  %% RELACIONES
  %% =====================
  users          ||--o{ userrole        : "tiene roles"
  role           ||--o{ userrole        : "asignado a usuarios"

  role           ||--o{ rolepermission  : "tiene permisos"
  permission     ||--o{ rolepermission  : "pertenece a roles"

  users          ||--o{ auditlog        : "registra acciones"
  users          ||--o{ inventariotabla : "crea registros"

  catalogversion ||--o{ areafuncional   : "versiona áreas"
  catalogversion ||--o{ sistemas        : "versiona sistemas"
  catalogversion ||--o{ inventariotabla : "versiona tablas"

  areafuncional  ||--o{ sistemas        : "tiene sistemas"
  areafuncional  ||--o{ inventariotabla : "tiene tablas"

  sistemas       ||--o{ inventariotabla : "tiene tablas"
  paises         ||--o{ inventariotabla : "tiene tablas"

  %% =============
  %% TABLAS
  %% =============

  users {
    string  id PK
    string  email
    string  password
    string  name
    boolean isActive
    string  username
    string  nombre
    string  login_ldap
    string  avatar_url
    string  foto
    int     externo_id
    string  rol_externo
    date    created_at
    date    updated_at
  }

  role {
    string id PK
    string name
    string description
    date   createdAt
  }

  permission {
    string id PK
    string action
    string resource
    string description
  }

  userrole {
    string userId FK
    string roleId FK
  }

  rolepermission {
    string roleId       FK
    string permissionId FK
  }

  auditlog {
    string id PK
    string userId FK
    string action
    string entity
    string entityId
    string metadata
    string ip
    date   createdAt
  }

  catalogversion {
    int    id PK
    string code
    string name
    boolean isActive
    date   created_at
    date   updated_at
  }

  areafuncional {
    int    id PK
    string nombre
    int    codigo
    date   created_at
    date   updated_at
    int    versionId FK
  }

  sistemas {
    int    id PK
    int    cod_area_funcional
    int    cod_sistema
    int    corr
    string sistema
    date   created_at
    date   updated_at
    int    versionId FK
  }

  paises {
    int    id PK
    string nombre
    string isoCode
    date   created_at
    date   updated_at
  }

  inventariotabla {
    int     id PK
    string  codigo
    string  descripcion
    string  datos
    string  en_desarrollo
    string  capa
    string  usuario
    string  documento_detalle
    boolean depende_de_la_plaza
    string  comentarios
    boolean depende_del_entorno
    string  ambiente_testing
    boolean borrar
    int     areaFuncionalId FK
    int     sistemaId       FK
    int     paisId          FK
    string  userId          FK
    int     versionId       FK
    date    created_at
    date    updated_at
  }
`

const renderErDiagram = async () => {
  await nextTick()
  const container = document.getElementById('er-diagram-modal')
  if (!container) return

  try {
    const { svg } = await mermaid.render('er-diagram-svg', erCode)
    container.innerHTML = svg
  } catch (e) {
    console.error('Error renderizando Mermaid', e)
    container.innerHTML =
      '<div style="color:#f00;font-size:12px">No se pudo renderizar el diagrama ER.</div>'
  }
}

const openErModal = async () => {
  maximizedToggle.value = true // abre ya en pantalla completa
  showErModal.value = true
  await renderErDiagram()
}

// ========================
// ACE EDITOR
// ========================

const initEditor = () => {
  editor = ace.edit('editor')
  editor.setTheme('ace/theme/monokai')
  editor.session.setMode('ace/mode/sql')
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    fontSize: 14,
    tabSize: 2,
    useSoftTabs: true
  })

  editor.session.setValue(
`-- Ejemplo: consulta sobre inventariotabla + sistemas + areafuncional + paises + catalogversion
SELECT  it.codigo,
        it.descripcion,
        s.sistema                AS sistema,
        af.nombre                AS area_funcional,
        p.nombre                 AS pais,
        cv.name                  AS version
FROM    inventariotabla it
LEFT JOIN sistemas       s  ON s.id  = it.sistemaId
LEFT JOIN areafuncional  af ON af.id = it.areaFuncionalId
LEFT JOIN paises         p  ON p.id  = it.paisId
LEFT JOIN catalogversion cv ON cv.id = it.versionId
LIMIT  100;
`
  )
}

// ========================
// MENSAJES & ERRORES
// ========================

const mostrarError = (msg) => {
  errorMsg.value = msg
  successMsg.value = ''
  isGenerating.value = false
  setTimeout(() => {
    errorMsg.value = ''
  }, 5000)
}

const mostrarSuccess = (msg) => {
  successMsg.value = msg
  errorMsg.value = ''
  isGenerating.value = false
  setTimeout(() => {
    successMsg.value = ''
  }, 5000)
}

const parseErrorData = async (data) => {
  if (!data) return null
  if (data instanceof Blob) {
    const text = await data.text()
    try {
      return JSON.parse(text)
    } catch {
      return { message: text }
    }
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data)
    } catch {
      return { message: data }
    }
  }

  if (typeof data === 'object') return data
  return null
}

const construirMensajeError = (data) => {
  if (!data) return 'Error al generar el reporte'
  let msg = data.message || data.error || 'Error al generar el reporte'

  if (data.code === 'P2010') {
    const m = data.message || ''
    if (m.includes('You have an error in your SQL syntax')) {
      const near = m.match(/near '([^']+)' at line/i)
      if (near && near[1]) {
        msg = `Error de sintaxis en la consulta SQL cerca de '${near[1]}'`
      } else {
        msg = 'Error de sintaxis en la consulta SQL.'
      }
    }
    if (m.includes('Unknown column')) {
      msg = 'Error en la consulta: se está usando una columna que no existe.'
    }
  }

  return msg
}

// ========================
// ACCIONES
// ========================

const generarReporte = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  isGenerating.value = true
  const query = editor.getValue()

  try {
    const res = await ApiService.GetConsultaQuery({ query })

    const blob = res.data
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reporte.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)

    mostrarSuccess('Reporte generado correctamente.')
  } catch (err) {
    let data = null
    if (err.response) {
      data = await parseErrorData(err.response.data)
    }
    const msg = construirMensajeError(data)
    mostrarError(msg)
  }
}

const resetEditor = () => {
  if (!editor) return
  editor.session.setValue('')
}

// ========================
// MONTAJE
// ========================

onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose'
  })

  initEditor()
})
</script>

<style scoped>
.editor-sql {
  height: 320px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* Modal / ER */
.er-diagram {
  border-radius: 12px;
  padding: 12px;
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.06);
  max-width: 100%;
  min-height: 260px;
  overflow: auto;
}

.er-diagram svg {
  max-width: 100%;
}

.body--dark .er-diagram {
  background: #141414;
  border-color: rgba(255, 255, 255, 0.08);
}

.bg-white-er {
  border-radius: 18px;
  box-shadow:
    0 10px 35px rgba(15, 23, 42, 0.14),
    0 1px 0 rgba(148, 163, 184, 0.4);
}
</style>
