import React, { useState, useMemo } from 'react'
import { CONTAINER_SIZES, TARIFA_LABELS } from '../utils/constants.js'

export default function CostosPage({ data, columns, clientes, currentUser }) {
  const [selectedCliente, setSelectedCliente] = useState('')
  const [selectedStockNum, setSelectedStockNum] = useState('')
  const [editingFechaSalida, setEditingFechaSalida] = useState({})

  // Encontrar índice de columnas
  const colKeys = columns.map(c => c.key)
  const contenedorCol = 'contenedor'
  const clienteCol = 'cliente'
  const tamanioCol = 'tamanio'
  const teuCol = 'teu'
  const fechaIngCol = 'fecha_ingreso'
  const fechaSalCol = 'fecha_salida'

  // Extraer todos los contenedores del stock
  const contenedores = useMemo(() => {
    const result = []
    for (let r = 1; r <= 100; r++) {
      const contenedor = data[`${contenedorCol}_${r}`]
      if (!contenedor) continue
      const cliente = data[`${clienteCol}_${r}`]
      const tamanio = data[`${tamanioCol}_${r}`]
      const teu = parseFloat(data[`${teuCol}_${r}`]) || (CONTAINER_SIZES[tamanio]?.teu || 1)
      const fechaIngreso = data[`${fechaIngCol}_${r}`]
      const fechaSalida = editingFechaSalida[r] || data[`${fechaSalCol}_${r}`] || ''

      result.push({
        row: r,
        contenedor,
        cliente,
        tamanio: tamanio || '20',
        teu,
        fechaIngreso,
        fechaSalida,
        stockNum: String(r).padStart(3, '0')
      })
    }
    return result
  }, [data, editingFechaSalida])

  // Filtrar por stock number y cliente
  const filtrados = useMemo(() => {
    let filtered = contenedores
    if (selectedStockNum) {
      filtered = filtered.filter(c => c.stockNum === selectedStockNum.padStart(3, '0'))
    }
    if (selectedCliente) {
      filtered = filtered.filter(c => c.cliente === selectedCliente)
    }
    return filtered
  }, [contenedores, selectedStockNum, selectedCliente])

  // Clientes únicos
  const clientesUnicos = useMemo(() => {
    const set = new Set(contenedores.map(c => c.cliente).filter(Boolean))
    return Array.from(set).sort()
  }, [contenedores])

  // Stock numbers únicos
  const stockNumbers = useMemo(() => {
    return contenedores.map(c => c.stockNum)
  }, [contenedores])

  // Obtener tarifas del cliente seleccionado
  const tarifasCliente = useMemo(() => {
    if (!selectedCliente) return null
    const cliente = clientes.find(c => c.nombre === selectedCliente)
    return cliente?.tarifas || {}
  }, [selectedCliente, clientes])

  // Calcular costos
  const calculos = useMemo(() => {
    if (!tarifasCliente) return []
    return filtrados.map(c => {
      const hoy = new Date()
      const ing = c.fechaIngreso ? new Date(c.fechaIngreso) : hoy
      const sal = c.fechaSalida ? new Date(c.fechaSalida) : hoy
      const diasAlmacenaje = Math.max(1, Math.ceil((sal - ing) / (1000 * 60 * 60 * 24)) + 1)

      // Almacenaje = TEU × días × tarifa TEU/día
      const costoAlmacenaje = c.teu * diasAlmacenaje * (tarifasCliente.almacenaje_teu_dia || 12.50)

      // Gastos fijos por contenedor
      const costoIn = tarifasCliente.in_contenedor || 45
      const costoOut = tarifasCliente.out_contenedor || 45
      const costoTransporte = tarifasCliente.transporte_contenedor || 120
      const costoPBIP = tarifasCliente.pbip_contenedor || 25
      const costoGastosFijos = costoIn + costoOut + costoTransporte + costoPBIP

      const total = costoAlmacenaje + costoGastosFijos

      return {
        ...c,
        diasAlmacenaje,
        costoAlmacenaje,
        costoIn,
        costoOut,
        costoTransporte,
        costoPBIP,
        costoGastosFijos,
        total
      }
    })
  }, [filtrados, tarifasCliente])

  const totalGeneral = calculos.reduce((s, c) => s + c.total, 0)

  const handleFechaSalidaChange = (row, value) => {
    setEditingFechaSalida(prev => ({ ...prev, [row]: value }))
  }

  const exportCSV = () => {
    let csv = 'Stock,Contenedor,Tamaño,TEU,Fecha Ingreso,Fecha Salida,Días Alm.,Costo Alm.,In,Out,Transporte,PBIP,Gastos Fijos,Total\n'
    calculos.forEach(c => {
      csv += `${c.stockNum},${c.contenedor},${c.tamanio},${c.teu},${c.fechaIngreso || ''},${c.fechaSalida || ''},${c.diasAlmacenaje},${c.costoAlmacenaje.toFixed(2)},${c.costoIn.toFixed(2)},${c.costoOut.toFixed(2)},${c.costoTransporte.toFixed(2)},${c.costoPBIP.toFixed(2)},${c.costoGastosFijos.toFixed(2)},${c.total.toFixed(2)}\n`
    })
    csv += `TOTAL,,,,,,,,,,,,,${totalGeneral.toFixed(2)}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `costos_${selectedCliente || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="costos-page">
      <div className="costos-header">
        <h2>💰 Cálculo de Costos por Contenedor</h2>
        <button className="tool-btn primary" onClick={exportCSV} disabled={calculos.length === 0}>
          ⬇️ Exportar CSV
        </button>
      </div>

      <div className="costos-filters">
        <div className="filter-group">
          <label>N° Stock</label>
          <select value={selectedStockNum} onChange={e => setSelectedStockNum(e.target.value)} className="filter-select">
            <option value="">Todos</option>
            {stockNumbers.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Cliente</label>
          <select value={selectedCliente} onChange={e => setSelectedCliente(e.target.value)} className="filter-select">
            <option value="">Seleccionar cliente...</option>
            {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {selectedCliente && tarifasCliente && (
        <div className="tarifas-cliente-card">
          <h4>📋 Tarifas aplicadas: {selectedCliente}</h4>
          <div className="tarifas-mini-grid">
            {Object.entries(TARIFA_LABELS).map(([key, label]) => (
              <div key={key} className="tarifa-mini">
                <span className="tarifa-mini-label">{label}</span>
                <span className="tarifa-mini-value">
                  ${(tarifasCliente[key] || 0).toFixed(2)}
                  {key.includes('teu') ? '/TEU' : '/cont.'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {calculos.length > 0 ? (
        <div className="costos-table-container">
          <table className="costos-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th>Contenedor</th>
                <th>Tamaño</th>
                <th>TEU</th>
                <th>Fecha Ingreso</th>
                <th>Fecha Salida</th>
                <th>Días Alm.</th>
                <th>Costo Alm.</th>
                <th>In</th>
                <th>Out</th>
                <th>Transporte</th>
                <th>PBIP</th>
                <th>Gastos Fijos</th>
                <th className="total-col">Total</th>
              </tr>
            </thead>
            <tbody>
              {calculos.map(c => (
                <tr key={c.row}>
                  <td className="stock-cell">{c.stockNum}</td>
                  <td className="contenedor-cell">{c.contenedor}</td>
                  <td>{CONTAINER_SIZES[c.tamanio]?.label || c.tamanio}</td>
                  <td>{c.teu}</td>
                  <td>{c.fechaIngreso || '—'}</td>
                  <td>
                    <input
                      type="date"
                      value={c.fechaSalida}
                      onChange={e => handleFechaSalidaChange(c.row, e.target.value)}
                      className="fecha-input"
                    />
                  </td>
                  <td className="num-cell">{c.diasAlmacenaje}</td>
                  <td className="num-cell">${c.costoAlmacenaje.toFixed(2)}</td>
                  <td className="num-cell">${c.costoIn.toFixed(2)}</td>
                  <td className="num-cell">${c.costoOut.toFixed(2)}</td>
                  <td className="num-cell">${c.costoTransporte.toFixed(2)}</td>
                  <td className="num-cell">${c.costoPBIP.toFixed(2)}</td>
                  <td className="num-cell">${c.costoGastosFijos.toFixed(2)}</td>
                  <td className="total-cell">${c.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="13" style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>
                  TOTAL GENERAL:
                </td>
                <td className="total-cell" style={{ fontSize: '16px', fontWeight: 800, color: '#e74c3c' }}>
                  ${totalGeneral.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          {selectedCliente
            ? 'No hay contenedores para este cliente con los filtros aplicados.'
            : 'Selecciona un cliente para ver los costos de sus contenedores.'}
        </div>
      )}
    </div>
  )
}