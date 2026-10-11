import { useState } from 'react';
import { AlertTriangle, X, ChevronRight, Clock, User, FileText } from 'lucide-react';
import { AlertSeverity, AlertStatus } from '../../types/backend';
import type { ShieldAlert } from '../../types/backend';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_ALERTS: ShieldAlert[] = [];

function getSeverityStyle(severity: string): string {
  switch (severity) {
    case AlertSeverity.CRITICAL:
    case AlertSeverity.HIGH:
      return 'bg-danger text-white border-danger shadow-sm';
    case AlertSeverity.MODERATE:
      return 'bg-orange-500 text-white border-orange-500 shadow-sm';
    default:
      return 'bg-surfaceHover text-label-secondary border-separator';
  }
}

function getStatusStyle(status: string): string {
  switch (status) {
    case AlertStatus.OPEN:
      return 'bg-danger/10 text-danger border border-danger/20';
    case AlertStatus.UNDER_REVIEW:
      return 'bg-warning/10 text-warning border border-warning/20';
    case AlertStatus.RESOLVED:
      return 'bg-success/10 text-success border border-success/20';
    default:
      return 'bg-surfaceHover text-label-secondary border border-separator';
  }
}

// ─── Component ──────────────────────────────────────────────────────

export default function ShieldAlertsPage() {
  const [selectedAlert, setSelectedAlert] = useState<ShieldAlert | null>(null);

  return (
    <div className="flex h-full gap-6 font-sans">
      {/* Alert triage table */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all ${selectedAlert ? 'lg:w-2/3' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-label-primary tracking-tight">Shield Alerts</h1>
              <p className="text-sm font-medium text-label-tertiary mt-0.5">AI-powered loss prevention triage</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-separator">
            <span className="text-sm font-bold text-label-primary">{MOCK_ALERTS.length} alerts pending</span>
          </div>
        </div>

        <div className="surface flex-1 overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-1 bg-white rounded-b-apple-lg">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surfaceHover border-b border-separator z-10">
                <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                  <th className="text-left px-5 py-4">Severity</th>
                  <th className="text-left px-5 py-4">Alert Title</th>
                  <th className="text-left px-5 py-4">Category</th>
                  <th className="text-left px-5 py-4">Employee</th>
                  <th className="text-right px-5 py-4">Exposure</th>
                  <th className="text-left px-5 py-4">Status</th>
                  <th className="text-right px-5 py-4">Risk Score</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ALERTS.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-24 text-center">
                      <h3 className="text-lg font-black text-label-primary mb-1 tracking-tight">System Secure</h3>
                      <p className="text-sm font-bold text-label-tertiary max-w-sm mx-auto">
                        There are currently no AI-detected fraud or inventory anomalies.
                      </p>
                    </td>
                  </tr>
                ) : (
                  MOCK_ALERTS.map((alert) => (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`border-b border-separator/50 cursor-pointer transition-colors group ${
                        selectedAlert?.id === alert.id ? 'bg-primary/5 border-primary/20' : 'hover:bg-surfaceHover'
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border ${getSeverityStyle(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-bold text-label-primary group-hover:text-primary transition-colors">{alert.title}</p>
                        <p className="text-xs text-label-tertiary font-medium mt-0.5 truncate max-w-[200px]">{alert.id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-semibold text-label-secondary bg-background px-2 py-1 rounded">{alert.alert_type}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-label-secondary">{alert.employee_id || '—'}</td>
                      <td className="px-5 py-4 text-sm font-extrabold text-label-primary text-right tabular-nums">
                        ${alert.potential_exposure.toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest ${getStatusStyle(alert.status)}`}>
                          {alert.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`text-base font-black tabular-nums ${
                          alert.risk_score >= 70 ? 'text-danger' : alert.risk_score >= 40 ? 'text-orange-500' : 'text-label-tertiary'
                        }`}>
                          {alert.risk_score}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <ChevronRight className={`w-5 h-5 transition-colors ${selectedAlert?.id === alert.id ? 'text-primary' : 'text-label-tertiary group-hover:text-primary'}`} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Inspection Drawer ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAlert && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[420px] shrink-0 surface flex flex-col overflow-hidden bg-white shadow-floating border border-separator"
          >
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-separator flex items-center justify-between bg-surfaceHover">
              <div>
                <h3 className="text-base font-extrabold text-label-primary">{selectedAlert.title}</h3>
                <p className="text-xs text-label-tertiary font-mono font-semibold mt-0.5">{selectedAlert.id}</p>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-label-secondary hover:text-danger hover:bg-danger/10 transition-colors shadow-sm border border-separator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Description */}
              <div className="bg-primary/5 rounded-apple p-4 border border-primary/10">
                <p className="text-sm font-semibold text-label-primary leading-relaxed">{selectedAlert.description}</p>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-apple p-4 border border-separator">
                  <p className="text-xs font-bold text-label-tertiary uppercase tracking-widest mb-1">Risk Score</p>
                  <p className={`text-3xl font-black tabular-nums tracking-tight ${
                    selectedAlert.risk_score >= 70 ? 'text-danger' : selectedAlert.risk_score >= 40 ? 'text-orange-500' : 'text-label-secondary'
                  }`}>{selectedAlert.risk_score}<span className="text-lg text-label-tertiary">/100</span></p>
                </div>
                <div className="bg-background rounded-apple p-4 border border-separator">
                  <p className="text-xs font-bold text-label-tertiary uppercase tracking-widest mb-1">Exposure</p>
                  <p className="text-3xl font-black text-label-primary tabular-nums tracking-tight">${selectedAlert.potential_exposure.toFixed(2)}</p>
                </div>
              </div>

              {/* Reasons */}
              <div>
                <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest mb-3">Detection Reasons</h4>
                <ul className="space-y-2">
                  {selectedAlert.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm font-medium text-label-primary bg-background p-3 rounded-apple border border-separator/50">
                      <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related transactions */}
              {selectedAlert.related_transactions.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest mb-3">Related Transactions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedAlert.related_transactions.map((txn) => (
                      <div key={txn} className="flex items-center gap-2 bg-surfaceHover border border-separator rounded-lg px-3 py-2 cursor-pointer hover:border-primary/30 transition-colors">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono font-bold text-label-primary">{txn}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest mb-3">Audit Timeline</h4>
                <div className="space-y-3 pl-1 border-l-2 border-separator ml-2">
                  <div className="relative pl-5">
                    <div className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-separator" />
                    <div className="flex items-center gap-2 text-xs font-semibold text-label-secondary mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Alert Created</span>
                    </div>
                    <p className="text-xs text-label-tertiary">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                  </div>
                  {selectedAlert.employee_id && (
                    <div className="relative pl-5">
                      <div className="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="flex items-center gap-2 text-xs font-semibold text-label-secondary mb-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Involved Employee</span>
                      </div>
                      <p className="text-xs text-label-primary font-bold">{selectedAlert.employee_id}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer actions */}
            <div className="px-5 py-4 border-t border-separator flex gap-3 bg-white shrink-0">
              <button className="flex-1 btn-filled text-sm">Review</button>
              <button className="flex-1 btn-destructive text-sm">Escalate</button>
              <button className="btn-gray text-sm px-4">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
