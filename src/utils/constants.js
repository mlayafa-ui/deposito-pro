export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer'
}

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.VIEWER]: 'Visualizador'
}

export const CONTAINER_SIZES = {
  '20': { teu: 1, label: "20' STD" },
  '40': { teu: 2, label: "40' STD" },
  '40HC': { teu: 2, label: "40' HC" },
  '45': { teu: 2.25, label: "45' HC" },
}

export const DEFAULT_TARIFAS = {
  // Tarifas por TEU (almacenaje)
  almacenaje_teu_dia: 12.50,
  almacenaje_teu_mes: 350.00,

  // Tarifas por contenedor (gastos fijos)
  in_contenedor: 45.00,
  out_contenedor: 45.00,
  transporte_contenedor: 120.00,
  pbip_contenedor: 25.00,
}

export const TARIFA_LABELS = {
  almacenaje_teu_dia: 'Almacenaje TEU/día',
  almacenaje_teu_mes: 'Almacenaje TEU/mes',
  in_contenedor: 'In (por contenedor)',
  out_contenedor: 'Out (por contenedor)',
  transporte_contenedor: 'Transporte (por contenedor)',
  pbip_contenedor: 'PBIP (por contenedor)',
}

export const DEFAULT_CLIENTES = [
  { id: 'cliente_a', nombre: 'Cliente A', tarifas: { ...DEFAULT_TARIFAS } },
  { id: 'cliente_b', nombre: 'Cliente B', tarifas: { ...DEFAULT_TARIFAS } },
  { id: 'cliente_c', nombre: 'Cliente C', tarifas: { ...DEFAULT_TARIFAS } },
]

export const STOCK_COLUMNS = [
  { key: 'contenedor', label: 'Contenedor', type: 'text' },
  { key: 'cliente', label: 'Cliente', type: 'text' },
  { key: 'tamanio', label: 'Tamaño', type: 'select' },
  { key: 'teu', label: 'TEU', type: 'number' },
  { key: 'fecha_ingreso', label: 'Fecha Ingreso', type: 'date' },
  { key: 'fecha_salida', label: 'Fecha Salida', type: 'date' },
  { key: 'ubicacion', label: 'Ubicación', type: 'text' },
  { key: 'estado', label: 'Estado', type: 'select' },
  { key: 'mercancia', label: 'Mercancía', type: 'text' },
  { key: 'observaciones', label: 'Observaciones', type: 'text' },
]
