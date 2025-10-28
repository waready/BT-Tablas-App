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
