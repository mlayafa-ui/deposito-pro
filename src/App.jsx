import React, { useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { useSupabase } from './hooks/useSupabase.js'
import { PERMISSIONS } from './utils/auth.js'
import Login from './components/Login.jsx'
import StockSheet from './components/StockSheet.jsx'
import AuditLog from './components/AuditLog.jsx'
import UserManager from './components/UserManager.jsx'
import CostosPage from './pages/CostosPage.jsx'
import EstadisticasPage from './pages/EstadisticasPage.jsx'
import ConfigPage from './pages/ConfigPage.jsx'

function AppContent() {
  const [currentUser, setCurrentUser] = useState(null)
  const [activeTab, setActiveTab] = useState('stock')

  const {
    data, columns, auditLog, users, clientes, tarifas, loading, syncing,
    saveCell, deleteCell, saveColumn, deleteColumn,
    createUser, deleteUser, createCliente, updateClienteTarifa, saveTarifaGlobal
  } = useSupabase()

  const handleLogin = (user) => {
    setCurrentUser(user)
    toast.success(`Bienvenido, ${user.name}`)
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setActiveTab('stock')
    toast('Sesión cerrada')
  }

  if (loading) {
    return (
      <div className="login-overlay">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="login-title">🚢 Depósito Contenedores Pro</div>
          <div className="login-subtitle">Cargando datos...</div>
        </div>
      </div>
    )
  }

  const tabs = [
    { key: 'stock', label: '📋 Stock', always: true },
    { key: 'costos', label: '💰 Costos', always: true },
    { key: 'estadisticas', label: '📊 Estadísticas', always: true },
    { key: 'config', label: '⚙️ Configuración', adminOnly: true },
    { key: 'users', label: '👥 Usuarios', adminOnly: true },
    { key: 'logs', label: '📝 Logs', permission: PERMISSIONS.canViewLogs },
  ]

  const visibleTabs = tabs.filter(t => {
    if (t.always) return true
    if (t.adminOnly) return currentUser?.role === 'admin'
    if (t.permission) return t.permission(currentUser?.role)
    return true
  })

  return (
    <div className="app-container">
      <Toaster position="bottom-right" />

      {!currentUser && <Login onLogin={handleLogin} />}

      {currentUser && (
        <>
          <div className="top-bar">
            <div className="top-bar-left">
              <div className="logo">🚢 Depósito Pro</div>
              <div className="user-badge">
                <div className="avatar" style={{ background: currentUser.color }}>{currentUser.initials}</div>
                <span>{currentUser.name}</span>
                <span className={`role-badge-inline role-${currentUser.role}`}>{currentUser.role.toUpperCase()}</span>
              </div>
            </div>
            <div className="nav-tabs">
              {visibleTabs.map(t => (
                <button
                  key={t.key}
                  className={`nav-tab ${activeTab === t.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn-logout" onClick={handleLogout}>Salir</button>
          </div>

          <div className="main-content">
            {activeTab === 'stock' && (
              <div className="main-area">
                <StockSheet
                  data={data}
                  columns={columns}
                  currentUser={currentUser}
                  onSaveCell={saveCell}
                  onDeleteCell={deleteCell}
                  onSaveColumn={saveColumn}
                  onDeleteColumn={deleteColumn}
                  syncing={syncing}
                />
                <AuditLog auditLog={auditLog} currentUser={currentUser} />
              </div>
            )}

            {activeTab === 'costos' && (
              <CostosPage data={data} columns={columns} clientes={clientes} currentUser={currentUser} />
            )}

            {activeTab === 'estadisticas' && (
              <EstadisticasPage data={data} columns={columns} clientes={clientes} />
            )}

            {activeTab === 'config' && (
              <ConfigPage
                clientes={clientes}
                tarifas={tarifas}
                currentUser={currentUser}
                onCreateCliente={createCliente}
                onUpdateClienteTarifa={updateClienteTarifa}
                onSaveTarifaGlobal={saveTarifaGlobal}
              />
            )}

            {activeTab === 'users' && (
              <UserManager
                users={users}
                currentUser={currentUser}
                onCreateUser={createUser}
                onDeleteUser={deleteUser}
              />
            )}

            {activeTab === 'logs' && (
              <div style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
                <AuditLog auditLog={auditLog} currentUser={currentUser} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}