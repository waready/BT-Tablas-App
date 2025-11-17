<template>
  <q-page class="q-pa-md q-pb-xl">

    <!-- HEADER -->
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">
          Centro de seguridad
        </div>
        <div class="text-caption text-grey-6">
          Gestión de usuarios, roles y permisos del sistema.
        </div>
      </div>

      <div class="row items-center q-gutter-sm">
        <q-btn
          color="primary"
          outline
          icon="refresh"
          label="Actualizar"
          :loading="loading"
          @click="loadAll"
        />
      </div>
    </div>

    <!-- ERROR GLOBAL -->
    <q-banner
      v-if="error"
      class="bg-red-9 text-white q-mb-md shadow-2"
      rounded
      dense
      inline-actions
    >
      {{ error }}
      <template #action>
        <q-btn flat dense color="white" label="Cerrar" @click="error = ''" />
      </template>
    </q-banner>

    <!-- CARD PRINCIPAL -->
    <q-card flat bordered class="q-pa-md shadow-2 rounded-borders">

      <q-tabs
        v-model="tab"
        dense
        align="left"
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="users" icon="people" label="Usuarios" />
        <q-tab name="roles" icon="security" label="Roles" />
        <q-tab name="permissions" icon="vpn_key" label="Permisos" />
      </q-tabs>

      <q-separator class="q-my-sm" />

      <q-tab-panels v-model="tab" animated :key="tab">
        <!-- ============ TAB USUARIOS ============ -->
        <q-tab-panel name="users">
          <div class="row items-center justify-between q-mb-sm">
            <q-input
              v-model="userFilter"
              dense
              outlined
              clearable
              debounce="300"
              placeholder="Buscar usuario..."
              class="col-12 col-sm-6 col-md-4"
            >
              <template #append><q-icon name="search" /></template>
            </q-input>

            <q-btn
              color="primary"
              icon="add"
              label="Nuevo usuario"
              @click="openUserDialog()"
            />
          </div>

          <q-table
            :rows="filteredUsers"
            :columns="userColumns"
            row-key="id"
            flat
            bordered
            :loading="loadingUsers"
            no-data-label="No hay usuarios registrados."
            class="rounded-borders"
          >
            <template #top>
              <div class="text-subtitle2 text-grey-7">
                Usuarios registrados
              </div>
            </template>

            <template #body-cell-isActive="props">
              <q-td :props="props" class="text-center">
                <q-badge
                  :color="props.row.isActive ? 'positive' : 'negative'"
                  transparent
                >
                  {{ props.row.isActive ? 'Activo' : 'Inactivo' }}
                </q-badge>
              </q-td>
            </template>

            <template #body-cell-roles="props">
              <q-td :props="props">
                <q-chip
                  v-for="r in (props.row.roles || [])"
                  :key="r.id"
                  dense
                  square
                  color="primary"
                  text-color="white"
                  class="q-mr-xs q-mb-xs"
                >
                  {{ r.name }}
                </q-chip>
                <span
                  v-if="!props.row.roles || !props.row.roles.length"
                  class="text-caption text-grey-6"
                >
                  Sin roles
                </span>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  dense flat round
                  icon="rule"
                  color="secondary"
                  :title="`Asignar roles a ${props.row.name || props.row.email}`"
                  @click="openUserRolesDialog(props.row)"
                />
                <q-btn
                  dense flat round
                  icon="edit"
                  color="primary"
                  @click="openUserDialog(props.row)"
                />
                <q-btn
                  dense flat round
                  icon="delete"
                  color="negative"
                  @click="deleteUser(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- ============ TAB ROLES ============ -->
        <q-tab-panel name="roles">
          <div class="row items-center justify-between q-mb-sm">
            <q-input
              v-model="roleFilter"
              dense
              outlined
              clearable
              debounce="300"
              placeholder="Buscar rol..."
              class="col-12 col-sm-6 col-md-4"
            >
              <template #append><q-icon name="search" /></template>
            </q-input>

            <q-btn
              color="primary"
              icon="add"
              label="Nuevo rol"
              @click="openRoleDialog()"
            />
          </div>

          <q-table
            :rows="filteredRoles"
            :columns="roleColumns"
            row-key="id"
            flat
            bordered
            :loading="loadingRoles"
            no-data-label="No hay roles registrados."
            class="rounded-borders"
          >
            <template #top>
              <div class="text-subtitle2 text-grey-7">
                Roles disponibles
              </div>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  dense flat round
                  icon="vpn_key"
                  color="secondary"
                  :title="`Configurar permisos de ${props.row.name}`"
                  @click="openRolePermDialog(props.row)"
                />
                <q-btn
                  dense flat round
                  icon="edit"
                  color="primary"
                  @click="openRoleDialog(props.row)"
                />
                <q-btn
                  dense flat round
                  icon="delete"
                  color="negative"
                  @click="deleteRole(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- ============ TAB PERMISOS ============ -->
        <q-tab-panel name="permissions">
          <div class="row items-center justify-between q-mb-sm">
            <q-input
              v-model="permFilter"
              dense
              outlined
              clearable
              debounce="300"
              placeholder="Buscar permiso..."
              class="col-12 col-sm-6 col-md-4"
            >
              <template #append><q-icon name="search" /></template>
            </q-input>

            <q-btn
              color="primary"
              icon="add"
              label="Nuevo permiso"
              @click="openPermDialog()"
            />
          </div>

          <q-table
            :rows="filteredPerms"
            :columns="permColumns"
            row-key="id"
            flat
            bordered
            :loading="loadingPerms"
            no-data-label="No hay permisos registrados."
            class="rounded-borders"
          >
            <template #top>
              <div class="text-subtitle2 text-grey-7">
                Permisos configurados
              </div>
            </template>

            <template #body-cell-tag="props">
              <q-td :props="props">
                <q-chip
                  square dense
                  color="grey-9"
                  text-color="white"
                  class="q-mr-xs"
                >
                  {{ props.row.action }} : {{ props.row.resource }}
                </q-chip>
              </q-td>
            </template>

            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  dense flat round
                  icon="edit"
                  color="primary"
                  @click="openPermDialog(props.row)"
                />
                <q-btn
                  dense flat round
                  icon="delete"
                  color="negative"
                  @click="deletePerm(props.row)"
                />
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- ========== DIALOGO USUARIO ========== -->
    <q-dialog v-model="userDialog.show" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">
            {{ userDialog.editing ? 'Editar usuario' : 'Nuevo usuario' }}
          </div>
          <div class="text-caption text-grey-6">
            Define los datos básicos del usuario.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="saveUser">
            <q-input
              v-model="userDialog.form.email"
              label="Email *"
              type="email"
              dense
              outlined
              class="q-mb-sm"
              :rules="[v => !!v || 'Email requerido']"
            />
            <q-input
              v-model="userDialog.form.name"
              label="Nombre"
              dense
              outlined
              class="q-mb-sm"
            />
            <q-toggle
              v-model="userDialog.form.isActive"
              label="Usuario activo"
              class="q-mb-sm"
            />
            <q-input
              v-if="!userDialog.editing"
              v-model="userDialog.form.password"
              label="Contraseña *"
              type="password"
              dense
              outlined
              class="q-mb-sm"
              :rules="[v => !!v || 'Contraseña requerida']"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            :loading="userDialog.loading"
            @click="saveUser"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ========== DIALOGO ROLES DE USUARIO ========== -->
    <q-dialog v-model="userRolesDialog.show" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">
            Roles de usuario:
            <strong>{{ userRolesDialog.user?.name || userRolesDialog.user?.email }}</strong>
          </div>
          <div class="text-caption text-grey-6">
            Selecciona los roles que definen los permisos del usuario.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none q-gutter-sm">
          <q-banner
            v-if="userRolesDialog.error"
            class="bg-red-9 text-white"
            dense
            inline-actions
          >
            {{ userRolesDialog.error }}
            <template #action>
              <q-btn
                flat dense
                color="white"
                label="Cerrar"
                @click="userRolesDialog.error = ''"
              />
            </template>
          </q-banner>

          <q-option-group
            v-model="userRolesDialog.selectedIds"
            type="checkbox"
            :options="roles.map(r => ({ label: r.name, value: r.id }))"
            color="primary"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            :loading="userRolesDialog.loading"
            @click="saveUserRoles"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ========== DIALOGO ROL ========== -->
    <q-dialog v-model="roleDialog.show" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">
            {{ roleDialog.editing ? 'Editar rol' : 'Nuevo rol' }}
          </div>
          <div class="text-caption text-grey-6">
            Un rol agrupa permisos y se asigna a los usuarios.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="saveRole">
            <q-input
              v-model="roleDialog.form.name"
              label="Nombre del rol *"
              dense
              outlined
              class="q-mb-sm"
              :rules="[v => !!v || 'Nombre requerido']"
            />
            <q-input
              v-model="roleDialog.form.description"
              label="Descripción"
              dense
              outlined
              type="textarea"
              autogrow
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            :loading="roleDialog.loading"
            @click="saveRole"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ========== DIALOGO PERMISOS DE ROL ========== -->
    <q-dialog v-model="rolePermDialog.show" persistent maximized>
      <q-card>
        <q-bar>
          <div class="text-subtitle1">
            Permisos del rol:
            <strong>{{ rolePermDialog.role?.name }}</strong>
          </div>
          <q-space />
          <q-btn dense flat icon="close" v-close-popup />
        </q-bar>

        <q-card-section class="q-gutter-md">
          <q-banner
            v-if="rolePermDialog.error"
            class="bg-red-9 text-white"
            dense
            inline-actions
          >
            {{ rolePermDialog.error }}
            <template #action>
              <q-btn
                flat dense
                color="white"
                label="Cerrar"
                @click="rolePermDialog.error = ''"
              />
            </template>
          </q-banner>

          <div class="row q-col-gutter-lg">
            <div class="col-12 col-md-4">
              <div class="text-subtitle2 q-mb-xs">
                Permisos disponibles
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                Marca los permisos que tendrá este rol.
              </div>

              <q-input
                v-model="rolePermDialog.filter"
                dense
                outlined
                clearable
                debounce="300"
                placeholder="Buscar permiso..."
                class="q-mb-sm"
              >
                <template #append><q-icon name="search" /></template>
              </q-input>

              <q-list bordered class="rounded-borders scroll" style="max-height: 60vh;">
                <q-item
                  v-for="perm in filteredPermsForRole"
                  :key="perm.id"
                  tag="label"
                  clickable
                  dense
                >
                  <q-item-section avatar>
                    <q-checkbox
                      v-model="rolePermDialog.selectedIds"
                      :val="perm.id"
                      dense
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      {{ perm.action }} : {{ perm.resource }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ perm.description }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <div class="col-12 col-md-8">
              <div class="text-subtitle2 q-mb-xs">
                Permisos asignados
              </div>
              <div class="text-caption text-grey-6 q-mb-sm">
                Vista rápida de lo que el rol podrá hacer.
              </div>

              <div class="q-gutter-xs">
                <q-chip
                  v-for="perm in assignedPermsForRole"
                  :key="perm.id"
                  square
                  dense
                  color="primary"
                  text-color="white"
                  removable
                  @remove="togglePermFromRole(perm.id)"
                  class="q-mb-xs"
                >
                  {{ perm.action }} : {{ perm.resource }}
                </q-chip>

                <div v-if="!assignedPermsForRole.length" class="text-caption text-grey-6">
                  Este rol aún no tiene permisos asignados.
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar cambios"
            :loading="rolePermDialog.loading"
            @click="saveRolePermissions"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- ========== DIALOGO PERMISO ========== -->
    <q-dialog v-model="permDialog.show" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">
            {{ permDialog.editing ? 'Editar permiso' : 'Nuevo permiso' }}
          </div>
          <div class="text-caption text-grey-6">
            Define la acción y el recurso que controla este permiso.
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="savePerm">
            <q-input
              v-model="permDialog.form.action"
              label="Acción (read, create, update...) *"
              dense
              outlined
              class="q-mb-sm"
              :rules="[v => !!v || 'Acción requerida']"
            />
            <q-input
              v-model="permDialog.form.resource"
              label="Recurso (users, roles, inventario...) *"
              dense
              outlined
              class="q-mb-sm"
              :rules="[v => !!v || 'Recurso requerido']"
            />
            <q-input
              v-model="permDialog.form.description"
              label="Descripción"
              dense
              outlined
              type="textarea"
              autogrow
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey-7" v-close-popup />
          <q-btn
            color="primary"
            label="Guardar"
            :loading="permDialog.loading"
            @click="savePerm"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ApiService from 'src/ApiService'

