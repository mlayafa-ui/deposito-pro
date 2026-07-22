import React, { useState } from 'react'
import { PERMISSIONS } from '../utils/auth.js'
import { TARIFA_LABELS, DEFAULT_TARIFAS } from '../utils/constants.js'

export default function ConfigPage({ clientes, tarifas, currentUser, onCreateCliente, onUpdateClienteTarifa, onSaveTarifaGlobal }) {
  const [activeTab, setActiveTab] = useState('clientes')
  const [showAddCliente, setShowAddCliente] = useState(false)
  const [newCliente, setNewCliente] = useState({ nombre: '' })
  const [editingTarifa, setEditingTarifa] = useState({})

  if (!PERMISSIONS.canManageTarifas(currentUser?.role)) {
    return (
      <div className="config-page">
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          Solo el administrador puede gestionar tarifas y clientes.
        </div>
      </div>
    )
  }

  const handleSaveTarifa = (clienteId, key, value) => {
    onUpdateClienteTarifa(clienteId, key, parseFloat(value) || 0)
    setEditingTarifa({})
  }

  const handleCreateCliente = () => {
    if (!newCliente.nombre.trim()) return
    onCreateCliente({
      id: newCliente.nombre.toLowerCase().replace(/\s+/g, '_'),
      nombre: newCliente.nombre,
      tarifas: { ...DEFAULT_TARIFAS }
    })
    setNewCliente({ nombre: '' })
    setShowAddCliente(false)
  }

  return (
    <div className="config-page">
      <div className="config-header">
        <h2>⚙️ Configuración</h2>
        <div className="config-tabs">
          <button className={`config-tab ${activeTab === 'clientes' ? 'active' : ''}`} onClick={() => setActiveTab('clientes')}>
            👥 Clientes y Tarifas
          </button>
          <button className={`config-tab ${activeTab === 'globales' ? 'active' : ''}`} onClick={() => setActiveTab('globales')}>
            🌍 Tarifas Globales
          </button>
        </div>
      </div>

      {activeTab === 'clientes' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button className="tool-btn primary" onClick={() => setShowAddCliente(true)}>➕ Nuevo Cliente</button>
          </div>

          {clientes.map(cliente => (
            <div key={cliente.id} className="cliente-card">
              <div className="cliente-header">
                <h3>{cliente.nombre}</h3>
                <span className="cliente-id">ID: {cliente.id}</span>
              </div>
              <div className="tarifas-grid">
                {Object.entries(TARIFA_LABELS).map(([key, label]) => {
                  const isEditing = editingTarifa.clienteId === cliente.id && editingTarifa.key === key
                  const value = cliente.tarifas?.[key] || tarifas[key] || DEFAULT_TARIFAS[key]
                  return (
                    <div key={key} className="tarifa-row">
                      <span className="tarifa-label">{label}</span>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            step="0.01"
                            autoFocus
                            defaultValue={value}
                            onBlur={e => handleSaveTarifa(cliente.id, key, e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSaveTarifa(cliente.id, key, e.target.value)}
                            className="tarifa-input-small"
                          />
                          <span className="tarifa-unit-small">{key.includes('teu') ? '$/TEU' : '$/cont.'}</span>
                        </div>
                      ) : (
                        <div className="tarifa-value" onClick={() => setEditingTarifa({ clienteId: cliente.id, key })}>
                          <span className="tarifa-number">${value.toFixed(2)}</span>
                          <span className="tarifa-unit">{key.includes('teu') ? '/TEU' : '/cont.'}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {activeTab === 'globales' && (
        <div className="cliente-card">
          <div className="cliente-header">
            <h3>🌍 Tarifas Globales (default)</h3>
            <span className="cliente-id">Se aplican cuando un cliente no tiene tarifa específica</span>
          </div>
          <div className="tarifas-grid">
            {Object.entries(TARIFA_LABELS).map(([key, label]) => {
              const value = tarifas[key] || DEFAULT_TARIFAS[key]
              return (
                <div key={key} className="tarifa-row">
                  <span className="tarifa-label">{label}</span>
                  <div className="tarifa-value">
                    <span className="tarifa-number">${value.toFixed(2)}</span>
                    <span className="tarifa-unit">{key.includes('teu') ? '/TEU' : '/cont.'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showAddCliente && (
        <div className="modal-overlay" onClick={() => setShowAddCliente(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>➕ Nuevo Cliente</h3>
            <input
              placeholder="Nombre del cliente"
              value={newCliente.nombre}
              onChange={e => setNewCliente({ nombre: e.target.value })}
              className="modal-input"
              autoFocus
            />
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              Se creará con las tarifas globales por defecto. Luego puedes personalizarlas.
            </p>
            <div className="modal-actions">
              <button className="tool-btn" onClick={() => setShowAddCliente(false)}>Cancelar</button>
              <button className="tool-btn primary" onClick={handleCreateCliente}>Crear Cliente</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}