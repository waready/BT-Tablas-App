<template>
  <q-page class="q-pa-md">
    <q-table
      :rows="sistemas || []"
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
        <q-btn label="Crear Nuevo Sistema" color="secondary" @click="openCreateDialog" rounded />
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
      <q-card class="q-pa-md" style="width: 400px;">
        <q-card-section class="q-gutter-sm">
          <q-input
            v-model.number="currentItem.cod_area_funcional"
            type="number"
            label="Código Área Funcional"
            outlined
            :rules="[isInt]"
          />
          <q-input
            v-model.number="currentItem.cod_sistema"
            type="number"
            label="Código Sistema"
            outlined
            :rules="[isInt]"
          />
          <q-input
            v-model.number="currentItem.corr"
            type="number"
            label="Correlativo"
            outlined
            :rules="[isInt]"
          />
          <q-input
            v-model="currentItem.sistema"
            label="Sistema"
            outlined
            :rules="[isRequired]"
            @update:model-value="val => currentItem.sistema = (val || '').trim()"
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
        <q-card-section>¿Estás seguro que deseas eliminar este sistema?</q-card-section>
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
  name: 'SistemasPage',
  data () {
    return {
      sistemas: [],
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
        { name: 'cod_area_funcional', label: 'Código Área Funcional', field: 'cod_area_funcional', align: 'left', sortable: true },
        { name: 'cod_sistema',        label: 'Código Sistema',         field: 'cod_sistema',        align: 'left', sortable: true },
        { name: 'corr',               label: 'Correlativo',            field: 'corr',               align: 'left', sortable: true },
        { name: 'sistema',            label: 'Sistema',                field: 'sistema',            align: 'left', sortable: true },
        { name: 'actions',            label: 'Acciones',               field: 'actions',            align: 'center' }
      ]
    }
  },

  mounted () {
    this.fetchSistemas()
  },

  watch: {
    pagination: {
      deep: true,
      handler () { this.fetchSistemas() }
    },
    search () {
      this.pagination.page = 1
      this.fetchSistemas()
    }
  },

  methods: {
    isRequired (v) { return !!(v && String(v).trim()) || 'Este campo es obligatorio' },
    isInt (v) { return Number.isInteger(Number(v)) ? true : 'Ingrese un entero válido' },

    async fetchSistemas () {
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

        const res = await ApiService.GetSistemas(params)
        this.sistemas = Array.isArray(res.items) ? res.items : []
        this.pagination.rowsNumber = Number(res.total) || 0
        if (res.page)  this.pagination.page = Number(res.page)
        if (res.limit) this.pagination.rowsPerPage = Number(res.limit)
      } catch (e) {
        console.error('Error al obtener los sistemas:', e)
        this.$q?.notify?.({ type: 'negative', message: 'No se pudieron cargar los sistemas' })
        this.sistemas = []
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
      this.fetchSistemas()
    },

    onSearch () {
      this.pagination.page = 1
      this.fetchSistemas()
    },

    openCreateDialog () {
      this.currentItem = {
        cod_area_funcional: null,
        cod_sistema: null,
        corr: null,
        sistema: ''
      }
      this.dialogVisible = true
    },

    openEditDialog (item) {
      this.currentItem = {
        id: item.id,
        cod_area_funcional: Number(item.cod_area_funcional),
        cod_sistema: Number(item.cod_sistema),
        corr: Number(item.corr),
        sistema: (item.sistema || '').trim()
      }
      this.dialogVisible = true
    },

    async saveItem () {
      this.saving = true
      try {
        // Validaciones mínimas
        if (!this.isInt(this.currentItem.cod_area_funcional) === true) throw new Error('Código Área Funcional inválido')
        if (!this.isInt(this.currentItem.cod_sistema) === true) throw new Error('Código Sistema inválido')
        if (!this.isInt(this.currentItem.corr) === true) throw new Error('Correlativo inválido')
        if (!this.isRequired(this.currentItem.sistema) === true) throw new Error('El nombre del sistema es obligatorio')

        const payload = {
          cod_area_funcional: Number(this.currentItem.cod_area_funcional),
          cod_sistema: Number(this.currentItem.cod_sistema),
          corr: Number(this.currentItem.corr),
          sistema: (this.currentItem.sistema || '').trim()
        }

        if (this.currentItem.id) {
          await ApiService.SetSistemas(this.currentItem.id, payload)
        } else {
          await ApiService.CreateSistemas(payload)
        }

        this.dialogVisible = false
        this.fetchSistemas()
        this.$q?.notify?.({ type: 'positive', message: 'Sistema guardado' })
      } catch (e) {
        console.error('Error al guardar el sistema:', e)
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
        await ApiService.DeleteSistemas(this.itemToDelete)
        this.deleteDialogVisible = false
        this.fetchSistemas()
        this.$q?.notify?.({ type: 'positive', message: 'Sistema eliminado' })
      } catch (e) {
        console.error('Error al eliminar el sistema:', e)
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
.q-input { margin-bottom: 12px; }
</style>