// helper para soportar distintas formas de respuesta
const ensureArray = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    const keys = ['rows', 'data', 'items', 'users', 'roles', 'permissions']
    for (const k of keys) {
      if (Array.isArray(data[k])) return data[k]
    }
  }
  return []
}

const tab = ref('users')
const loading = ref(false)
const error = ref('')

// =============== USUARIOS ===============
const users = ref([])
const loadingUsers = ref(false)
const userFilter = ref('')

const userColumns = [
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'isActive', label: 'Estado', field: 'isActive', align: 'center' },
  { name: 'roles', label: 'Roles', field: 'roles', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' }
]

const filteredUsers = computed(() => {
  const list = ensureArray(users.value)
  if (!userFilter.value) return list
  const f = userFilter.value.toLowerCase()
  return list.filter(u =>
    (u.email || '').toLowerCase().includes(f) ||
    (u.name || '').toLowerCase().includes(f)
  )
})

const userDialog = ref({
  show: false,
  editing: false,
  loading: false,
  form: { id: null, email: '', name: '', isActive: true, password: '' }
})

const openUserDialog = (row) => {
  userDialog.value.show = true
  userDialog.value.loading = false

  if (row) {
    userDialog.value.editing = true
    userDialog.value.form = {
      id: row.id,
      email: row.email,
      name: row.name,
      isActive: !!row.isActive,
      password: ''
    }
  } else {
    userDialog.value.editing = false
    userDialog.value.form = {
      id: null,
      email: '',
      name: '',
      isActive: true,
      password: ''
    }
  }
}

