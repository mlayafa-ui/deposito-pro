import React from 'react'
import { PERMISSIONS } from '../utils/auth.js'

export default function AuditLog({ auditLog, currentUser }) {
  if (!PERMISSIONS.canViewLogs(currentUser?.role)) {
    return (
      <div className="audit-panel">
        <div className="audit-header"><span>📝 Registro de cambios</span></div>
        <div className="audit-list">
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#aaa' }}>
            🔒 Solo administradores y editores pueden ver el registro.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="audit-panel">
      <div className="audit-header">
        <span>📝 Registro de cambios</span>
        <span className="audit-count">{auditLog.length}</span>
      </div>
      <div className="audit-list">
        {auditLog.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#aaa', fontSize: '13px' }}>
            Aún no hay cambios registrados.<br/>Edita una celda para empezar.
          </div>
        )}
        {auditLog.map((entry, i) => (
          <div key={i} className="audit-item">
            <div className="audit-item-header">
              <div className="audit-user">
                <div className="avatar" style={{ background: entry.user_color || '#666', width: '20px', height: '20px', fontSize: '10px' }}>
                  {entry.user_initials || '??'}
                </div>
                {entry.user_name || 'Anónimo'}
                <span className="audit-role">{entry.user_role}</span>
              </div>
              <span className="audit-time">
                {new Date(entry.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="audit-detail">
              Celda <span className="cell-ref-inline">{entry.cell}</span>:{' '}
              <span className="old-val">{entry.old_value || '(vacío)'}</span>
              <span style={{ color: '#aaa' }}> → </span>
              <span className="new-val">{entry.new_value || '(vacío)'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}