import { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight, Search, FileText } from 'lucide-react';
import type { AuditLog } from '../../types/backend';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Mock Data ──────────────────────────────────────────────────────
const MOCK_LOGS: AuditLog[] = [];

function getEventTypeStyle(eventType: string): string {
  if (eventType.includes('VOID') || eventType.includes('REFUND')) return 'bg-danger/10 text-danger border-danger/20';
  if (eventType.includes('DISCOUNT')) return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-surfaceHover text-label-secondary border-separator';
}

// ─── Component ──────────────────────────────────────────────────────

export default function AuditLogsPage() {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = MOCK_LOGS.filter((log) =>
    searchQuery === '' ||
    log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.entity_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-sans max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-label-primary tracking-tight">Audit Trail</h1>
            <p className="text-sm font-medium text-label-tertiary mt-0.5">Complete system event log with deep payload inspection</p>
          </div>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-label-tertiary" />
          <input
            type="text"
            placeholder="Filter by event, entity, employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-separator rounded-full px-4 py-2.5 pl-11 text-sm text-label-primary font-bold placeholder:text-label-tertiary focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="surface flex-1 overflow-hidden flex flex-col bg-white">
        <div className="overflow-x-auto flex-1 rounded-b-apple-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surfaceHover border-b border-separator z-10">
              <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                <th className="w-12 px-4 py-4 text-center"></th>
                <th className="text-left px-5 py-4">Timestamp</th>
                <th className="text-left px-5 py-4">Event</th>
                <th className="text-left px-5 py-4">Entity</th>
                <th className="text-left px-5 py-4">Employee</th>
                <th className="text-left px-5 py-4">Request ID</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isExpanded = expandedRow === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                      className={`border-b border-separator/50 cursor-pointer transition-colors group ${isExpanded ? 'bg-primary/5' : 'hover:bg-surfaceHover'}`}
                    >
                      <td className="px-4 py-4 text-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isExpanded ? 'bg-primary text-white' : 'bg-transparent text-label-tertiary group-hover:bg-separator'}`}>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-label-secondary tabular-nums whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border ${getEventTypeStyle(log.event_type)}`}>
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-label-primary">{log.entity_type}</span>
                        <span className="text-xs font-mono font-semibold text-label-tertiary ml-2 bg-background px-1.5 py-0.5 rounded">{log.entity_id}</span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-label-secondary font-mono">{log.employee_id}</td>
                      <td className="px-5 py-4 text-xs font-mono font-semibold text-label-tertiary truncate max-w-[140px]">
                        {log.request_id || '—'}
                      </td>
                    </tr>

                    {/* Expanded JSON payload */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-b border-separator overflow-hidden"
                        >
                          <td colSpan={6} className="px-6 py-6 bg-background shadow-inner">
                            <div className="grid grid-cols-2 gap-6">
                              {log.before_state && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-400" />
                                    Before State
                                  </h4>
                                  <pre className="text-xs font-mono font-medium text-label-primary bg-white border border-separator rounded-apple p-4 overflow-x-auto shadow-sm">
                                    {JSON.stringify(log.before_state, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after_state && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-success" />
                                    After State
                                  </h4>
                                  <pre className="text-xs font-mono font-medium text-label-primary bg-white border border-separator rounded-apple p-4 overflow-x-auto shadow-sm">
                                    {JSON.stringify(log.after_state, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.metadata && (
                                <div className="col-span-2 space-y-2">
                                  <h4 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    Metadata
                                  </h4>
                                  <pre className="text-xs font-mono font-medium text-label-primary bg-white border border-separator rounded-apple p-4 overflow-x-auto shadow-sm">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-24 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4 shadow-sm border border-primary/20">
                      <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-lg font-black text-label-primary mb-1 tracking-tight">No Events Logged</p>
                    <p className="text-sm font-bold text-label-tertiary">System activity will appear here automatically as transactions and actions occur.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
