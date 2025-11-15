<template>
  <q-page class="q-pa-md">
    <q-table
      :rows="areasFuncionales || []"
      :columns="columns || []"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      :rows-per-page-label="'Registros por página:'"
      :rows-per-page-options="[10,25,50,0]"
      binary-state-sort
      no-data-label="Sin datos"
      no-results-label="Sin resultados"
      @request="onRequest"
      class="q-mb-md"
    >
      <template #top-left>
        <q-btn label="Crear Nueva Área Funcional" color="secondary" @click="openCreateDialog" class="q-mb-md" rounded />
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
      <q-card class="q-pa-md" style="max-width: 520px">
        <q-card-section>
          <q-input v-model="currentItem.codigo" label="Código del Área" outlined />
          <q-input v-model="currentItem.nombre" label="Descripción" outlined />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn @click="saveItem" color="primary" label="Guardar" :loading="saving" />
          <q-btn @click="dialogVisible = false" color="secondary" label="Cancelar" flat />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmación eliminar -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card class="q-pa-md" style="max-width: 420px">
        <q-card-section>¿Estás seguro de que deseas eliminar esta área funcional?</q-card-section>
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
      areasFuncionales: [],
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
        { name: 'nombre', label: 'Descripción', field: 'nombre', align: 'left', sortable: true },
        { name: 'actions', label: 'Acciones', field: 'actions', align: 'center' }
      ]
    }
  },

  mounted () {
    this.fetchAreasFuncionales()
  },

  watch: {
    pagination: {
      deep: true,
      handler () { this.fetchAreasFuncionales() }
    },
    search () {
      this.pagination.page = 1
      this.fetchAreasFuncionales()
    }
  },

  methods: {
    async fetchAreasFuncionales () {
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

        const response = await ApiService.GetAreasFuncionales(params)
        // 👇 tu API: { items, page, limit, total }
        this.areasFuncionales = Array.isArray(response.items) ? response.items : []
        this.pagination.rowsNumber = Number(response.total) || 0

        // opcional: reflejar paginación del server
        if (response.page)  this.pagination.page = Number(response.page)
        if (response.limit) this.pagination.rowsPerPage = Number(response.limit)
      } catch (err) {
        console.error('Error al obtener las áreas funcionales:', err)
        this.areasFuncionales = []
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
      this.fetchAreasFuncionales()
    },

    onSearch () {
      this.pagination.page = 1
      this.fetchAreasFuncionales()
    },

    openCreateDialog () {
      this.currentItem = {}
      this.dialogVisible = true
    },

    openEditDialog (item) {
      this.currentItem = { ...item }
      this.dialogVisible = true
    },

    async saveItem () {
      this.saving = true
      try {
        if (this.currentItem.id) {
          await ApiService.SetAreasFuncionales(this.currentItem.id, this.currentItem)
        } else {
          await ApiService.CreateAreasFuncionales(this.currentItem)
        }
        this.dialogVisible = false
        this.fetchAreasFuncionales()
      } catch (err) {
        console.error('Error al guardar el área funcional:', err)
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
        await ApiService.DeleteAreasFuncionales(this.itemToDelete)
        this.deleteDialogVisible = false
        this.fetchAreasFuncionales()
      } catch (err) {
        console.error('Error al eliminar el área funcional:', err)
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>

<style scoped>
.q-btn { font-weight: 600; }
.q-card-section { padding: 16px; }
.q-input { margin-bottom: 16px; }
</style>
