<template>
  <q-page class="q-pa-md">
    <q-table
      :rows="inventarios || []"
      :columns="columns || []"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      :rows-per-page-label="'Registros por página:'"
      :rows-per-page-options="[10,25,50,0]"
      no-data-label="Sin datos"
      no-results-label="Sin resultados"
      @request="onRequest"
      class="q-mb-md"
    >
      <template #top-left>
        <q-btn label="Crear" color="secondary" @click="openCreateDialog" class="q-mr-md" rounded />
      </template>

      <template #top-right>
        <q-input filled dense debounce="300" placeholder="Buscar..." v-model="search" @input="onSearch" clearable />
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props" class="q-pa-none">
          <q-btn flat color="secondary" icon="edit" @click="openEditDialog(props.row)" class="q-mr-xs" round />
          <q-btn flat color="negative" icon="delete" @click="confirmDelete(props.row.id)" round />
        </q-td>
      </template>
    </q-table>

    <!-- Diálogo crear/editar -->
    <q-dialog v-model="dialogVisible">
      <q-card class="q-pa-md" style="width: 800px;">
        <q-card-section>
          <q-row class="q-gutter-md">
            <!-- Columna 1 -->
            <q-col :cols="12" :md="6">
              <q-input v-model="currentItem.codigo" label="Código" outlined />
              <q-input v-model="currentItem.descripcion" label="Descripción" outlined />

              <!-- strings simples -->
              <q-select v-model="currentItem.datos" label="Datos" :options="datos" outlined />

              <!-- IDs camelCase -->
              <q-select
                v-model="currentItem.areaFuncionalId"
                label="Área Funcional"
                :options="areasFuncionales"
                option-value="id"
                option-label="nombre"
                emit-value map-options outlined
              />
            </q-col>

            <!-- Columna 2 -->
            <q-col :cols="12" :md="6">
              <q-select
                v-model="currentItem.sistemaId"
                label="Sistema"
                :options="sistemas"
                option-value="id"
                option-label="sistema"
                emit-value map-options outlined
              />

              <!-- ahora usamos en_desarrollo (string) -->
              <q-select v-model="currentItem.en_desarrollo" label="En Desarrollo" :options="enDesarrollo" outlined />

              <q-select v-model="currentItem.capa" label="Capa" :options="capa" outlined />

              <q-select
                v-model="currentItem.paisId"
                :options="paises"
                label="País"
                option-label="nombre"
                option-value="id"
                emit-value map-options outlined
              />
            </q-col>
          </q-row>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn @click="saveItem" color="secondary" label="Guardar" :loading="saving" />
          <q-btn @click="dialogVisible = false" color="negative" label="Cancelar" flat />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmación eliminar -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card class="q-pa-md">
        <q-card-section>¿Estás seguro de que deseas eliminar este registro?</q-card-section>
        <q-card-actions align="right">
          <q-btn @click="deleteItem" color="negative" label="Eliminar" :loading="deleting" />
          <q-btn @click="deleteDialogVisible = false" color="secondary" label="Cancelar" flat />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import ApiService from 'src/ApiService'

