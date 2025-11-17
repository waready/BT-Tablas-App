<template>
  <q-page :class="['q-pa-md', $q.dark.isActive ? 'bg-grey-10' : 'bg-grey-1']">

    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">Panel de control</div>
        <div class="text-caption text-grey-7">
          Resumen ejecutivo de países, áreas funcionales, sistemas, tablas y usuarios.
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          flat
          round
          dense
          icon="refresh"
          color="primary"
          :loading="loading"
          @click="loadDashboard"
        />
      </div>
    </div>

    <!-- ERROR -->
    <q-banner
      v-if="error"
      class="bg-red-8 text-white q-mb-md"
      rounded
      dense
      inline-actions
    >
      {{ error }}
      <template #action>
        <q-btn flat color="white" label="Reintentar" @click="loadDashboard" />
      </template>
    </q-banner>

    <!-- CARDS KPIs -->
    <div class="row q-col-gutter-md q-mb-md">
      <div
        v-for="card in summaryCards"
        :key="card.key"
        class="col-12 col-sm-6 col-md-4 col-lg-2"
      >
        <q-card class="card-kpi">
          <q-card-section class="q-pb-xs row items-center justify-between">
            <div class="text-caption text-grey-5 text-uppercase">
              {{ card.label }}
            </div>
            <q-icon
              :name="card.icon"
              size="20px"
              class="text-primary"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="text-h5 text-weight-bold">
              {{ card.value }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ROW 2: SISTEMAS POR ÁREA / TABLAS POR SISTEMA -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="q-pb-none row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-medium">
                Sistemas por área funcional
              </div>
              <div class="text-caption text-grey-6">
                Distribución de sistemas en cada área.
              </div>
            </div>
          </q-card-section>
          <q-card-section>
            <VueApexCharts
              v-if="chartSistemasPorArea.series[0].data.length"
              type="bar"
              height="280"
              :options="chartSistemasPorArea.options"
              :series="chartSistemasPorArea.series"
            />
            <div
              v-else
              class="text-caption text-grey-6 text-center q-pa-md"
            >
              No hay datos para mostrar.
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card class="chart-card">
          <q-card-section class="q-pb-none row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-medium">
                Top sistemas por número de tablas
              </div>
              <div class="text-caption text-grey-6">
                Sistemas con mayor cantidad de tablas inventariadas.
              </div>
            </div>
            <q-badge color="primary" outline>
              Top {{ tablasPorSistemaLimit }}
            </q-badge>
          </q-card-section>
          <q-card-section>
            <VueApexCharts
              v-if="chartTablasPorSistema.series[0].data.length"
              type="bar"
              height="280"
              :options="chartTablasPorSistema.options"
              :series="chartTablasPorSistema.series"
            />
            <div
              v-else
              class="text-caption text-grey-6 text-center q-pa-md"
            >
              No hay datos para mostrar.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- ROW 3: TABLAS POR MES / USUARIOS POR ROL -->
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-card class="chart-card">
          <q-card-section class="q-pb-none row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-medium">
                Tablas registradas por mes
              </div>
              <div class="text-caption text-grey-6">
                Evolución de registros en el inventario de tablas.
              </div>
            </div>
            <div class="row items-center q-gutter-xs">
              <q-icon name="event" size="16px" class="text-grey-7" />
              <span class="text-caption text-grey-7">
                {{ tablasPorMesYear }}
              </span>
            </div>
          </q-card-section>
          <q-card-section>
            <VueApexCharts
              v-if="chartTablasPorMes.series[0].data.length"
              type="line"
              height="280"
              :options="chartTablasPorMes.options"
              :series="chartTablasPorMes.series"
            />
            <div
              v-else
              class="text-caption text-grey-6 text-center q-pa-md"
            >
              No hay datos para mostrar.
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-4">
        <q-card class="chart-card">
          <q-card-section class="q-pb-none">
            <div class="text-subtitle1 text-weight-medium">
              Usuarios por rol
            </div>
            <div class="text-caption text-grey-6">
              Distribución de usuarios activos por rol.
            </div>
          </q-card-section>
          <q-card-section>
            <VueApexCharts
              v-if="chartUsuariosPorRol.series.length"
              type="donut"
              height="260"
              :options="chartUsuariosPorRol.options"
              :series="chartUsuariosPorRol.series"
            />
            <div
              v-else
              class="text-caption text-grey-6 text-center q-pa-md"
            >
              No hay datos para mostrar.
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import ApiService from 'src/ApiService'

const loading = ref(false)
const error = ref('')

const summaryCards = ref([])

const tablasPorSistemaLimit = 5
const tablasPorMesYear = new Date().getFullYear()

// === COLORES ===
const primaryColor = '#1976D2'
const secondaryColor = '#26A69A'
const accentColor = '#FFB300'

// === CONFIG CHARTS ===
const chartSistemasPorArea = ref({
  options: {
    chart: { toolbar: { show: false } },
    grid: { strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [],
      labels: { rotateAlways: true, trim: true, style: { fontSize: '11px' } }
    },
    yaxis: {
      labels: { style: { fontSize: '11px' } }
    },
    tooltip: { theme: 'dark' },
    colors: [primaryColor]
  },
  series: [{ name: 'Sistemas', data: [] }]
})

const chartTablasPorSistema = ref({
  options: {
    chart: { toolbar: { show: false } },
    grid: { strokeDashArray: 4 },
    dataLabels: { enabled: false },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4
      }
    },
    xaxis: {
      categories: [],
      labels: { style: { fontSize: '11px' } }
    },
    tooltip: { theme: 'dark' },
    colors: [secondaryColor]
  },
  series: [{ name: 'Tablas', data: [] }]
})

