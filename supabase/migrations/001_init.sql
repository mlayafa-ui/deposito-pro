-- ============================================
-- Depósito Contenedores Pro - Esquema Completo
-- ============================================

-- Tabla de usuarios de la aplicación
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  color TEXT DEFAULT '#3498db',
  initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de columnas dinámicas (títulos de la hoja de stock)
CREATE TABLE IF NOT EXISTS columns (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'select')),
  position INTEGER NOT NULL,
  editable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de celdas (datos de la hoja de stock)
CREATE TABLE IF NOT EXISTS cells (
  cell_key TEXT PRIMARY KEY,           -- formato: "columnKey_rowIndex" ej: "contenedor_1"
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

-- Tabla de auditoría (registro de todos los cambios)
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
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cells_key ON cells(cell_key);
CREATE INDEX IF NOT EXISTS idx_cells_updated ON cells(updated_at);
CREATE INDEX IF NOT EXISTS idx_audit_cell ON audit_log(cell);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_name);
CREATE INDEX IF NOT EXISTS idx_columns_position ON columns(position);

-- ============================================
-- Políticas RLS (Row Level Security)
-- ============================================
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifas_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para demo (en producción restringir por auth.uid())
CREATE POLICY "Allow all app_users" ON app_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all columns" ON columns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all cells" ON cells FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all tarifas" ON tarifas_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Datos iniciales
-- ============================================

-- Usuarios de demo
INSERT INTO app_users (id, name, email, role, color, initials) VALUES
  ('admin@deposito.com', 'Admin Principal', 'admin@deposito.com', 'admin', '#e74c3c', 'AP'),
  ('ana@deposito.com', 'Ana García', 'ana@deposito.com', 'editor', '#3498db', 'AG'),
  ('luis@deposito.com', 'Luis Martínez', 'luis@deposito.com', 'editor', '#2ecc71', 'LM'),
  ('carlos@deposito.com', 'Carlos Ruiz', 'carlos@deposito.com', 'viewer', '#9b59b6', 'CR'),
  ('sofia@deposito.com', 'Sofía López', 'sofia@deposito.com', 'viewer', '#f39c12', 'SL')
ON CONFLICT (id) DO NOTHING;

-- Columnas por defecto para stock de contenedores
INSERT INTO columns (key, label, type, position, editable) VALUES
  ('contenedor', 'Contenedor', 'text', 0, true),
  ('cliente', 'Cliente', 'text', 1, true),
  ('tamanio', 'Tamaño', 'select', 2, true),
  ('teu', 'TEU', 'number', 3, true),
  ('fecha_ingreso', 'Fecha Ingreso', 'date', 4, true),
  ('fecha_salida', 'Fecha Salida', 'date', 5, true),
  ('ubicacion', 'Ubicación', 'text', 6, true),
  ('estado', 'Estado', 'select', 7, true),
  ('mercancia', 'Mercancía', 'text', 8, true),
  ('observaciones', 'Observaciones', 'text', 9, true)
ON CONFLICT (key) DO NOTHING;

-- Tarifas globales por defecto
INSERT INTO tarifas_config (key, value, label) VALUES
  ('almacenaje_teu_dia', 12.50, 'Almacenaje TEU/día'),
  ('almacenaje_teu_mes', 350.00, 'Almacenaje TEU/mes'),
  ('in_contenedor', 45.00, 'In (por contenedor)'),
  ('out_contenedor', 45.00, 'Out (por contenedor)'),
  ('transporte_contenedor', 120.00, 'Transporte (por contenedor)'),
  ('pbip_contenedor', 25.00, 'PBIP (por contenedor)')
ON CONFLICT (key) DO NOTHING;

-- Clientes de demo con tarifas personalizadas
INSERT INTO clientes (id, nombre, tarifas) VALUES
  ('cliente_a', 'Cliente A', '{"almacenaje_teu_dia": 12.50, "almacenaje_teu_mes": 350.00, "in_contenedor": 45.00, "out_contenedor": 45.00, "transporte_contenedor": 120.00, "pbip_contenedor": 25.00}'),
  ('cliente_b', 'Cliente B', '{"almacenaje_teu_dia": 11.00, "almacenaje_teu_mes": 320.00, "in_contenedor": 40.00, "out_contenedor": 40.00, "transporte_contenedor": 110.00, "pbip_contenedor": 22.00}'),
  ('cliente_c', 'Cliente C', '{"almacenaje_teu_dia": 15.00, "almacenaje_teu_mes": 400.00, "in_contenedor": 50.00, "out_contenedor": 50.00, "transporte_contenedor": 130.00, "pbip_contenedor": 30.00}')
ON CONFLICT (id) DO NOTHING;

