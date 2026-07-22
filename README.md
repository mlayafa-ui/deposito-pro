# 🚢 Depósito Contenedores Pro

Sistema completo de gestión de stock de contenedores para depósito, con cálculo de tarifas (TEU + contenedor), estadísticas en tiempo real, y registro de auditoría por usuario con roles.

## ✨ Características

| Pestaña | Feature |
|---------|---------|
| 📋 **Stock** | Hoja de cálculo tipo Excel con columnas dinámicas (solo admin edita títulos) |
| 💰 **Costos** | Cálculo automático por contenedor: almacenaje por TEU + gastos fijos por contenedor |
| 📊 **Estadísticas** | 5 gráficos configurables: TEUs por mes, por cliente, por tamaño, evolución, distribución |
| ⚙️ **Configuración** | Gestión de clientes y tarifas personalizadas por cliente |
| 👥 **Usuarios** | Crear/eliminar usuarios (solo admin) |
| 📝 **Logs** | Auditoría completa de cambios (admin + editor) |

## 🏗️ Arquitectura de Tarifas

```
┌─────────────────────────────────────────────────────────┐
│  ALMACENAJE (por TEU)    │  GASTOS FIJOS (por contenedor) │
├─────────────────────────────────────────────────────────┤
│  • TEU/día: $12.50       │  • In: $45.00                  │
│  • TEU/mes: $350.00      │  • Out: $45.00                 │
│                          │  • Transporte: $120.00         │
│  Fórmula:                │  • PBIP: $25.00                │
│  TEU × días × tarifa     │                                │
│                          │  Fórmula:                      │
│                          │  suma de todos los fijos       │
└─────────────────────────────────────────────────────────┘
                         ↓
              TOTAL = Almacenaje + Gastos Fijos
```

Cada cliente tiene **tarifas personalizadas** que se pueden configurar en la pestaña Configuración.

## 🚀 Deploy en 5 pasos

### 1. Supabase (base de datos)
1. Ve a [supabase.com](https://supabase.com) → crea cuenta gratuita
2. Crea un **nuevo proyecto**
3. Ve a **SQL Editor** → pega TODO el contenido de `supabase/migrations/001_init.sql` → **Run**

### 2. Habilitar Realtime
1. Ve a **Database** → **Replication**
2. Asegúrate de que `supabase_realtime` esté activo
3. Agrega las tablas: `cells`, `audit_log`, `columns`, `clientes`, `tarifas_config`

### 3. Credenciales
- **Project Settings → API** → copia `URL` y `anon public` API Key

### 4. Variables de entorno
Crea un archivo `.env` en la raíz:
```
VITE_SUPABASE_URL=https://TU-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=TU-ANON-KEY
```

### 5. Netlify
```bash
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/deposito-pro.git
git push -u origin main
```
1. [netlify.com](https://netlify.com) → **Import from GitHub**
2. Build: `npm run build` | Publish: `dist`
3. Añade las variables de entorno → **Deploy**

---

## 👥 Usuarios de demo

| Email | Contraseña | Rol | Puede ver |
|-------|-----------|-----|-----------|
| `admin@deposito.com` | `password123` | **ADMIN** | Todo |
| `ana@deposito.com` | `password123` | **EDITOR** | Stock, Costos, Estadísticas, Logs |
| `luis@deposito.com` | `password123` | **EDITOR** | Stock, Costos, Estadísticas, Logs |
| `carlos@deposito.com` | `password123` | **VIEWER** | Solo ver Stock, Costos, Estadísticas |
| `sofia@deposito.com` | `password123` | **VIEWER** | Solo ver Stock, Costos, Estadísticas |

---

## 📋 Pestaña Stock

- Admin: puede modificar títulos de columnas (doble clic), agregar (+), eliminar (×)
- Editor: puede editar celdas de datos
- Viewer: solo lectura
- Al seleccionar tamaño (20', 40', 40HC, 45'), el TEU se calcula automático

## 💰 Pestaña Costos

1. Selecciona un **cliente** del dropdown
2. Se muestran todos sus contenedores del stock
3. La **fecha de salida** es editable en esta pestaña (para simular/planificar)
4. Se calcula automáticamente:
   - Días de almacenaje = fecha salida - fecha ingreso + 1
   - Costo almacenaje = TEU × días × tarifa TEU/día del cliente
   - Gastos fijos = In + Out + Transporte + PBIP (por contenedor)
   - Total = Almacenaje + Gastos fijos

## 📊 Pestaña Estadísticas

5 gráficos seleccionables:
- **TEUs por Mes** - barras
- **TEUs por Cliente** - barras horizontales
- **Contenedores por Tamaño** - barras agrupadas
- **Evolución del Stock** - áreas (activos + ingresados)
- **Distribución** - tortas (por cliente + por tamaño)

KPIs en tiempo real: total TEUs, contenedores, activos, salidos, días promedio.

## ⚙️ Pestaña Configuración

- **Clientes y Tarifas**: ver/editar tarifas personalizadas por cliente (clic en el valor)
- **Tarifas Globales**: valores default que se usan cuando un cliente no tiene tarifa específica

---

## 💰 Costos (todo gratis)

| Servicio | Plan gratuito |
|----------|--------------|
| Netlify | 100 GB/mes |
| Supabase | 500 MB BD, 2 GB/mes |
| GitHub | Repos públicos ilimitados |

---

## 📁 Estructura

```
stock-audit-app/
├── src/
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── StockSheet.jsx
│   │   ├── AuditLog.jsx
│   │   └── UserManager.jsx
│   ├── pages/
│   │   ├── CostosPage.jsx
│   │   ├── EstadisticasPage.jsx
│   │   └── ConfigPage.jsx
│   ├── hooks/
│   │   └── useSupabase.js
│   ├── utils/
│   │   ├── constants.js
│   │   └── auth.js
│   ├── supabaseClient.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── migrations/
│       └── 001_init.sql
├── index.html
├── package.json
├── vite.config.js
├── netlify.toml
└── README.md
```

---

Hecho con ❤️ usando React + Supabase + Recharts + Netlify