const saveUser = async () => {
  const f = userDialog.value.form
  if (!f.email) return
  if (!userDialog.value.editing && !f.password) return

  userDialog.value.loading = true
  try {
    if (userDialog.value.editing && f.id) {
      await ApiService.updateUser(f.id, {
        email: f.email,
        name: f.name,
        isActive: f.isActive
      })
    } else {
      await ApiService.createUser({
        email: f.email,
        name: f.name,
        isActive: f.isActive,
        password: f.password
      })
    }
    userDialog.value.show = false
    await loadUsers()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo guardar el usuario.'
  } finally {
    userDialog.value.loading = false
  }
}

const deleteUser = async (row) => {
  if (!row?.id) return
  if (!confirm(`¿Eliminar el usuario "${row.email}"?`)) return
  try {
    await ApiService.deleteUser(row.id)
    await loadUsers()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo eliminar el usuario.'
  }
}

// dialog roles de usuario
const userRolesDialog = ref({
  show: false,
  user: null,
  selectedIds: [],
  loading: false,
  error: ''
})

const openUserRolesDialog = async (user) => {
  userRolesDialog.value.show = true
  userRolesDialog.value.user = user
  userRolesDialog.value.selectedIds = []
  userRolesDialog.value.loading = true
  userRolesDialog.value.error = ''

  try {
    const { data } = await ApiService.getUserRoles(user.id)
    const list = ensureArray(data)
    userRolesDialog.value.selectedIds = list.map(r => r.id)
  } catch (e) {
    console.error(e)
    userRolesDialog.value.error =
      e.response?.data?.message || e.message || 'No se pudieron cargar los roles.'
  } finally {
    userRolesDialog.value.loading = false
  }
}

