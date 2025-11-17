const routes = [
  {
    path: '/login',
    name: 'login',
    meta: { public: true, guestOnly: true },
    component: () => import('src/pages/LoginPage.vue')
  },
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('src/pages/IndexPage.vue') },
      { path: '/tablas', name: 'tablas', component: () => import('src/pages/TablasPage.vue') },
      { path: '/areas', name: 'areas', component: () => import('src/pages/AreasPage.vue') },
      { path: '/paises', name: 'paises', component: () => import('src/pages/PaisesPage.vue') },
      { path: '/sistemas', name: 'sistemas', component: () => import('src/pages/SistemasPage.vue') },
      { path: '/reportes', name: 'reportes', component: () => import('src/pages/ReportePage.vue') },
      { path: '/usuarios', name: 'usuarios', component: () => import('src/pages/UsuariosRolesPage.vue') },
      // ...tus pestañas privadas aquí
    ]
  },
  {
    path: '/:catchAll(.*)*',
    meta: { public: true },
    component: () => import('src/pages/ErrorNotFound.vue')
  }
]
export default routes
