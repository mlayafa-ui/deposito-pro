import React, { useState, useMemo } from 'react'
import { PERMISSIONS } from '../utils/auth.js'
import { CONTAINER_SIZES, TERMINALES } from '../utils/constants.js'

export default function StockSheet({ data, columns, currentUser, onSaveCell, onDeleteCell, onSaveColumn, onDeleteColumn, syncing }) {
  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [clipboard, setClipboard] = useState('')
  const [rows, setRows] = useState(50)
  const [showAddCol, setShowAddCol] = useState(false)
  const [newCol, setNewCol] = useState({ name: '', type: 'text' })

  const isAdmin = currentUser?.role === 'admin'
  const canEdit = PERMISSIONS.canEditStock(currentUser?.role)

  const getCellKey = (colKey, rowIdx) => `${colKey}_${rowIdx}`

  // Calcular datos computados (dias, estado, fecha_factura)
  const computedData = useMemo(() => {
    const result = { ...data }
    for (let r = 1; r <= rows; r++) {
      const ingreso = data[`ingreso_${r}`]
      const salida = data[`salida_${r}`]
      const factura = data[`factura_${r}`]

      // Calcular dias
      if (ingreso) {
        const ing = new Date(ingreso)
        const sal = salida ? new Date(salida) : new Date()
        const dias = Math.max(1, Math.ceil((sal - ing) / (1000 * 60 * 60 * 24)) + 1)
        result[`dias_${r}`] = String(dias)
      }

      // Calcular estado
      if (ingreso) {
        result[`estado_${r}`] = salida ? 'Salido' : 'En deposito'
      }

      // Calcular fecha_factura
      if (factura && !data[`fecha_factura_${r}`]) {
        result[`fecha_factura_${r}`] = new Date().toISOString().split('T')[0]
      }
    }
    return result
  }, [data, rows])

  const selectCell = (colKey, rowIdx) => {
    if (columns.find(c => c.key === colKey)?.computed) return // No seleccionar celdas computadas
    setEditingCell(null)
    setSelectedCell({ col: colKey, row: rowIdx })
  }

  const startEdit = (colKey, rowIdx) => {
    if (!canEdit) return
    if (columns.find(c => c.key === colKey)?.computed) return // No editar celdas computadas
    if (rowIdx === 0 && !isAdmin) return
    setSelectedCell({ col: colKey, row: rowIdx })
    setEditingCell({ col: colKey, row: rowIdx })
  }

  const finishEdit = async (colKey, rowIdx, value) => {
    const cellKey = getCellKey(colKey, rowIdx)
    const oldVal = data[cellKey] || ''
    if (value !== oldVal) {
      await onSaveCell(cellKey, value, currentUser)
      // Auto-calcular TEU si cambia tamanio
      if (colKey === 'tamanio' && CONTAINER_SIZES[value]) {
        const teuKey = getCellKey('teu', rowIdx)
        await onSaveCell(teuKey, String(CONTAINER_SIZES[value].teu), currentUser)
      }
      // Auto-calcular fecha_factura si cambia factura
      if (colKey === 'factura' && value && !data[`fecha_factura_${rowIdx}`]) {
        await onSaveCell(getCellKey('fecha_factura', rowIdx), new Date().toISOString().split('T')[0], currentUser)
      }
    }
    setEditingCell(null)
  }

  const copySelection = () => {
    if (!selectedCell) return
    const key = getCellKey(selectedCell.col, selectedCell.row)
    const val = computedData[key] || ''
    setClipboard(val)
    navigator.clipboard.writeText(val)
  }

  const pasteSelection = async () => {
    if (!selectedCell || !clipboard || !canEdit) return
    const key = getCellKey(selectedCell.col, selectedCell.row)
    await onSaveCell(key, clipboard, currentUser)
  }

  const addRow = () => setRows(r => r + 1)

  const deleteRow = async (rowIdx) => {
    if (!PERMISSIONS.canEditStock(currentUser?.role)) return
    for (const col of columns) {
      const key = getCellKey(col.key, rowIdx)
      if (data[key]) await onDeleteCell(key)
    }
  }

  const handleAddColumn = async () => {
    if (!newCol.name.trim()) return
    const key = newCol.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    await onSaveColumn({ key, label: newCol.name, type: newCol.type, position: columns.length, editable: true })
    setNewCol({ name: '', type: 'text' })
    setShowAddCol(false)
  }

  const exportCSV = () => {
    let csv = columns.map(c => c.label).join(',') + '\n'
    for (let r = 1; r <= rows; r++) {
      const row = columns.map(col => {
        const v = computedData[getCellKey(col.key, r)] || ''
        return v.includes(',') ? '"' + v + '"' : v
      }).join(',')
      csv += row + '\n'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'stock_contenedores_' + new Date().toISOString().split('T')[0] + '.csv'
    a.click()
  }

  const cellRef = selectedCell
    ? (selectedCell.row === 0 ? columns.find(c => c.key === selectedCell.col)?.label : `${selectedCell.col}_${selectedCell.row}`)
    : '-'

  return (
    <div className="spreadsheet-panel">
      <div className="toolbar">
        <button className="tool-btn" onClick={copySelection}>📋 Copiar</button>
        <button className="tool-btn" onClick={pasteSelection}>📥 Pegar</button>
        {canEdit && <button className="tool-btn" onClick={addRow}>➕ Fila</button>}
        <button className="tool-btn primary" onClick={exportCSV}>⬇️ Exportar CSV</button>
        {syncing && <div className="sync-indicator"><div className="sync-dot"/><span>Sincronizando...</span></div>}
      </div>

      <div className="formula-bar">
        <div className="cell-ref">{cellRef}</div>
        <input className="formula-input" value={selectedCell ? (computedData[getCellKey(selectedCell.col, selectedCell.row)] || '') : ''} readOnly placeholder="Valor de celda..." />
      </div>

      <div className="grid-container">
        <table className="grid-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}></th>
              {columns.map(col => (
                <th key={col.key} style={{ minWidth: col.computed ? '80px' : '120px' }}>
                  {editingCell?.col === col.key && editingCell?.row === 0 && isAdmin ? (
                    <input
                      autoFocus
                      defaultValue={col.label}
                      onBlur={e => {
                        finishEdit(col.key, 0, e.target.value.trim())
                        onSaveColumn({ ...col, label: e.target.value.trim() })
                      }}
                      onKeyDown={e => e.key === 'Enter' && finishEdit(col.key, 0, e.target.value.trim())}
                      style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 600 }}
                    />
                  ) : (
                    <span onDoubleClick={() => isAdmin && startEdit(col.key, 0)} style={{ cursor: isAdmin ? 'pointer' : 'default' }} title={isAdmin ? 'Doble clic para editar' : ''}>
                      {col.label}
                      {col.computed && <span style={{ fontSize: '9px', color: '#aaa', marginLeft: '4px' }}>⚡</span>}
                    </span>
                  )}
                  {isAdmin && !col.computed && <span className="col-delete" onClick={() => onDeleteColumn(col.key)} title="Eliminar">×</span>}
                </th>
              ))}
              {isAdmin && (
                <th style={{ minWidth: '50px', cursor: 'pointer' }} onClick={() => setShowAddCol(true)}>
                  <span style={{ fontSize: '18px', color: '#999' }}>+</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }, (_, ri) => {
              const r = ri + 1
              return (
                <tr key={r}>
                  <td style={{ textAlign: 'center', fontWeight: 600, color: '#888' }}>
                    {r}
                    {canEdit && <span className="row-delete" onClick={() => deleteRow(r)} title="Eliminar fila">×</span>}
                  </td>
                  {columns.map(col => {
                    const key = getCellKey(col.key, r)
                    const isSelected = selectedCell?.col === col.key && selectedCell?.row === r
                    const isEditing = editingCell?.col === col.key && editingCell?.row === r
                    const val = computedData[key] || ''
                    const isComputed = col.computed
                    const isTamanio = col.key === 'tamanio'
                    const isTerminal = col.key === 'terminal'

                    return (
                      <td
                        key={key}
                        className={`${isSelected ? 'selected' : ''} ${isComputed ? 'computed-cell' : ''}`}
                        onClick={() => selectCell(col.key, r)}
                        onDoubleClick={() => startEdit(col.key, r)}
                      >
                        {isEditing ? (
                          isTamanio ? (
                            <select
                              autoFocus
                              defaultValue={val}
                              onBlur={e => finishEdit(col.key, r, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && finishEdit(col.key, r, e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '0 6px' }}
                            >
                              <option value="">Seleccionar...</option>
                              {Object.entries(CONTAINER_SIZES).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                              ))}
                            </select>
                          ) : isTerminal ? (
                            <select
                              autoFocus
                              defaultValue={val}
                              onBlur={e => finishEdit(col.key, r, e.target.value)}
                              onKeyDown={e => e.key === 'Enter' && finishEdit(col.key, r, e.target.value)}
                              style={{ width: '100%', height: '100%', border: 'none', outline: 'none', padding: '0 6px' }}
                            >
                              <option value="">Seleccionar...</option>
                              {TERMINALES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : col.type === 'date' ? (
                            <input autoFocus type="date" defaultValue={val} onBlur={e => finishEdit(col.key, r, e.target.value)} onKeyDown={e => e.key === 'Enter' && finishEdit(col.key, r, e.target.value)} />
                          ) : col.type === 'number' ? (
                            <input autoFocus type="number" defaultValue={val} onBlur={e => finishEdit(col.key, r, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { finishEdit(col.key, r, e.target.value); if (r < rows) selectCell(col.key, r + 1) } if (e.key === 'Escape') setEditingCell(null) if (e.key === 'Tab') { e.preventDefault(); finishEdit(col.key, r, e.target.value); const nextIdx = columns.findIndex(c => c.key === col.key) + 1; if (nextIdx < columns.length) startEdit(columns[nextIdx].key, r) } }} />
                          ) : (
                            <input autoFocus type="text" defaultValue={val} onBlur={e => finishEdit(col.key, r, e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { finishEdit(col.key, r, e.target.value); if (r < rows) selectCell(col.key, r + 1) } if (e.key === 'Escape') setEditingCell(null) if (e.key === 'Tab') { e.preventDefault(); finishEdit(col.key, r, e.target.value); const nextIdx = columns.findIndex(c => c.key === col.key) + 1; if (nextIdx < columns.length) startEdit(columns[nextIdx].key, r) } }} />
                          )
                        ) : (
                          <span style={{ color: isComputed ? '#888' : '#1a1a1a', fontStyle: isComputed ? 'italic' : 'normal' }}>{val}</span>
                        )}
                      </td>
                    )
                  })}
                  {isAdmin && <td></td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showAddCol && (
        <div className="modal-overlay" onClick={() => setShowAddCol(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Agregar columna</h3>
            <input placeholder="Nombre" value={newCol.name} onChange={e => setNewCol({ ...newCol, name: e.target.value })} className="modal-input" autoFocus />
            <select value={newCol.type} onChange={e => setNewCol({ ...newCol, type: e.target.value })} className="modal-select">
              <option value="text">Texto</option>
              <option value="number">Numero</option>
              <option value="date">Fecha</option>
            </select>
            <div className="modal-actions">
              <button className="tool-btn" onClick={() => setShowAddCol(false)}>Cancelar</button>
              <button className="tool-btn primary" onClick={handleAddColumn}>Agregar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}