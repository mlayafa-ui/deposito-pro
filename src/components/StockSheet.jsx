import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { PERMISSIONS } from '../utils/auth.js'
import { TERMINALES } from '../utils/constants.js'

const MAX_HISTORY = 50

// ===== HELPERS DE FECHA =====
function formatDate(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return isoDate
  return `${d}-${m}-${y}`
}

function parseDate(displayDate) {
  if (!displayDate) return ''
  const [d, m, y] = displayDate.split('-')
  if (!d || !m || !y) return displayDate
  return `${y}-${m}-${d}`
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

// ===== ORDEN FIJO DE COLUMNAS =====
const COLUMN_ORDER = [
  'contenedor',
  'stock',
  'ingreso',
  'salida',
  'teu',
  'dias',
  'ubicacion',
  'estado',
  'ms',
  'observaciones',
  'terminal',
  'habilitacion',
  'valor_mercaderia',
  'factura',
  'fecha_factura',
]

// ===== CONFIGURACIÓN DE COLUMNAS =====
const DEFAULT_COLUMNS_CONFIG = [
  { key: 'contenedor', label: 'Contenedor', type: 'text', editable: true },
  { key: 'stock', label: 'Stock', type: 'number', editable: true },
  { key: 'ingreso', label: 'Fecha In', type: 'date', editable: true },
  { key: 'salida', label: 'Fecha Out', type: 'date', editable: true },
  { key: 'teu', label: 'TEU', type: 'number', editable: true },
  { key: 'dias', label: 'Días', type: 'text', computed: true, editable: false },
  { key: 'ubicacion', label: 'Ubicación', type: 'text', editable: true },
  { key: 'estado', label: 'Estado', type: 'text', computed: true, editable: false },
  { key: 'ms', label: 'MS', type: 'text', editable: true },
  { key: 'observaciones', label: 'Observaciones', type: 'text', editable: true },
  { key: 'terminal', label: 'Terminal', type: 'text', editable: true },
  { key: 'habilitacion', label: 'Habilitación', type: 'text', editable: true },
  { key: 'valor_mercaderia', label: 'Valor Mercadería', type: 'number', editable: true },
  { key: 'factura', label: 'Factura', type: 'number', editable: true },
  { key: 'fecha_factura', label: 'Fecha Factura', type: 'date', computed: true, editable: false },
]

export default function StockSheet({ data, columns: rawColumns, currentUser, onSaveCell, onDeleteCell, onSaveColumn, onDeleteColumn, syncing }) {
  const columns = useMemo(() => {
    const colMap = new Map((rawColumns || DEFAULT_COLUMNS_CONFIG).map(c => [c.key, c]))
    return COLUMN_ORDER.map(key => colMap.get(key)).filter(Boolean)
  }, [rawColumns])

  const [selectedCell, setSelectedCell] = useState(null)
  const [editingCell, setEditingCell] = useState(null)
  const [clipboard, setClipboard] = useState('')
  const [rows, setRows] = useState(10000)
  const [showAddCol, setShowAddCol] = useState(false)
  const [newCol, setNewCol] = useState({ name: '', type: 'text' })
  const [localOverrides, setLocalOverrides] = useState({})
  
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filters, setFilters] = useState({})

  const historyRef = useRef([])
  const historyIndexRef = useRef(-1)
  const pendingSaves = useRef(new Set())
  const gridRef = useRef(null)

  const isAdmin = currentUser?.role === 'admin'
  const canEdit = PERMISSIONS.canEditStock(currentUser?.role)

  const getCellKey = (colKey, rowIdx) => `${colKey}_${rowIdx}`

  // ===== COMPUTED DATA =====
  const computedData = useMemo(() => {
    const result = { ...data, ...localOverrides }
    for (let r = 1; r <= rows; r++) {
      const ingreso = result[`ingreso_${r}`] || data[`ingreso_${r}`]
      const salida = result[`salida_${r}`] || data[`salida_${r}`]
      const factura = result[`factura_${r}`] || data[`factura_${r}`]

      if (ingreso) {
        const ing = new Date(ingreso)
        const sal = salida ? new Date(salida) : new Date()
        const dias = Math.max(1, Math.ceil((sal - ing) / (1000 * 60 * 60 * 24)) + 1)
        result[`dias_${r}`] = String(dias)
      }

      if (ingreso) {
        result[`estado_${r}`] = salida ? 'Salido' : 'En depósito'
      }

      if (factura && !result[`fecha_factura_${r}`] && !data[`fecha_factura_${r}`]) {
        result[`fecha_factura_${r}`] = todayISO()
      }
    }
    return result
  }, [data, rows, localOverrides])

  // ===== FILTRAR Y ORDENAR FILAS =====
  const visibleRows = useMemo(() => {
    let rowIndices = Array.from({ length: rows }, (_, i) => i + 1)

    for (const [colKey, filterVal] of Object.entries(filters)) {
      if (!filterVal) continue
      const lowerFilter = filterVal.toLowerCase()
      rowIndices = rowIndices.filter(r => {
        const val = (computedData[getCellKey(colKey, r)] || '').toLowerCase()
        return val.includes(lowerFilter)
      })
    }

    const withData = []
    const empty = []
    
    for (const r of rowIndices) {
      const hasData = columns.some(col => {
        const val = computedData[getCellKey(col.key, r)]
        return val && String(val).trim() !== ''
      })
      if (hasData) withData.push(r)
      else empty.push(r)
    }

    if (sortConfig.key) {
      withData.sort((a, b) => {
        const valA = computedData[getCellKey(sortConfig.key, a)] || ''
        const valB = computedData[getCellKey(sortConfig.key, b)] || ''
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
        return a - b
      })
    }

    return [...withData, ...empty]
  }, [rows, filters, sortConfig, computedData, columns])

  const getCellValue = useCallback((colKey, rowIdx) => {
    return computedData[getCellKey(colKey, rowIdx)] || ''
  }, [computedData])

  const isEditable = useCallback((colKey, rowIdx) => {
    if (!canEdit) return false
    if (columns.find(c => c.key === colKey)?.computed) return false
    if (rowIdx === 0 && !isAdmin) return false
    return true
  }, [canEdit, columns, isAdmin])

  const pushHistory = useCallback((cellKey, oldValue, newValue) => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    }
    historyRef.current.push({ cellKey, oldValue, newValue, timestamp: Date.now() })
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift()
    } else {
      historyIndexRef.current++
    }
  }, [])

  const undo = useCallback(async () => {
    if (historyIndexRef.current < 0) return
    const action = historyRef.current[historyIndexRef.current]
    historyIndexRef.current--
    setLocalOverrides(prev => ({ ...prev, [action.cellKey]: action.oldValue }))
    await onSaveCell(action.cellKey, action.oldValue, currentUser)
  }, [onSaveCell, currentUser])

  const redo = useCallback(async () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    const action = historyRef.current[historyIndexRef.current]
    setLocalOverrides(prev => ({ ...prev, [action.cellKey]: action.newValue }))
    await onSaveCell(action.cellKey, action.newValue, currentUser)
  }, [onSaveCell, currentUser])

  const canUndo = historyIndexRef.current >= 0
  const canRedo = historyIndexRef.current < historyRef.current.length - 1

  const moveSelection = useCallback((direction) => {
    if (!selectedCell) return
    const colIdx = columns.findIndex(c => c.key === selectedCell.col)
    const rowIdx = selectedCell.row
    let newColIdx = colIdx
    let newRowIdx = rowIdx

    switch (direction) {
      case 'up': newRowIdx = Math.max(1, rowIdx - 1); break
      case 'down': newRowIdx = Math.min(rows, rowIdx + 1); break
      case 'left': newColIdx = Math.max(0, colIdx - 1); break
      case 'right': newColIdx = Math.min(columns.length - 1, colIdx + 1); break
    }

    if (newColIdx !== colIdx || newRowIdx !== rowIdx) {
      const newCol = columns[newColIdx]
      if (newCol) {
        setEditingCell(null)
        setSelectedCell({ col: newCol.key, row: newRowIdx })
      }
    }
  }, [selectedCell, columns, rows])

  const startEdit = useCallback((colKey, rowIdx, initialValue = '') => {
    if (!isEditable(colKey, rowIdx)) return
    setSelectedCell({ col: colKey, row: rowIdx })
    setEditingCell({ col: colKey, row: rowIdx, initialValue })
  }, [isEditable])

  const finishEdit = useCallback(async (colKey, rowIdx, value) => {
    const cellKey = getCellKey(colKey, rowIdx)
    const oldVal = data[cellKey] || ''
    
    const col = columns.find(c => c.key === colKey)
    const finalValue = col?.type === 'date' ? parseDate(value) : value
    
    if (finalValue !== oldVal) {
      pushHistory(cellKey, oldVal, finalValue)
      setLocalOverrides(prev => ({ ...prev, [cellKey]: finalValue }))
      pendingSaves.current.add(cellKey)
      
      try {
        await onSaveCell(cellKey, finalValue, currentUser)
        
        if (colKey === 'factura' && finalValue && !data[`fecha_factura_${rowIdx}`]) {
          const fechaKey = getCellKey('fecha_factura', rowIdx)
          const fechaValue = todayISO()
          setLocalOverrides(prev => ({ ...prev, [fechaKey]: fechaValue }))
          await onSaveCell(fechaKey, fechaValue, currentUser)
        }
      } catch (err) {
        console.error('Error guardando celda:', err)
        setLocalOverrides(prev => {
          const next = { ...prev }
          delete next[cellKey]
          return next
        })
      } finally {
        pendingSaves.current.delete(cellKey)
      }
    }
    setEditingCell(null)
  }, [data, currentUser, onSaveCell, pushHistory, columns])

  const copyCell = useCallback(() => {
    if (!selectedCell) return
    const val = getCellValue(selectedCell.col, selectedCell.row)
    setClipboard(val)
    navigator.clipboard.writeText(val).catch(() => {})
  }, [selectedCell, getCellValue])

  const cutCell = useCallback(async () => {
    if (!selectedCell || !isEditable(selectedCell.col, selectedCell.row)) return
    const val = getCellValue(selectedCell.col, selectedCell.row)
    setClipboard(val)
    navigator.clipboard.writeText(val).catch(() => {})
    await finishEdit(selectedCell.col, selectedCell.row, '')
  }, [selectedCell, isEditable, getCellValue, finishEdit])

  const pasteCell = useCallback(async () => {
    if (!selectedCell || !clipboard || !isEditable(selectedCell.col, selectedCell.row)) return
    const key = getCellKey(selectedCell.col, selectedCell.row)
    setLocalOverrides(prev => ({ ...prev, [key]: clipboard }))
    await onSaveCell(key, clipboard, currentUser)
  }, [selectedCell, clipboard, isEditable, onSaveCell, currentUser])

  const handleGridKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          e.preventDefault()
          if (e.shiftKey) { redo() } else { undo() }
          return
        case 'y':
          e.preventDefault()
          redo()
          return
        case 'c':
          e.preventDefault()
          copyCell()
          return
        case 'x':
          e.preventDefault()
          cutCell()
          return
        case 'v':
          e.preventDefault()
          pasteCell()
          return
      }
    }

    if (editingCell) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setEditingCell(null)
      }
      return
    }

    if (!selectedCell) return
    const isLetterOrNumber = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey

    switch (e.key) {
      case 'ArrowUp': e.preventDefault(); moveSelection('up'); break
      case 'ArrowDown': e.preventDefault(); moveSelection('down'); break
      case 'ArrowLeft': e.preventDefault(); moveSelection('left'); break
      case 'ArrowRight': e.preventDefault(); moveSelection('right'); break
      case 'Enter':
        e.preventDefault()
        if (isEditable(selectedCell.col, selectedCell.row)) {
          startEdit(selectedCell.col, selectedCell.row, getCellValue(selectedCell.col, selectedCell.row))
        } else {
          moveSelection('down')
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) { moveSelection('left') } else { moveSelection('right') }
        break
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        if (isEditable(selectedCell.col, selectedCell.row)) {
          startEdit(selectedCell.col, selectedCell.row, '')
        }
        break
      default:
        if (isLetterOrNumber && isEditable(selectedCell.col, selectedCell.row)) {
          e.preventDefault()
          startEdit(selectedCell.col, selectedCell.row, e.key)
        }
        break
    }
  }, [editingCell, selectedCell, moveSelection, startEdit, isEditable, getCellValue, copyCell, cutCell, pasteCell, undo, redo])

  useEffect(() => {
    if (!editingCell && gridRef.current) {
      const timer = setTimeout(() => {
        gridRef.current.focus()
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [editingCell])

  useEffect(() => {
    if (gridRef.current) gridRef.current.focus()
  }, [])

  const addRow = useCallback(() => setRows(r => Math.max(r + 1, 10000)), [])
  const deleteRow = useCallback(async (rowIdx) => {
    if (!PERMISSIONS.canEditStock(currentUser?.role)) return
    for (const col of columns) {
      const key = getCellKey(col.key, rowIdx)
      if (data[key]) await onDeleteCell(key)
    }
  }, [columns, data, currentUser, onDeleteCell])

  const handleAddColumn = useCallback(async () => {
    if (!newCol.name.trim()) return
    const key = newCol.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    await onSaveColumn({ key, label: newCol.name, type: newCol.type, position: columns.length, editable: true })
    setNewCol({ name: '', type: 'text' })
    setShowAddCol(false)
  }, [newCol, columns.length, onSaveColumn])

  const exportCSV = useCallback(() => {
    let csv = columns.map(c => c.label).join(',') + '\n'
    for (let r = 1; r <= rows; r++) {
      const row = columns.map(col => {
        const v = getCellValue(col.key, r)
        return v.includes(',') ? '"' + v + '"' : v
      }).join(',')
      csv += row + '\n'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'stock_contenedores_' + todayISO() + '.csv'
    a.click()
  }, [columns, rows, getCellValue])

  const cellRef = selectedCell
    ? (selectedCell.row === 0 ? columns.find(c => c.key === selectedCell.col)?.label : `${selectedCell.col}_${selectedCell.row}`)
    : '-'

  const toggleSort = (colKey) => {
    setSortConfig(prev => {
      if (prev.key === colKey) {
        return { key: colKey, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key: colKey, direction: 'asc' }
    })
  }

  // ===== CELL INPUT =====
  function CellInput({ col, rowIdx, initialValue, onFinish, onNavigate }) {
    const isDate = col.type === 'date'
    const [value, setValue] = useState(isDate ? formatDate(initialValue) : initialValue)
    const inputRef = useRef(null)

    useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        if (inputRef.current.select) inputRef.current.select()
      }
    }, [])

    const handleChange = (e) => {
      setValue(e.target.value)
    }

    const handleBlur = () => {
      onFinish(value)
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        onFinish(value)
        setTimeout(() => onNavigate('down'), 0)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        onFinish(value)
        setTimeout(() => onNavigate(e.shiftKey ? 'left' : 'right'), 0)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onFinish(null)
      }
    }

    const commonStyle = { width: '100%', height: '100%', border: 'none', outline: 'none', padding: '0 6px', fontSize: '13px' }

    if (col.key === 'terminal') {
      return (
        <select ref={inputRef} value={value} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={commonStyle}>
          <option value="">Seleccionar...</option>
          {TERMINALES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      )
    }

    if (isDate) {
      return <input ref={inputRef} type="text" value={value} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={commonStyle} placeholder="dd-mm-aaaa" />
    }

    if (col.type === 'number') {
      return <input ref={inputRef} type="number" value={value} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={commonStyle} />
    }

    return <input ref={inputRef} type="text" value={value} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} style={commonStyle} />
  }

  return (
    <div className="spreadsheet-panel">
      <div className="toolbar">
        <button className="tool-btn" onClick={copyCell}>📋 Copiar</button>
        <button className="tool-btn" onClick={pasteCell}>📥 Pegar</button>
        <button className="tool-btn" onClick={undo} disabled={!canUndo} title="Deshacer (Ctrl+Z)">↩️ Deshacer</button>
        <button className="tool-btn" onClick={redo} disabled={!canRedo} title="Rehacer (Ctrl+Y)">↪️ Rehacer</button>
        <button className="tool-btn primary" onClick={exportCSV}>⬇️ Exportar CSV</button>
        {syncing && <div className="sync-indicator"><div className="sync-dot"/><span>Sincronizando...</span></div>}
      </div>

      <div className="formula-bar">
        <div className="cell-ref">{cellRef}</div>
        <input className="formula-input" value={selectedCell ? getCellValue(selectedCell.col, selectedCell.row) : ''} readOnly placeholder="Valor de celda..." />
      </div>

      <div className="grid-container" ref={gridRef} tabIndex={0} onKeyDown={handleGridKeyDown}>
        <table className="grid-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}></th>
              {columns.map(col => (
                <th key={col.key} style={{ minWidth: col.computed ? '80px' : '140px' }}>
                  {editingCell?.col === col.key && editingCell?.row === 0 && isAdmin ? (
                    <input autoFocus defaultValue={col.label} onBlur={e => { finishEdit(col.key, 0, e.target.value.trim()); onSaveColumn({ ...col, label: e.target.value.trim() }) }} onKeyDown={e => e.key === 'Enter' && finishEdit(col.key, 0, e.target.value.trim())} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 600 }} />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <span 
                        onClick={() => !col.computed && toggleSort(col.key)}
                        onDoubleClick={() => isAdmin && startEdit(col.key, 0)} 
                        style={{ cursor: col.computed ? 'default' : 'pointer', fontWeight: sortConfig.key === col.key ? 700 : 600 }} 
                        title={col.computed ? '' : 'Clic para ordenar'}
                      >
                        {col.label}
                        {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                        {col.computed && <span style={{ fontSize: '9px', color: '#aaa', marginLeft: '4px' }}>⚡</span>}
                      </span>
                      {!col.computed && (
                        <input
                          type="text"
                          placeholder="Filtrar..."
                          value={filters[col.key] || ''}
                          onChange={e => setFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                          style={{ width: '90%', padding: '2px 4px', fontSize: '10px', border: '1px solid #ddd', borderRadius: '3px' }}
                        />
                      )}
                    </div>
                  )}
                  {isAdmin && !col.computed && <span className="col-delete" onClick={() => onDeleteColumn(col.key)} title="Eliminar">×</span>}
                </th>
              ))}
              {isAdmin && <th style={{ minWidth: '50px', cursor: 'pointer' }} onClick={() => setShowAddCol(true)}><span style={{ fontSize: '18px', color: '#999' }}>+</span></th>}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(r => (
              <tr key={r}>
                <td style={{ textAlign: 'center', fontWeight: 600, color: '#888', userSelect: 'none' }}>
                  {r}
                  {canEdit && <span className="row-delete" onClick={() => deleteRow(r)} title="Eliminar fila">×</span>}
                </td>
                {columns.map(col => {
                  const key = getCellKey(col.key, r)
                  const isSelected = selectedCell?.col === col.key && selectedCell?.row === r
                  const isEditing = editingCell?.col === col.key && editingCell?.row === r
                  const rawVal = getCellValue(col.key, r)
                  const displayVal = col.type === 'date' ? formatDate(rawVal) : rawVal
                  const isComputed = col.computed
                  const isPending = pendingSaves.current.has(key)

                  return (
                    <td key={key} className={`${isSelected ? 'selected' : ''} ${isComputed ? 'computed-cell' : ''} ${isEditing ? 'editing' : ''} ${isPending ? 'pending-save' : ''}`} onClick={() => { setEditingCell(null); setSelectedCell({ col: col.key, row: r }) }}>
                      {isEditing ? (
                        <CellInput
                          col={col}
                          rowIdx={r}
                          initialValue={rawVal}
                          onFinish={(value) => {
                            if (value !== null) {
                              finishEdit(col.key, r, value)
                            } else {
                              setEditingCell(null)
                            }
                          }}
                          onNavigate={(direction) => {
                            moveSelection(direction)
                          }}
                        />
                      ) : (
                        <span style={{ color: isComputed ? '#888' : '#1a1a1a', fontStyle: isComputed ? 'italic' : 'normal' }}>
                          {displayVal}
                          {isPending && <span className="pending-indicator">⏳</span>}
                        </span>
                      )}
                    </td>
                  )
                })}
                {isAdmin && <td></td>}
              </tr>
            ))}
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