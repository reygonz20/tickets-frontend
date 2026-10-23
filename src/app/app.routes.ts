import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { MainLayout } from './components/main-layout/main-layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Usuarios } from './pages/usuarios/usuarios';
import { Perfil } from './pages/perfil/perfil';
import { Tickets } from './pages/tickets/tickets';
import { Tecnicos } from './pages/tecnicos/tecnicos';
import { Catalogos } from './pages/catalogos/catalogos';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: Dashboard },
      {
        path: 'tickets',
        component: Tickets,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'], modo: 'todos' },
      },
      {
        path: 'mis-asignados',
        component: Tickets,
        canActivate: [authGuard],
        data: { roles: ['ROLE_TECNICO'], modo: 'asignados' },
      },
      {
        path: 'mis-tickets',
        component: Tickets,
        canActivate: [authGuard],
        data: { roles: ['ROLE_USUARIO'], modo: 'mios' },
      },
      {
        path: 'usuarios',
        component: Usuarios,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'] },
      },
      {
        path: 'tecnicos',
        component: Tecnicos,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'] },
      },
      {
        path: 'categorias',
        component: Catalogos,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'], vista: 'categorias' },
      },
      {
        path: 'prioridades',
        component: Catalogos,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'], vista: 'prioridades' },
      },
      {
        path: 'estados',
        component: Catalogos,
        canActivate: [authGuard],
        data: { roles: ['ROLE_ADMIN'], vista: 'estados' },
      },
      { path: 'perfil', component: Perfil },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