const saveUserRoles = async () => {
  if (!userRolesDialog.value.user) return
  userRolesDialog.value.loading = true
  try {
    const roleIds = userRolesDialog.value.selectedIds

    // el backend acepta ["admin","viewer"] o [{ id }]
    const rolesPayload = roleIds.map(id => ({ id }))

    await ApiService.setUserRoles(userRolesDialog.value.user.id, {
      roles: rolesPayload
    })

    userRolesDialog.value.show = false
    await loadUsers()
  } catch (e) {
    console.error(e)
    userRolesDialog.value.error =
      e.response?.data?.message || e.message || 'No se pudieron guardar los roles.'
  } finally {
    userRolesDialog.value.loading = false
  }
}

// =============== ROLES ===============
const roles = ref([])
const loadingRoles = ref(false)
const roleFilter = ref('')

const roleColumns = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left', sortable: true },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' }
]

const filteredRoles = computed(() => {
  const list = ensureArray(roles.value)
  if (!roleFilter.value) return list
  const f = roleFilter.value.toLowerCase()
  return list.filter(r =>
    (r.name || '').toLowerCase().includes(f) ||
    (r.description || '').toLowerCase().includes(f)
  )
})

const roleDialog = ref({
  show: false,
  editing: false,
  loading: false,
  form: { id: null, name: '', description: '' }
})