export default {
  data () {
    return {
      inventarios: [],
      loading: true,
      saving: false,
      deleting: false,
      pagination: {
        page: 1,
        rowsPerPage: 10,
        sortBy: 'id',
        descending: false,
        rowsNumber: 0
      },
      search: '',
      dialogVisible: false,
      deleteDialogVisible: false,
      currentItem: {},
      itemToDelete: null,

      columns: [
        { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
        { name: 'datos', label: 'Datos', field: 'datos', align: 'left', sortable: true },
        { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left', sortable: true },
        { name: 'area_funcional', label: 'Área Funcional',
          field: row => row.areaFuncional?.nombre ?? '—', align: 'left', sortable: true },
        { name: 'sistema', label: 'Sistema',
          field: row => row.sistema?.sistema ?? '—', align: 'left', sortable: true },
        { name: 'pais', label: 'País',
          field: row => row.pais?.nombre ?? '—', align: 'left', sortable: true },
        { name: 'usuario', label: 'Usuario',
          field: row => row.usuario ?? row.user?.username ?? row.user?.name ?? '—', align: 'left', sortable: true },
        { name: 'en_desarrollo', label: 'En Desarrollo',
          field: row => row.en_desarrollo ?? '—', align: 'center', sortable: true },
        { name: 'capa', label: 'Capa', field: 'capa', align: 'center', sortable: true },
        { name: 'actions', label: 'Acciones', align: 'center', field: 'actions' }
      ],

      paises: [],
      sistemas: [],
      areasFuncionales: [],
      datos: ['Datos', 'Parámetros'],
      enDesarrollo: ['Inactiva', 'En Desarrollo', 'Activa', 'Desuso'],
      capa: ['Cliente', 'Core', 'País']
    }
  },

  mounted () {
    this.fetchInventarios()
    this.fetchPaises()
    this.fetchSistemas()
    this.fetchAreasFuncionales()
  },

  watch: {
    pagination: {
      deep: true,
      handler () { this.fetchInventarios() }
    },
    search () {
      this.pagination.page = 1
      this.fetchInventarios()
    }
  },

  methods: {
    async fetchInventarios () {
      this.loading = true
      try {
        const limit = this.pagination.rowsPerPage === 0
          ? this.pagination.rowsNumber
          : this.pagination.rowsPerPage

        const params = {
          page: this.pagination.page,
          limit,
          sortBy: this.pagination.sortBy || 'id',
          order: this.pagination.descending ? 'desc' : 'asc',
          search: this.search
        }

        const response = await ApiService.GetInventarios(params)
        this.inventarios = Array.isArray(response.items) ? response.items : []
        this.pagination.rowsNumber = Number(response.total) || 0
        if (response.page)  this.pagination.page = Number(response.page)
        if (response.limit) this.pagination.rowsPerPage = Number(response.limit)
      } catch (e) {
        console.error('Error al obtener inventarios', e)
        this.inventarios = []
        this.pagination.rowsNumber = 0
      } finally {
        this.loading = false
      }
    },

    onRequest ({ pagination }) {
      const { page, rowsPerPage, sortBy, descending } = pagination
      this.pagination.page = page
      this.pagination.rowsPerPage = rowsPerPage
      this.pagination.sortBy = sortBy
      this.pagination.descending = descending
      this.fetchInventarios()
    },

    async fetchPaises () {
      try {
        const res = await ApiService.GetPaises()
        this.paises = Array.isArray(res.items) ? res.items : []
      } catch (e) {
        console.error('Error al obtener los países:', e)
        this.paises = []
      }
    },

    async fetchSistemas () {
      try {
        const res = await ApiService.GetSistemas()
        this.sistemas = Array.isArray(res.items) ? res.items : []
      } catch (e) {
        console.error('Error al obtener los sistemas:', e)
        this.sistemas = []
      }
    },

    async fetchAreasFuncionales () {
      try {
        const res = await ApiService.GetAreasFuncionales()
        this.areasFuncionales = Array.isArray(res.items) ? res.items : []
      } catch (e) {
        console.error('Error al obtener las áreas:', e)
        this.areasFuncionales = []
      }
    },

    onSearch () {
      this.pagination.page = 1
      this.fetchInventarios()
    },

    openCreateDialog () {
      this.currentItem = {
        codigo: '',
        descripcion: '',
        datos: null,
        en_desarrollo: null,
        capa: null,
        areaFuncionalId: null,
        sistemaId: null,
        paisId: null
      }
      this.dialogVisible = true
    },

    openEditDialog (item) {
      this.currentItem = {
        id: item.id,
        codigo: item.codigo,
        descripcion: item.descripcion,
        datos: item.datos ?? null,
        en_desarrollo: item.en_desarrollo ?? item.estado ?? null,
        capa: item.capa ?? null,
        // preferir los FKs escalares si vienen; si no, tomar del objeto relacionado
        areaFuncionalId: item.areaFuncionalId ?? item.areaFuncional?.id ?? null,
        sistemaId:       item.sistemaId       ?? item.sistema?.id       ?? null,
        paisId:          item.paisId          ?? item.pais?.id          ?? null
      }
      this.dialogVisible = true
    },

    async saveItem () {
      this.saving = true
      try {
        const p = this.currentItem
        const payload = {
          codigo: p.codigo,
          descripcion: p.descripcion,
          datos: p.datos ?? null,
          en_desarrollo: p.en_desarrollo ?? null,
          capa: p.capa ?? null,
          areaFuncionalId: p.areaFuncionalId ?? null,
          sistemaId: p.sistemaId ?? null,
          paisId: p.paisId ?? null
        }

        if (p.id) {
          await ApiService.SetInventario(p.id, payload)
        } else {
          await ApiService.CreateInventario(payload)
        }

        this.dialogVisible = false
        this.fetchInventarios()
      } catch (e) {
        console.error('Error al guardar el inventario:', e)
      } finally {
        this.saving = false
      }
    },

    confirmDelete (id) {
      this.itemToDelete = id
      this.deleteDialogVisible = true
    },

    async deleteItem () {
      this.deleting = true
      try {
        await ApiService.DeleteInventario(this.itemToDelete)
        this.deleteDialogVisible = false
        this.fetchInventarios()
      } catch (e) {
        console.error('Error al eliminar el inventario:', e)
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.q-btn { font-weight: 600; }
.q-card { max-width: 600px; }
.q-card-section { padding: 16px; }
.q-input, .q-select { margin-bottom: 16px; }
</style>
