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

// Tamanios: 20 o 40 (si es diferente, se aclara en obs)
export const CONTAINER_SIZES = {
  '20': { teu: 1, label: "20'" },
  '40': { teu: 2, label: "40'" },
}

export const TERMINALES = ['TCP', 'Montecon']

export const DEFAULT_TARIFAS = {
  almacenaje_teu_dia: 12.50,
  almacenaje_teu_mes: 350.00,
  in_contenedor: 45.00,
  out_contenedor: 45.00,
  transporte_contenedor: 120.00,
  pbip_contenedor: 25.00,
}

export const TARIFA_LABELS = {
  almacenaje_teu_dia: 'Almacenaje TEU/dia',
  almacenaje_teu_mes: 'Almacenaje TEU/mes',
  in_contenedor: 'In (por contenedor)',
  out_contenedor: 'Out (por contenedor)',
  transporte_contenedor: 'Transporte (por contenedor)',
  pbip_contenedor: 'PBIP (por contenedor)',
}

export const STOCK_COLUMNS = [
  { key: 'contenedor', label: 'Contenedor', type: 'text' },
  { key: 'stock', label: 'Stock', type: 'text' },
  { key: 'ingreso', label: 'Ingreso', type: 'date' },
  { key: 'salida', label: 'Salida', type: 'date' },
  { key: 'tamanio', label: 'Tamanio', type: 'select' },
  { key: 'dias', label: 'Dias', type: 'number', computed: true },
  { key: 'estado', label: 'Estado', type: 'text', computed: true },
  { key: 'cliente', label: 'Cliente', type: 'text' },
  { key: 'ms', label: 'MS', type: 'text' },
  { key: 'terminal', label: 'Terminal de retiro', type: 'select' },
  { key: 'habilitacion', label: 'Habilitacion', type: 'text' },
  { key: 'obs', label: 'Obs', type: 'text' },
  { key: 'valor', label: 'Valor mercaderia', type: 'number' },
  { key: 'factura', label: 'Factura', type: 'text' },
  { key: 'fecha_factura', label: 'Fecha factura', type: 'date', computed: true },
]