-- Datos de demo - contenedores
INSERT INTO cells (cell_key, value, updated_by) VALUES
  ('contenedor_1', 'MSCU1234567', 'system'),
  ('cliente_1', 'Cliente A', 'system'),
  ('tamanio_1', '40', 'system'),
  ('teu_1', '2', 'system'),
  ('fecha_ingreso_1', '2026-01-15', 'system'),
  ('ubicacion_1', 'A-12', 'system'),
  ('estado_1', 'Activo', 'system'),
  ('mercancia_1', 'Electrónica', 'system'),

  ('contenedor_2', 'HLCU7654321', 'system'),
  ('cliente_2', 'Cliente A', 'system'),
  ('tamanio_2', '20', 'system'),
  ('teu_2', '1', 'system'),
  ('fecha_ingreso_2', '2026-02-20', 'system'),
  ('ubicacion_2', 'B-05', 'system'),
  ('estado_2', 'Activo', 'system'),
  ('mercancia_2', 'Textiles', 'system'),

  ('contenedor_3', 'TGHU9876543', 'system'),
  ('cliente_3', 'Cliente B', 'system'),
  ('tamanio_3', '40HC', 'system'),
  ('teu_3', '2', 'system'),
  ('fecha_ingreso_3', '2026-03-10', 'system'),
  ('ubicacion_3', 'C-08', 'system'),
  ('estado_3', 'Activo', 'system'),
  ('mercancia_3', 'Automotriz', 'system'),

  ('contenedor_4', 'COSU4567890', 'system'),
  ('cliente_4', 'Cliente B', 'system'),
  ('tamanio_4', '20', 'system'),
  ('teu_4', '1', 'system'),
  ('fecha_ingreso_4', '2026-03-15', 'system'),
  ('fecha_salida_4', '2026-05-20', 'system'),
  ('ubicacion_4', 'A-03', 'system'),
  ('estado_4', 'Salido', 'system'),
  ('mercancia_4', 'Químicos', 'system'),

  ('contenedor_5', 'MAEU1112223', 'system'),
  ('cliente_5', 'Cliente C', 'system'),
  ('tamanio_5', '45', 'system'),
  ('teu_5', '2.25', 'system'),
  ('fecha_ingreso_5', '2026-04-01', 'system'),
  ('ubicacion_5', 'D-01', 'system'),
  ('estado_5', 'Activo', 'system'),
  ('mercancia_5', 'Alimentos', 'system'),

  ('contenedor_6', 'ONEU4445556', 'system'),
  ('cliente_6', 'Cliente C', 'system'),
  ('tamanio_6', '40', 'system'),
  ('teu_6', '2', 'system'),
  ('fecha_ingreso_6', '2026-04-10', 'system'),
  ('ubicacion_6', 'B-12', 'system'),
  ('estado_6', 'Activo', 'system'),
  ('mercancia_6', 'Madera', 'system'),

  ('contenedor_7', 'CMAU7778889', 'system'),
  ('cliente_7', 'Cliente A', 'system'),
  ('tamanio_7', '20', 'system'),
  ('teu_7', '1', 'system'),
  ('fecha_ingreso_7', '2026-05-05', 'system'),
  ('ubicacion_7', 'C-15', 'system'),
  ('estado_7', 'Activo', 'system'),
  ('mercancia_7', 'Maquinaria', 'system'),

  ('contenedor_8', 'EGLU0001112', 'system'),
  ('cliente_8', 'Cliente B', 'system'),
  ('tamanio_8', '40HC', 'system'),
  ('teu_8', '2', 'system'),
  ('fecha_ingreso_8', '2026-05-20', 'system'),
  ('ubicacion_8', 'A-07', 'system'),
  ('estado_8', 'Activo', 'system'),
  ('mercancia_8', 'Plásticos', 'system')
ON CONFLICT (cell_key) DO NOTHING;

-- ============================================
-- Realtime: habilitar replicación
-- ============================================
-- Ejecutar en Supabase Dashboard > Database > Replication:
-- 1. Asegurar que supabase_realtime está activo
-- 2. Agregar tablas a la publicación 'supabase_realtime':
--    - cells
--    - audit_log
--    - columns
--    - clientes
--    - tarifas_config

COMMENT ON TABLE cells IS 'Datos de la hoja de stock de contenedores';
COMMENT ON TABLE audit_log IS 'Registro de auditoría de cambios';
COMMENT ON TABLE columns IS 'Columnas dinámicas de la hoja de stock';
COMMENT ON TABLE clientes IS 'Clientes con tarifas personalizadas';
COMMENT ON TABLE tarifas_config IS 'Tarifas globales por defecto';
