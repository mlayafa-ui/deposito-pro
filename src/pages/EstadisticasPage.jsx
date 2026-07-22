import React, { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts'
import { CONTAINER_SIZES } from '../utils/constants.js'

const COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#ff6b6b', '#4ecdc4']

export default function EstadisticasPage({ data, columns, clientes }) {
  const [chartType, setChartType] = useState('teus_mes')
  const [filterCliente, setFilterCliente] = useState('')

  // Extraer contenedores
  const contenedores = useMemo(() => {
    const result = []
    for (let r = 1; r <= 100; r++) {
      const contenedor = data[`contenedor_${r}`]
      if (!contenedor) continue
      const cliente = data[`cliente_${r}`]
      const tamanio = data[`tamanio_${r}`]
      const teu = parseFloat(data[`teu_${r}`]) || (CONTAINER_SIZES[tamanio]?.teu || 1)
      const fechaIngreso = data[`fecha_ingreso_${r}`]
      const fechaSalida = data[`fecha_salida_${r}`]

      result.push({
        row: r,
        contenedor,
        cliente: cliente || 'Sin cliente',
        tamanio: tamanio || '20',
        teu,
        fechaIngreso,
        fechaSalida,
        mesIngreso: fechaIngreso ? fechaIngreso.slice(0, 7) : null,
      })
    }
    return result
  }, [data])

  const clientesUnicos = useMemo(() => {
    const set = new Set(contenedores.map(c => c.cliente))
    return Array.from(set).sort()
  }, [contenedores])

  const filtered = useMemo(() => {
    if (!filterCliente) return contenedores
    return contenedores.filter(c => c.cliente === filterCliente)
  }, [contenedores, filterCliente])

  // KPIs
  const kpis = useMemo(() => {
    const totalTEUs = filtered.reduce((s, c) => s + c.teu, 0)
    const totalContenedores = filtered.length
    const contActivos = filtered.filter(c => !c.fechaSalida).length
    const contSalidos = filtered.filter(c => c.fechaSalida).length
    const teusActivos = filtered.filter(c => !c.fechaSalida).reduce((s, c) => s + c.teu, 0)

    // Días promedio de almacenaje
    let totalDias = 0
    let contConDias = 0
    filtered.forEach(c => {
      if (c.fechaIngreso) {
        const ing = new Date(c.fechaIngreso)
        const sal = c.fechaSalida ? new Date(c.fechaSalida) : new Date()
        const dias = Math.ceil((sal - ing) / (1000 * 60 * 60 * 24)) + 1
        totalDias += dias
        contConDias++
      }
    })
    const diasPromedio = contConDias > 0 ? (totalDias / contConDias).toFixed(1) : 0

    // Máximo TEUs simultáneos (simulado: conteos por mes)
    const maxTEUs = totalTEUs // Simplificado

    return { totalTEUs, totalContenedores, contActivos, contSalidos, teusActivos, diasPromedio, maxTEUs }
  }, [filtered])

  // Datos por mes (TEUs ingresados)
  const porMes = useMemo(() => {
    const map = {}
    filtered.forEach(c => {
      if (!c.mesIngreso) return
      if (!map[c.mesIngreso]) map[c.mesIngreso] = { mes: c.mesIngreso, teus: 0, contenedores: 0 }
      map[c.mesIngreso].teus += c.teu
      map[c.mesIngreso].contenedores += 1
    })
    return Object.values(map).sort((a, b) => a.mes.localeCompare(b.mes))
  }, [filtered])

  // Datos por cliente
  const porCliente = useMemo(() => {
    const map = {}
    filtered.forEach(c => {
      if (!map[c.cliente]) map[c.cliente] = { cliente: c.cliente, teus: 0, contenedores: 0 }
      map[c.cliente].teus += c.teu
      map[c.cliente].contenedores += 1
    })
    return Object.values(map).sort((a, b) => b.teus - a.teus)
  }, [filtered])

  // Datos por tamaño
  const porTamanio = useMemo(() => {
    const map = {}
    filtered.forEach(c => {
      const label = CONTAINER_SIZES[c.tamanio]?.label || c.tamanio
      if (!map[label]) map[label] = { tamanio: label, teus: 0, contenedores: 0 }
      map[label].teus += c.teu
      map[label].contenedores += 1
    })
    return Object.values(map)
  }, [filtered])

  // Evolución de stock (TEUs acumulados por mes)
  const evolucion = useMemo(() => {
    const meses = [...new Set(contenedores.map(c => c.mesIngreso).filter(Boolean))].sort()
    return meses.map(mes => {
      const ingresados = contenedores.filter(c => c.mesIngreso === mes).reduce((s, c) => s + c.teu, 0)
      const salidos = contenedores.filter(c => c.fechaSalida && c.fechaSalida.slice(0, 7) === mes).reduce((s, c) => s + c.teu, 0)
      const activos = contenedores.filter(c => {
        if (!c.fechaIngreso) return false
        const ing = c.fechaIngreso.slice(0, 7)
        if (ing > mes) return false
        if (c.fechaSalida && c.fechaSalida.slice(0, 7) <= mes) return false
        return true
      }).reduce((s, c) => s + c.teu, 0)
      return { mes, ingresados, salidos, activos }
    })
  }, [contenedores])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null
    return (
      <div style={{ background: '#fff', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontSize: '13px' }}>
            {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('es-ES', { minimumFractionDigits: 0 }) : p.value}
          </div>
        ))}
      </div>
    )
  }

  const chartOptions = [
    { key: 'teus_mes', label: '📅 TEUs por Mes', icon: '📅' },
    { key: 'teus_cliente', label: '🏢 TEUs por Cliente', icon: '🏢' },
    { key: 'cont_tamanio', label: '📦 Contenedores por Tamaño', icon: '📦' },
    { key: 'evolucion', label: '📈 Evolución Stock', icon: '📈' },
    { key: 'distribucion', label: '🥧 Distribución TEUs', icon: '🥧' },
  ]

  return (
    <div className="estadisticas-page">
      <div className="estadisticas-header">
        <h2>📊 Estadísticas del Depósito</h2>
        <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="filter-select" style={{ width: '220px' }}>
          <option value="">Todos los clientes</option>
          {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total TEUs</div>
          <div className="kpi-value">{kpis.totalTEUs.toLocaleString('es-ES')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Contenedores</div>
          <div className="kpi-value">{kpis.totalContenedores}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">TEUs Activos</div>
          <div className="kpi-value" style={{ color: '#27ae60' }}>{kpis.teusActivos.toLocaleString('es-ES')}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cont. Activos</div>
          <div className="kpi-value" style={{ color: '#3498db' }}>{kpis.contActivos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cont. Salidos</div>
          <div className="kpi-value" style={{ color: '#e74c3c' }}>{kpis.contSalidos}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Días Promedio</div>
          <div className="kpi-value">{kpis.diasPromedio}</div>
        </div>
      </div>

      {/* Selector de gráficos */}
      <div className="chart-tabs">
        {chartOptions.map(opt => (
          <button
            key={opt.key}
            className={`chart-tab ${chartType === opt.key ? 'active' : ''}`}
            onClick={() => setChartType(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Gráficos */}
      <div className="chart-container">
        {chartType === 'teus_mes' && (
          <>
            <h3 style={{ marginBottom: '16px' }}>📅 TEUs Ingresados por Mes</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={porMes} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="teus" fill="#3498db" radius={[4, 4, 0, 0]} name="TEUs" />
                <Bar dataKey="contenedores" fill="#2ecc71" radius={[4, 4, 0, 0]} name="Contenedores" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {chartType === 'teus_cliente' && (
          <>
            <h3 style={{ marginBottom: '16px' }}>🏢 TEUs por Cliente</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={porCliente} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="cliente" type="category" tick={{ fontSize: 11 }} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="teus" fill="#9b59b6" radius={[0, 4, 4, 0]} name="TEUs" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {chartType === 'cont_tamanio' && (
          <>
            <h3 style={{ marginBottom: '16px' }}>📦 Contenedores por Tamaño</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={porTamanio} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="tamanio" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="contenedores" fill="#f39c12" radius={[4, 4, 0, 0]} name="Contenedores" />
                <Bar dataKey="teus" fill="#e74c3c" radius={[4, 4, 0, 0]} name="TEUs" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {chartType === 'evolucion' && (
          <>
            <h3 style={{ marginBottom: '16px' }}>📈 Evolución del Stock (TEUs Activos)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={evolucion} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorActivos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27ae60" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#27ae60" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorIngresados" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498db" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="activos" stroke="#27ae60" fillOpacity={1} fill="url(#colorActivos)" name="TEUs Activos" />
                <Area type="monotone" dataKey="ingresados" stroke="#3498db" fillOpacity={1} fill="url(#colorIngresados)" name="TEUs Ingresados" />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {chartType === 'distribucion' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '16px' }}>🥧 Distribución TEUs por Cliente</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={porCliente}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={120}
                    paddingAngle={3}
                    dataKey="teus"
                    nameKey="cliente"
                    label={({ cliente, percent }) => `${cliente} ${(percent * 100).toFixed(0)}%`}
                  >
                    {porCliente.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>🥧 Distribución por Tamaño</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={porTamanio}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={120}
                    paddingAngle={3}
                    dataKey="contenedores"
                    nameKey="tamanio"
                    label={({ tamanio, percent }) => `${tamanio} ${(percent * 100).toFixed(0)}%`}
                  >
                    {porTamanio.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {contenedores.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          No hay contenedores cargados.<br/>Agrega contenedores en la pestaña "Stock" primero.
        </div>
      )}
    </div>
  )
}