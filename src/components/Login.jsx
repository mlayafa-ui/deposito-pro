import React, { useState } from 'react'
import { DEMO_USERS, DEMO_PASSWORD } from '../utils/auth.js'

export default function Login({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!selectedUser) return
    if (password !== DEMO_PASSWORD) {
      setError('Contraseña incorrecta')
      return
    }
    onLogin(selectedUser)
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-title">🚢 Depósito Contenedores Pro</div>
        <div className="login-subtitle">Selecciona tu usuario</div>
        <div className="user-grid">
          {DEMO_USERS.map(u => (
            <div
              key={u.id}
              className={`user-option ${selectedUser?.id === u.id ? 'selected' : ''}`}
              onClick={() => { setSelectedUser(u); setError('') }}
            >
              <div className="u-avatar" style={{ background: u.color }}>{u.initials}</div>
              <div className="u-info">
                <span className="u-name">{u.name}</span>
                <span className="u-role">{u.role.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
        {selectedUser && (
          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="login-input"
            />
            {error && <div className="login-error">{error}</div>}
          </div>
        )}
        <button className="login-btn" onClick={handleLogin} disabled={!selectedUser}>
          Ingresar
        </button>
        <div className="login-hint">Contraseña de demo: <strong>password123</strong></div>
      </div>
    </div>
  )
}