const openRoleDialog = (row) => {
  roleDialog.value.show = true
  roleDialog.value.loading = false

  if (row) {
    roleDialog.value.editing = true
    roleDialog.value.form = {
      id: row.id,
      name: row.name,
      description: row.description || ''
    }
  } else {
    roleDialog.value.editing = false
    roleDialog.value.form = {
      id: null,
      name: '',
      description: ''
    }
  }
}

const saveRole = async () => {
  const f = roleDialog.value.form
  if (!f.name) return
  roleDialog.value.loading = true
  try {
    if (roleDialog.value.editing && f.id) {
      await ApiService.updateRole(f.id, {
        name: f.name,
        description: f.description
      })
    } else {
      await ApiService.createRole({
        name: f.name,
        description: f.description
      })
    }
    roleDialog.value.show = false
    await loadRoles()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo guardar el rol.'
  } finally {
    roleDialog.value.loading = false
  }
}

const deleteRole = async (row) => {
  if (!row?.id) return
  if (!confirm(`¿Eliminar el rol "${row.name}"?`)) return
  try {
    await ApiService.deleteRole(row.id)
    await loadRoles()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo eliminar el rol.'
  }
}

// dialog permisos de rol
const rolePermDialog = ref({
  show: false,
  role: null,
  selectedIds: [],
  filter: '',
  loading: false,
  error: ''
})

const openRolePermDialog = async (role) => {
  rolePermDialog.value.show = true
  rolePermDialog.value.role = role
  rolePermDialog.value.selectedIds = []
  rolePermDialog.value.filter = ''
  rolePermDialog.value.loading = true
  rolePermDialog.value.error = ''

  try {
    // usamos GET /roles/{id}
    const { data } = await ApiService.getRole(role.id)

    // puede venir como:
    // permissions: [ { id, ... } ]   o   [ { permission: { ... } }, ... ]
    let rawList = []
    if (Array.isArray(data?.permissions)) {
      rawList = data.permissions.map(p => (p.permission ? p.permission : p))
    }
    rolePermDialog.value.selectedIds = rawList.map(p => p.id)
  } catch (e) {
    console.error(e)
    rolePermDialog.value.error =
      e.response?.data?.message || e.message || 'No se pudieron cargar los permisos del rol.'
  } finally {
    rolePermDialog.value.loading = false
  }
}

// =============== PERMISOS ===============
const perms = ref([])
const loadingPerms = ref(false)
const permFilter = ref('')

const permColumns = [
  { name: 'tag', label: 'Permiso', field: 'tag', align: 'left' },
  { name: 'description', label: 'Descripción', field: 'description', align: 'left' },
  { name: 'actions', label: 'Acciones', field: 'actions', align: 'right' }
]

const filteredPerms = computed(() => {
  const list = ensureArray(perms.value)
  if (!permFilter.value) return list
  const f = permFilter.value.toLowerCase()
  return list.filter(p =>
    (p.action || '').toLowerCase().includes(f) ||
    (p.resource || '').toLowerCase().includes(f) ||
    (p.description || '').toLowerCase().includes(f)
  )
})

const permDialog = ref({
  show: false,
  editing: false,
  loading: false,
  form: { id: null, action: '', resource: '', description: '' }
})

