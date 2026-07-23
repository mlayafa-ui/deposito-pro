import React, { useState, useMemo } from 'react'
import { TARIFA_LABELS, CONTAINER_SIZES } from '../utils/constants.js'

export default function CostosPage({ data, columns, clientes, currentUser }) {
  const [selectedCliente, setSelectedCliente] = useState('')
  const [editingFechaSalida, setEditingFechaSalida] = useState({})

  // Extraer contenedores del stock
  const contenedores = useMemo(() => {
    const result = []
    for (let r = 1; r <= 200; r++) {
      const contenedor = data[`contenedor_${r}`]
      if (!contenedor) continue
      const stock = data[`stock_${r}`]
      const tamanio = data[`tamanio_${r}`]
      const teu = CONTAINER_SIZES[tamanio]?.teu || 1
      const ingreso = data[`ingreso_${r}`]
      const salida = editingFechaSalida[r] || data[`salida_${r}`] || ''
      const cliente = data[`cliente_${r}`]

      result.push({
        row: r,
        contenedor,
        stock,
        tamanio,
        teu,
        ingreso,
        salida,
        cliente,
      })
    }
    return result
  }, [data, editingFechaSalida])

  // Clientes unicos
  const clientesUnicos = useMemo(() => {
    const set = new Set(contenedores.map(c => c.cliente).filter(Boolean))
    return Array.from(set).sort()
  }, [contenedores])

  // Filtrar por cliente
  const filtrados = useMemo(() => {
    if (!selectedCliente) return []
    return contenedores.filter(c => c.cliente === selectedCliente)
  }, [contenedores, selectedCliente])

  // Tarifas del cliente
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
      const ing = c.ingreso ? new Date(c.ingreso) : hoy
      const sal = c.salida ? new Date(c.salida) : hoy
      const diasAlmacenaje = Math.max(1, Math.ceil((sal - ing) / (1000 * 60 * 60 * 24)) + 1)

      const costoAlmacenaje = c.teu * diasAlmacenaje * (tarifasCliente.almacenaje_teu_dia || 12.50)
      const costoIn = tarifasCliente.in_contenedor || 45
      const costoOut = tarifasCliente.out_contenedor || 45
      const costoTransporte = tarifasCliente.transporte_contenedor || 120
      const costoPBIP = tarifasCliente.pbip_contenedor || 25
      const costoGastosFijos = costoIn + costoOut + costoTransporte + costoPBIP
      const total = costoAlmacenaje + costoGastosFijos

      return { ...c, diasAlmacenaje, costoAlmacenaje, costoIn, costoOut, costoTransporte, costoPBIP, costoGastosFijos, total }
    })
  }, [filtrados, tarifasCliente])

  const totalGeneral = calculos.reduce((s, c) => s + c.total, 0)

  const handleFechaSalidaChange = (row, value) => {
    setEditingFechaSalida(prev => ({ ...prev, [row]: value }))
  }

  const exportCSV = () => {
    let csv = 'Stock,Contenedor,Tamanio,TEU,Ingreso,Salida,Dias Alm.,Costo Alm.,In,Out,Transporte,PBIP,Gastos Fijos,Total\n'
    calculos.forEach(c => {
      csv += `${c.stock},${c.contenedor},${c.tamanio},${c.teu},${c.ingreso || ''},${c.salida || ''},${c.diasAlmacenaje},${c.costoAlmacenaje.toFixed(2)},${c.costoIn.toFixed(2)},${c.costoOut.toFixed(2)},${c.costoTransporte.toFixed(2)},${c.costoPBIP.toFixed(2)},${c.costoGastosFijos.toFixed(2)},${c.total.toFixed(2)}\n`
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
        <h2>💰 Calculo de Costos por Contenedor</h2>
        <button className="tool-btn primary" onClick={exportCSV} disabled={calculos.length === 0}>⬇️ Exportar CSV</button>
      </div>

      <div className="costos-filters">
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
                <span className="tarifa-mini-value">${(tarifasCliente[key] || 0).toFixed(2)} {key.includes('teu') ? '/TEU' : '/cont.'}</span>
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
                <th>Stock</th><th>Contenedor</th><th>Tamanio</th><th>TEU</th><th>Ingreso</th><th>Salida</th><th>Dias Alm.</th>
                <th>Costo Alm.</th><th>In</th><th>Out</th><th>Transporte</th><th>PBIP</th><th>Gastos Fijos</th><th className="total-col">Total</th>
              </tr>
            </thead>
            <tbody>
              {calculos.map(c => (
                <tr key={c.row}>
                  <td className="stock-cell">{c.stock}</td>
                  <td className="contenedor-cell">{c.contenedor}</td>
                  <td>{c.tamanio}</td>
                  <td>{c.teu}</td>
                  <td>{c.ingreso || '-'}</td>
                  <td><input type="date" value={c.salida} onChange={e => handleFechaSalidaChange(c.row, e.target.value)} className="fecha-input" /></td>
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
                <td colSpan="13" style={{ textAlign: 'right', fontWeight: 700, fontSize: '14px' }}>TOTAL GENERAL:</td>
                <td className="total-cell" style={{ fontSize: '16px', fontWeight: 800, color: '#e74c3c' }}>${totalGeneral.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          {selectedCliente ? 'No hay contenedores para este cliente.' : 'Selecciona un cliente para ver los costos.'}
        </div>
      )}
    </div>
  )
}