import { ROLES } from './constants.js'

export const DEMO_USERS = [
  { id: 'admin@deposito.com', name: 'Admin Principal', role: ROLES.ADMIN, color: '#e74c3c', initials: 'AP' },
  { id: 'ana@deposito.com', name: 'Ana García', role: ROLES.EDITOR, color: '#3498db', initials: 'AG' },
  { id: 'luis@deposito.com', name: 'Luis Martínez', role: ROLES.EDITOR, color: '#2ecc71', initials: 'LM' },
  { id: 'carlos@deposito.com', name: 'Carlos Ruiz', role: ROLES.VIEWER, color: '#9b59b6', initials: 'CR' },
  { id: 'sofia@deposito.com', name: 'Sofía López', role: ROLES.VIEWER, color: '#f39c12', initials: 'SL' },
]

export const DEMO_PASSWORD = 'password123'

export const PERMISSIONS = {
  canEditStock: (role) => role === ROLES.ADMIN || role === ROLES.EDITOR,
  canEditColumns: (role) => role === ROLES.ADMIN,
  canViewLogs: (role) => role === ROLES.ADMIN || role === ROLES.EDITOR,
  canManageUsers: (role) => role === ROLES.ADMIN,
  canManageTarifas: (role) => role === ROLES.ADMIN,
  canManageClientes: (role) => role === ROLES.ADMIN,
  canExport: (role) => true,
  canViewStats: (role) => true,
}