const openPermDialog = (row) => {
  permDialog.value.show = true
  permDialog.value.loading = false

  if (row) {
    permDialog.value.editing = true
    permDialog.value.form = {
      id: row.id,
      action: row.action,
      resource: row.resource,
      description: row.description || ''
    }
  } else {
    permDialog.value.editing = false
    permDialog.value.form = {
      id: null,
      action: '',
      resource: '',
      description: ''
    }
  }
}

const savePerm = async () => {
  const f = permDialog.value.form
  if (!f.action || !f.resource) return
  permDialog.value.loading = true
  try {
    if (permDialog.value.editing && f.id) {
      await ApiService.updatePermission(f.id, {
        action: f.action,
        resource: f.resource,
        description: f.description
      })
    } else {
      await ApiService.createPermission({
        action: f.action,
        resource: f.resource,
        description: f.description
      })
    }
    permDialog.value.show = false
    await loadPermissions()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo guardar el permiso.'
  } finally {
    permDialog.value.loading = false
  }
}

const deletePerm = async (row) => {
  if (!row?.id) return
  if (!confirm(`¿Eliminar el permiso "${row.action}:${row.resource}"?`)) return
  try {
    await ApiService.deletePermission(row.id)
    await loadPermissions()
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudo eliminar el permiso.'
  }
}

// helpers permisos por rol
const filteredPermsForRole = computed(() => {
  const list = ensureArray(perms.value)
  const f = rolePermDialog.value.filter.toLowerCase()
  if (!f) return list
  return list.filter(p =>
    (p.action || '').toLowerCase().includes(f) ||
    (p.resource || '').toLowerCase().includes(f) ||
    (p.description || '').toLowerCase().includes(f)
  )
})

const assignedPermsForRole = computed(() => {
  const list = ensureArray(perms.value)
  return list.filter(p =>
    rolePermDialog.value.selectedIds.includes(p.id)
  )
})

const togglePermFromRole = (id) => {
  const idx = rolePermDialog.value.selectedIds.indexOf(id)
  if (idx >= 0) rolePermDialog.value.selectedIds.splice(idx, 1)
}

const saveRolePermissions = async () => {
  if (!rolePermDialog.value.role) return
  rolePermDialog.value.loading = true
  try {
    const permissionIds = rolePermDialog.value.selectedIds

    // el backend seguramente acepta ["perm"] o [{ id }]
    const permissionsPayload = permissionIds.map(id => ({ id }))

    // POST /roles/{id}/permissions
    await ApiService.setRolePermissions(rolePermDialog.value.role.id, {
      permissions: permissionsPayload
    })

    rolePermDialog.value.show = false
  } catch (e) {
    console.error(e)
    rolePermDialog.value.error =
      e.response?.data?.message || e.message || 'No se pudieron guardar los permisos del rol.'
  } finally {
    rolePermDialog.value.loading = false
  }
}

// LOADS
const loadUsers = async () => {
  loadingUsers.value = true
  try {
    const { data } = await ApiService.getUsers()
    users.value = ensureArray(data)
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudieron cargar los usuarios.'
    users.value = []
  } finally {
    loadingUsers.value = false
  }
}

const loadRoles = async () => {
  loadingRoles.value = true
  try {
    const { data } = await ApiService.getRoles()
    roles.value = ensureArray(data)
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudieron cargar los roles.'
    roles.value = []
  } finally {
    loadingRoles.value = false
  }
}

const loadPermissions = async () => {
  loadingPerms.value = true
  try {
    const { data } = await ApiService.getPermissions()
    perms.value = ensureArray(data)
  } catch (e) {
    console.error(e)
    error.value =
      e.response?.data?.message || e.message || 'No se pudieron cargar los permisos.'
    perms.value = []
  } finally {
    loadingPerms.value = false
  }
}

const loadAll = async () => {
  loading.value = true
  await Promise.all([loadUsers(), loadRoles(), loadPermissions()])
  loading.value = false
}

onMounted(loadAll)
</script>

<style scoped>
.rounded-borders {
  border-radius: 12px;
}

.dialog-card {
  min-width: 380px;
  max-width: 520px;
}
</style>
