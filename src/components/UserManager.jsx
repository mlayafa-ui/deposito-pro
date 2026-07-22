import React, { useState } from 'react'
import { PERMISSIONS } from '../utils/auth.js'
import { ROLES, ROLE_LABELS } from '../utils/constants.js'

export default function UserManager({ users, currentUser, onCreateUser, onDeleteUser }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: ROLES.VIEWER, color: '#3498db' })

  if (!PERMISSIONS.canManageUsers(currentUser?.role)) {
    return (
      <div className="config-page">
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          Solo el administrador puede gestionar usuarios.
        </div>
      </div>
    )
  }

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22', '#34495e']

  const handleCreate = () => {
    if (!newUser.name || !newUser.email) return
    const initials = newUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    onCreateUser({ ...newUser, initials })
    setNewUser({ name: '', email: '', role: ROLES.VIEWER, color: '#3498db' })
    setShowAdd(false)
  }

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>👥 Gestión de Usuarios</h2>
        <button className="tool-btn primary" onClick={() => setShowAdd(true)}>➕ Nuevo usuario</button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="avatar" style={{ background: u.color, width: '32px', height: '32px', fontSize: '13px' }}>
                      {u.initials}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td>{u.email || u.id}</td>
                <td><span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                <td>
                  <button className="tool-btn danger" onClick={() => onDeleteUser(u.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <h3>➕ Nuevo usuario</h3>
            <input placeholder="Nombre completo" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} className="modal-input" />
            <input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="modal-input" />
            <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="modal-select">
              <option value={ROLES.ADMIN}>Administrador</option>
              <option value={ROLES.EDITOR}>Editor</option>
              <option value={ROLES.VIEWER}>Visualizador</option>
            </select>
            <div style={{ margin: '12px 0' }}>
              <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '6px' }}>Color</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {colors.map(c => (
                  <div key={c} onClick={() => setNewUser({ ...newUser, color: c })} style={{ width: '28px', height: '28px', borderRadius: '50%', background: c, cursor: 'pointer', border: newUser.color === c ? '3px solid #1a1a1a' : '3px solid transparent' }} />
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="tool-btn" onClick={() => setShowAdd(false)}>Cancelar</button>
              <button className="tool-btn primary" onClick={handleCreate}>Crear usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}