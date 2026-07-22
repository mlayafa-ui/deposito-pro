import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

export function useSupabase() {
  const [data, setData] = useState({})
  const [columns, setColumns] = useState([])
  const [auditLog, setAuditLog] = useState([])
  const [users, setUsers] = useState([])
  const [clientes, setClientes] = useState([])
  const [tarifas, setTarifas] = useState({})
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    loadAll()
    subscribeRealtime()
    return () => { supabase.removeAllChannels() }
  }, [])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([
      loadCells(), loadColumns(), loadAudit(), loadUsers(),
      loadClientes(), loadTarifas()
    ])
    setLoading(false)
  }

  const loadCells = async () => {
    const { data: cells } = await supabase.from('cells').select('*')
    if (cells) {
      const obj = {}
      cells.forEach(c => { obj[c.cell_key] = c.value })
      setData(obj)
    }
  }

  const loadColumns = async () => {
    const { data: cols } = await supabase.from('columns').select('*').order('position')
    if (cols && cols.length > 0) setColumns(cols)
  }

  const loadAudit = async () => {
    const { data: logs } = await supabase
      .from('audit_log').select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (logs) setAuditLog(logs)
  }

  const loadUsers = async () => {
    const { data: u } = await supabase.from('app_users').select('*')
    if (u) setUsers(u)
  }

  const loadClientes = async () => {
    const { data: c } = await supabase.from('clientes').select('*')
    if (c) setClientes(c)
  }

  const loadTarifas = async () => {
    const { data: t } = await supabase.from('tarifas_config').select('*')
    if (t) {
      const obj = {}
      t.forEach(item => { obj[item.key] = item.value })
      setTarifas(obj)
    }
  }

  const subscribeRealtime = () => {
    supabase.channel('cells_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cells' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setData(prev => { const n = { ...prev }; delete n[payload.old.cell_key]; return n })
        } else {
          setData(prev => ({ ...prev, [payload.new.cell_key]: payload.new.value }))
        }
      })
      .subscribe()

    supabase.channel('audit_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, (payload) => {
        setAuditLog(prev => [payload.new, ...prev])
      })
      .subscribe()

    supabase.channel('columns_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'columns' }, () => loadColumns())
      .subscribe()

    supabase.channel('clientes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => loadClientes())
      .subscribe()

    supabase.channel('tarifas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tarifas_config' }, () => loadTarifas())
      .subscribe()
  }

  const saveCell = async (cellKey, value, user) => {
    setSyncing(true)
    const oldValue = data[cellKey] || ''
    await supabase.from('cells').upsert(
      { cell_key: cellKey, value, updated_by: user?.name || 'Anónimo', updated_at: new Date().toISOString() },
      { onConflict: 'cell_key' }
    )
    await supabase.from('audit_log').insert({
      cell: cellKey, old_value: oldValue, new_value: value,
      user_name: user?.name || 'Anónimo',
      user_initials: user?.initials || '??',
      user_color: user?.color || '#666',
      user_role: user?.role || 'unknown'
    })
    setSyncing(false)
    return true
  }

  const deleteCell = async (cellKey) => {
    await supabase.from('cells').delete().eq('cell_key', cellKey)
  }

  const saveColumn = async (colData) => {
    setSyncing(true)
    await supabase.from('columns').upsert(colData, { onConflict: 'key' })
    setSyncing(false)
  }

  const deleteColumn = async (key) => {
    setSyncing(true)
    await supabase.from('columns').delete().eq('key', key)
    await supabase.from('cells').delete().like('cell_key', key + '_%')
    setSyncing(false)
  }

  const createUser = async (userData) => {
    setSyncing(true)
    await supabase.from('app_users').insert(userData)
    await loadUsers()
    setSyncing(false)
  }

  const deleteUser = async (id) => {
    await supabase.from('app_users').delete().eq('id', id)
    await loadUsers()
  }

  const createCliente = async (clienteData) => {
    setSyncing(true)
    await supabase.from('clientes').insert(clienteData)
    await loadClientes()
    setSyncing(false)
  }

  const updateClienteTarifa = async (clienteId, tarifaKey, value) => {
    const cliente = clientes.find(c => c.id === clienteId)
    if (!cliente) return
    const newTarifas = { ...cliente.tarifas, [tarifaKey]: value }
    await supabase.from('clientes').update({ tarifas: newTarifas }).eq('id', clienteId)
    await loadClientes()
  }

  const saveTarifaGlobal = async (key, value) => {
    await supabase.from('tarifas_config').upsert({ key, value }, { onConflict: 'key' })
    await loadTarifas()
  }

  return {
    data, columns, auditLog, users, clientes, tarifas, loading, syncing,
    saveCell, deleteCell, saveColumn, deleteColumn,
    createUser, deleteUser, createCliente, updateClienteTarifa, saveTarifaGlobal,
    loadAll, setData
  }
}
