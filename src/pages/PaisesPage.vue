<template>
  <q-page class="q-pa-md">
    <q-table
      :rows="paises || []"
      :columns="columns || []"
      row-key="id"
      :loading="loading"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 25, 50, 0]"
      :rows-per-page-label="'Registros por página:'"
      no-data-label="Sin datos"
      no-results-label="Sin resultados"
      @request="onRequest"
      class="q-mb-md"
    >
      <template #top-left>
        <q-btn label="Crear Nuevo País" color="secondary" @click="openCreateDialog" rounded />
      </template>

      <template #top-right>
        <q-input
          filled dense debounce="300"
          placeholder="Buscar..."
          v-model="search"
          @input="onSearch"
          clearable
        />
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
      <q-card class="q-pa-md" style="width: 520px;">
        <q-card-section>
          <q-input
            v-model="currentItem.nombre"
            label="Nombre del País"
            outlined
            :rules="[v => !!(v && v.trim()) || 'El nombre es obligatorio']"
          />
          <q-input
            v-model="currentItem.isoCode"
            label="Código ISO (2–3 letras, opcional)"
            outlined
            counter
            maxlength="3"
            input-class="text-uppercase"
            @update:model-value="val => currentItem.isoCode = formatIso(val)"
            :rules="[
              v => !v || /^[A-Z]{2,3}$/.test(v) || 'Use 2 o 3 letras, ej: PE o PER'
            ]"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn @click="saveItem" color="primary" label="Guardar" :loading="saving" />
          <q-btn flat @click="dialogVisible = false" color="secondary" label="Cancelar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmación eliminar -->
    <q-dialog v-model="deleteDialogVisible">
      <q-card class="q-pa-md">
        <q-card-section>¿Estás seguro de que deseas eliminar este país?</q-card-section>
        <q-card-actions align="right">
          <q-btn @click="deleteItem" color="negative" label="Eliminar" :loading="deleting" />
          <q-btn flat @click="deleteDialogVisible = false" color="secondary" label="Cancelar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import ApiService from 'src/ApiService'

export default {
  name: 'PaisesPage',
  data () {
    return {
      paises: [],
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
        { name: 'nombre',  label: 'Nombre',     field: 'nombre',                align: 'left',  sortable: true },
        { name: 'isoCode', label: 'Código ISO', field: row => row.isoCode ?? '—', align: 'left',  sortable: true },
        { name: 'actions', label: 'Acciones',   field: 'actions',               align: 'center' }
      ]
    }
  },

  mounted () {
    this.fetchPaises()
  },

  watch: {
    pagination: {
      deep: true,
      handler () { this.fetchPaises() }
    },
    search () {
      this.pagination.page = 1
      this.fetchPaises()
    }
  },

  methods: {
    // Normaliza ISO: A-Z, máx. 3 chars
    formatIso (val) {
      return String(val || '')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 3)
    },

    async fetchPaises () {
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

        const res = await ApiService.GetPaises(params)
        this.paises = Array.isArray(res.items) ? res.items : []
        this.pagination.rowsNumber = Number(res.total) || 0
        if (res.page)  this.pagination.page = Number(res.page)
        if (res.limit) this.pagination.rowsPerPage = Number(res.limit)
      } catch (e) {
        console.error('Error al obtener los países:', e)
        this.$q?.notify?.({ type: 'negative', message: 'No se pudieron cargar los países' })
        this.paises = []
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
      this.fetchPaises()
    },

    onSearch () {
      this.pagination.page = 1
      this.fetchPaises()
    },

    openCreateDialog () {
      this.currentItem = { nombre: '', isoCode: '' }
      this.dialogVisible = true
    },

    openEditDialog (item) {
      this.currentItem = {
        id: item.id,
        nombre: item.nombre || '',
        isoCode: this.formatIso(item.isoCode || '')
      }
      this.dialogVisible = true
    },

    async saveItem () {
      this.saving = true
      try {
        const nombre = (this.currentItem.nombre || '').trim()
        if (!nombre) throw new Error('El nombre es obligatorio')

        const iso = this.formatIso(this.currentItem.isoCode)
        const payload = {
          nombre,
          isoCode: iso.length ? iso : null // vacío → null
        }

        if (this.currentItem.id) {
          await ApiService.SetPaises(this.currentItem.id, payload)
        } else {
          await ApiService.CreatePaises(payload)
        }

        this.dialogVisible = false
        this.fetchPaises()
        this.$q?.notify?.({ type: 'positive', message: 'País guardado' })
      } catch (e) {
        console.error('Error al guardar el país:', e)
        const msg = e?.response?.data?.message || e.message || 'Error al guardar'
        this.$q?.notify?.({ type: 'negative', message: msg })
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
        await ApiService.DeletePaises(this.itemToDelete)
        this.deleteDialogVisible = false
        this.fetchPaises()
        this.$q?.notify?.({ type: 'positive', message: 'País eliminado' })
      } catch (e) {
        console.error('Error al eliminar el país:', e)
        this.$q?.notify?.({ type: 'negative', message: 'No se pudo eliminar' })
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
.q-input { margin-bottom: 16px; }
</style>
