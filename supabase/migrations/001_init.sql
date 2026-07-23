-- ============================================
-- Deposito Contenedores Pro - Esquema Completo
-- ============================================

-- Tabla de usuarios de la aplicacion
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  color TEXT DEFAULT '#3498db',
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de columnas dinamicas
-- Agregar columna computed si no existe (para actualizaciones)
ALTER TABLE columns ADD COLUMN IF NOT EXISTS computed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS columns (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'select')),
  position INTEGER NOT NULL,
  editable BOOLEAN DEFAULT TRUE,
  computed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de celdas (datos de la hoja de stock)
CREATE TABLE IF NOT EXISTS cells (
  cell_key TEXT PRIMARY KEY,
  value TEXT,
  updated_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de clientes con tarifas personalizadas
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tarifas JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tarifas globales (default)
CREATE TABLE IF NOT EXISTS tarifas_config (
  key TEXT PRIMARY KEY,
  value DECIMAL(10,4) NOT NULL,
  label TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  cell TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  user_name TEXT,
  user_initials TEXT,
  user_color TEXT,
  user_role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cells_key ON cells(cell_key);
CREATE INDEX IF NOT EXISTS idx_cells_updated ON cells(updated_at);
CREATE INDEX IF NOT EXISTS idx_audit_cell ON audit_log(cell);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_name);
CREATE INDEX IF NOT EXISTS idx_columns_position ON columns(position);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all app_users" ON app_users;
CREATE POLICY "Allow all app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all columns" ON columns;
CREATE POLICY "Allow all columns" ON columns FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all cells" ON cells;
CREATE POLICY "Allow all cells" ON cells FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all clientes" ON clientes;
CREATE POLICY "Allow all clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all tarifas" ON tarifas_config;
CREATE POLICY "Allow all tarifas" ON tarifas_config FOR ALL USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all audit_log" ON audit_log;
CREATE POLICY "Allow all audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Datos iniciales
-- ============================================

INSERT INTO app_users (id, name, email, role, color, initials) VALUES
  ('admin@deposito.com', 'Admin Principal', 'admin@deposito.com', 'admin', '#e74c3c', 'AP'),
  ('ana@deposito.com', 'Ana Garcia', 'ana@deposito.com', 'editor', '#3498db', 'AG'),
  ('luis@deposito.com', 'Luis Martinez', 'luis@deposito.com', 'editor', '#2ecc71', 'LM'),
  ('carlos@deposito.com', 'Carlos Ruiz', 'carlos@deposito.com', 'viewer', '#9b59b6', 'CR'),
  ('sofia@deposito.com', 'Sofia Lopez', 'sofia@deposito.com', 'viewer', '#f39c12', 'SL')
ON CONFLICT (id) DO NOTHING;

-- Columnas reales del deposito
INSERT INTO columns (key, label, type, position, editable, computed) VALUES
  ('contenedor', 'Contenedor', 'text', 0, true, false),
  ('stock', 'Stock', 'text', 1, true, false),
  ('ingreso', 'Ingreso', 'date', 2, true, false),
  ('salida', 'Salida', 'date', 3, true, false),
  ('tamanio', 'Tamanio', 'select', 4, true, false),
  ('dias', 'Dias', 'number', 5, false, true),
  ('estado', 'Estado', 'text', 6, false, true),
  ('cliente', 'Cliente', 'text', 7, true, false),
  ('ms', 'MS', 'text', 8, true, false),
  ('terminal', 'Terminal de retiro', 'select', 9, true, false),
  ('habilitacion', 'Habilitacion', 'text', 10, true, false),
  ('obs', 'Obs', 'text', 11, true, false),
  ('valor', 'Valor mercaderia', 'number', 12, true, false),
  ('factura', 'Factura', 'text', 13, true, false),
  ('fecha_factura', 'Fecha factura', 'date', 14, false, true)
ON CONFLICT (key) DO NOTHING;

INSERT INTO tarifas_config (key, value, label) VALUES
  ('almacenaje_teu_dia', 12.50, 'Almacenaje TEU/dia'),
  ('almacenaje_teu_mes', 350.00, 'Almacenaje TEU/mes'),
  ('in_contenedor', 45.00, 'In (por contenedor)'),
  ('out_contenedor', 45.00, 'Out (por contenedor)'),
  ('transporte_contenedor', 120.00, 'Transporte (por contenedor)'),
  ('pbip_contenedor', 25.00, 'PBIP (por contenedor)')
ON CONFLICT (key) DO NOTHING;

INSERT INTO clientes (id, nombre, tarifas) VALUES
  ('cliente_a', 'Cliente A', '{"almacenaje_teu_dia": 12.50, "almacenaje_teu_mes": 350.00, "in_contenedor": 45.00, "out_contenedor": 45.00, "transporte_contenedor": 120.00, "pbip_contenedor": 25.00}'),
  ('cliente_b', 'Cliente B', '{"almacenaje_teu_dia": 11.00, "almacenaje_teu_mes": 320.00, "in_contenedor": 40.00, "out_contenedor": 40.00, "transporte_contenedor": 110.00, "pbip_contenedor": 22.00}'),
  ('cliente_c', 'Cliente C', '{"almacenaje_teu_dia": 15.00, "almacenaje_teu_mes": 400.00, "in_contenedor": 50.00, "out_contenedor": 50.00, "transporte_contenedor": 130.00, "pbip_contenedor": 30.00}')
ON CONFLICT (id) DO NOTHING;

-- Datos de demo
INSERT INTO cells (cell_key, value, updated_by) VALUES
  ('contenedor_1', 'MSCU1234567', 'system'),
  ('stock_1', '001', 'system'),
  ('ingreso_1', '2026-01-15', 'system'),
  ('tamanio_1', '40', 'system'),
  ('cliente_1', 'Cliente A', 'system'),
  ('ms_1', 'MS-001', 'system'),
  ('terminal_1', 'TCP', 'system'),
  ('habilitacion_1', 'OK', 'system'),
  ('obs_1', 'Electonica', 'system'),
  ('valor_1', '50000', 'system'),

  ('contenedor_2', 'HLCU7654321', 'system'),
  ('stock_2', '002', 'system'),
  ('ingreso_2', '2026-02-20', 'system'),
  ('salida_2', '2026-05-10', 'system'),
  ('tamanio_2', '20', 'system'),
  ('cliente_2', 'Cliente A', 'system'),
  ('ms_2', 'MS-002', 'system'),
  ('terminal_2', 'Montecon', 'system'),
  ('habilitacion_2', 'OK', 'system'),
  ('obs_2', 'Textiles', 'system'),
  ('valor_2', '25000', 'system'),
  ('factura_2', 'F-001234', 'system'),
  ('fecha_factura_2', '2026-05-10', 'system'),

  ('contenedor_3', 'TGHU9876543', 'system'),
  ('stock_3', '003', 'system'),
  ('ingreso_3', '2026-03-10', 'system'),
  ('tamanio_3', '40', 'system'),
  ('cliente_3', 'Cliente B', 'system'),
  ('ms_3', 'MS-003', 'system'),
  ('terminal_3', 'TCP', 'system'),
  ('habilitacion_3', 'Pendiente', 'system'),
  ('obs_3', 'Automotriz', 'system'),
  ('valor_3', '75000', 'system'),

  ('contenedor_4', 'COSU4567890', 'system'),
  ('stock_4', '004', 'system'),
  ('ingreso_4', '2026-03-15', 'system'),
  ('salida_4', '2026-05-20', 'system'),
  ('tamanio_4', '20', 'system'),
  ('cliente_4', 'Cliente B', 'system'),
  ('ms_4', 'MS-004', 'system'),
  ('terminal_4', 'Montecon', 'system'),
  ('habilitacion_4', 'OK', 'system'),
  ('obs_4', 'Quimicos', 'system'),
  ('valor_4', '35000', 'system'),
  ('factura_4', 'F-001235', 'system'),
  ('fecha_factura_4', '2026-05-20', 'system'),

  ('contenedor_5', 'MAEU1112223', 'system'),
  ('stock_5', '005', 'system'),
  ('ingreso_5', '2026-04-01', 'system'),
  ('tamanio_5', '40', 'system'),
  ('cliente_5', 'Cliente C', 'system'),
  ('ms_5', 'MS-005', 'system'),
  ('terminal_5', 'TCP', 'system'),
  ('habilitacion_5', 'OK', 'system'),
  ('obs_5', 'Alimentos', 'system'),
  ('valor_5', '42000', 'system'),

  ('contenedor_6', 'ONEU4445556', 'system'),
  ('stock_6', '006', 'system'),
  ('ingreso_6', '2026-04-10', 'system'),
  ('tamanio_6', '40', 'system'),
  ('cliente_6', 'Cliente C', 'system'),
  ('ms_6', 'MS-006', 'system'),
  ('terminal_6', 'Montecon', 'system'),
  ('habilitacion_6', 'OK', 'system'),
  ('obs_6', 'Madera', 'system'),
  ('valor_6', '18000', 'system')
ON CONFLICT (cell_key) DO NOTHING;

-- Realtime
COMMENT ON TABLE cells IS 'Datos de la hoja de stock de contenedores';
COMMENT ON TABLE audit_log IS 'Registro de auditoria de cambios';
COMMENT ON TABLE columns IS 'Columnas dinamicas de la hoja de stock';
COMMENT ON TABLE clientes IS 'Clientes con tarifas personalizadas';
COMMENT ON TABLE tarifas_config IS 'Tarifas globales por defecto';
