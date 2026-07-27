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

// Tamanios: 20 o 40 → TEU auto-calculado
export const CONTAINER_SIZES = {
  '20': { teu: 1 },
  '40': { teu: 2 },
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
  { key: 'contenedor', label: 'Contenedor', type: 'text', editable: true },
  { key: 'stock', label: 'Stock', type: 'number', editable: true },
  { key: 'ingreso', label: 'Fecha In', type: 'date', editable: true },
  { key: 'salida', label: 'Fecha Out', type: 'date', editable: true },
  { key: 'tamanio', label: 'Tamaño', type: 'number', editable: true },
  { key: 'teu', label: 'TEU', type: 'number', computed: true, editable: false },
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