const chartTablasPorMes = ref({
  options: {
    chart: { toolbar: { show: false } },
    grid: { strokeDashArray: 4 },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: {
      categories: [],
      labels: { style: { fontSize: '11px' } }
    },
    yaxis: {
      labels: { style: { fontSize: '11px' } }
    },
    tooltip: { theme: 'dark' },
    colors: [primaryColor]
  },
  series: [{ name: 'Tablas', data: [] }]
})

const chartUsuariosPorRol = ref({
  options: {
    labels: [],
    legend: {
      position: 'bottom',
      markers: { radius: 10 }
    },
    dataLabels: { enabled: true },
    tooltip: { theme: 'dark' },
    colors: [primaryColor, secondaryColor, accentColor, '#AB47BC', '#FF7043']
  },
  series: []
})

// === LOAD DASHBOARD ===
const loadDashboard = async () => {
  loading.value = true
  error.value = ''

  try {
    const [
      summary,
      sistemasArea,
      tablasSistema,
      tablasMes,
      usuariosRol
    ] = await Promise.all([
      ApiService.GetDashboardSummary(),
      ApiService.GetSistemasPorArea(),
      ApiService.GetTablasPorSistema(tablasPorSistemaLimit),
      ApiService.GetTablasPorMes(tablasPorMesYear),
      ApiService.GetUsuariosPorRol()
    ])

    // Cards
    const cards = summary && summary.cards ? summary.cards : []
    summaryCards.value = cards.map((c) => ({
      ...c,
      icon: mapCardIcon(c.key)
    }))

    // Sistemas por área
    const sLabels = sistemasArea?.labels ?? []
    const sData = sistemasArea?.datasets?.[0]?.data ?? []
    chartSistemasPorArea.value = {
      ...chartSistemasPorArea.value,
      options: {
        ...chartSistemasPorArea.value.options,
        xaxis: {
          ...chartSistemasPorArea.value.options.xaxis,
          categories: sLabels
        }
      },
      series: [
        {
          name: sistemasArea?.datasets?.[0]?.label ?? 'Sistemas',
          data: sData
        }
      ]
    }

    // Tablas por sistema
    const tsLabels = tablasSistema?.labels ?? []
    const tsData = tablasSistema?.datasets?.[0]?.data ?? []
    chartTablasPorSistema.value = {
      ...chartTablasPorSistema.value,
      options: {
        ...chartTablasPorSistema.value.options,
        xaxis: {
          ...chartTablasPorSistema.value.options.xaxis,
          categories: tsLabels
        }
      },
      series: [
        {
          name: tablasSistema?.datasets?.[0]?.label ?? 'Tablas',
          data: tsData
        }
      ]
    }

    // Tablas por mes
    const tmLabels = tablasMes?.labels ?? []
    const tmData = tablasMes?.datasets?.[0]?.data ?? []
    chartTablasPorMes.value = {
      ...chartTablasPorMes.value,
      options: {
        ...chartTablasPorMes.value.options,
        xaxis: {
          ...chartTablasPorMes.value.options.xaxis,
          categories: tmLabels
        }
      },
      series: [
        {
          name: tablasMes?.datasets?.[0]?.label ?? 'Tablas',
          data: tmData
        }
      ]
    }

    // Usuarios por rol
    const urLabels = usuariosRol?.labels ?? []
    const urData = usuariosRol?.datasets?.[0]?.data ?? []
    chartUsuariosPorRol.value = {
      options: {
        ...chartUsuariosPorRol.value.options,
        labels: urLabels
      },
      series: urData
    }
  } catch (e) {
    console.error(e)
    error.value = 'No se pudo cargar el dashboard. Inténtalo nuevamente.'
  } finally {
    loading.value = false
  }
}

// Iconos para cada KPI
function mapCardIcon (key) {
  switch (key) {
    case 'paises': return 'public'
    case 'areas': return 'domain'
    case 'sistemas': return 'dashboard'
    case 'tablas': return 'table_chart'
    case 'usuarios': return 'people'
    default: return 'insights'
  }
}

onMounted(loadDashboard)
</script>

<style scoped>
.card-kpi {
  border-radius: 14px;
  padding: 4px 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s, transform 0.2s;
}

.card-kpi:hover {
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.chart-card {
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
</style>
