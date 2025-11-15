// src/services/ApiService.js
import { api } from 'boot/axios'  // <-- cliente axios con baseURL e interceptores

class ApiService {
  // ===================== INVENTARIO =====================
  static async GetInventarios(params) { return (await api.get('inventarios', { params })).data }
  static async SetInventario(id, data) { return (await api.put(`inventarios/${id}`, data)).data }
  static async CreateInventario(data)  { return (await api.post('inventarios', data)).data }
  static async DeleteInventario(id)    { return (await api.delete(`inventarios/${id}`)).data }

  // ===================== SISTEMAS =======================
  static async GetSistemas(params) { return (await api.get('sistemas', { params })).data }
  static async SetSistemas(id,d)   { return (await api.put(`sistemas/${id}`, d)).data }
  static async CreateSistemas(d)   { return (await api.post('sistemas', d)).data }
  static async DeleteSistemas(id)  { return (await api.delete(`sistemas/${id}`)).data }

  // ===================== PAÍSES =========================
  static async GetPaises(params) { return (await api.get('paises', { params })).data }
  static async SetPaises(id,d)   { return (await api.put(`paises/${id}`, d)).data }
  static async CreatePaises(d)   { return (await api.post('paises', d)).data }
  static async DeletePaises(id)  { return (await api.delete(`paises/${id}`)).data }

  // ===================== ÁREAS FUNCIONALES ==============
  static async GetAreasFuncionales(params){ return (await api.get('areas-funcionales', { params })).data }
  static async SetAreasFuncionales(id,d)  { return (await api.put(`areas-funcionales/${id}`, d)).data }
  static async CreateAreasFuncionales(d)  { return (await api.post('areas-funcionales', d)).data }
  static async DeleteAreasFuncionales(id) { return (await api.delete(`areas-funcionales/${id}`)).data }

  // ===================== REPORTES (BLOB) ================
  static async GetConsultaQuery(payload) {
    // devuelve la Response (para que puedas leer el blob/headers)
    return api.post('generar-reporte/', payload, { responseType: 'blob' })
  }

  // ===================== ROLES ==========================
  static getRoles()            { return api.get('roles') }
  static getRole(id)           { return api.get(`roles/${id}`) }
  static createRole(d)         { return api.post('roles', d) }
  static updateRole(id,d)      { return api.put(`roles/${id}`, d) }
  static deleteRole(id)        { return api.delete(`roles/${id}`) }

  // ===================== USUARIOS =======================
  static getUsers()            { return api.get('users') }
  static createUser(d)         { return api.post('users', d) }
  static updateUser(id,d)      { return api.put(`users/${id}`, d) }
  static deleteUser(id)        { return api.delete(`users/${id}`) }
}

export default ApiService
