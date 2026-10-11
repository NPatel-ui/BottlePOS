import { TrendingUp, ShieldAlert, AlertTriangle, DollarSign, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const METRICS = [
  {
    label: 'Net Sales Today',
    value: '$0.00',
    change: '0.0%',
    positive: true,
    icon: DollarSign,
  },
  {
    label: 'Active Shield Alerts',
    value: '0',
    change: '0 new',
    positive: true,
    icon: ShieldAlert,
  },
  {
    label: 'Inventory Variances',
    value: '0',
    change: '0 resolved',
    positive: true,
    icon: Package,
  },
  {
    label: 'Transactions',
    value: '0',
    change: '0.0%',
    positive: true,
    icon: TrendingUp,
  },
];

const RECENT_ALERTS: { id: string; title: string; severity: string; time: string }[] = [];

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-label-primary tracking-tight">Store Overview</h1>
        <p className="text-sm font-medium text-label-tertiary mt-1">Real-time performance metrics and security alerts.</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              key={m.label}
              className="surface p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-label-secondary uppercase tracking-widest">{m.label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${m.positive ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-label-primary tabular-nums tracking-tight">{m.value}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold ${m.positive ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                    {m.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {m.change}
                  </div>
                  <span className="text-xs font-medium text-label-tertiary">vs last week</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Alerts Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="surface overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-separator flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-label-primary tracking-tight">Recent Shield Alerts</h2>
          <a href="/admin/shield" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
            View all alerts &rarr;
          </a>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-label-tertiary uppercase tracking-widest border-b border-separator bg-surfaceHover">
                <th className="text-left px-6 py-4">Alert ID</th>
                <th className="text-left px-6 py-4">Description</th>
                <th className="text-left px-6 py-4">Severity</th>
                <th className="text-right px-6 py-4">Time Detected</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_ALERTS.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-label-tertiary font-bold">
                    No shield alerts to display. Everything is secure.
                  </td>
                </tr>
              ) : (
                RECENT_ALERTS.map((alert) => (
                  <tr key={alert.id} className="border-b border-separator last:border-b-0 hover:bg-surfaceHover transition-colors cursor-pointer group">
                    <td className="px-6 py-4 font-mono font-semibold text-label-secondary group-hover:text-primary transition-colors">{alert.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.severity === 'HIGH' ? 'text-danger' : 'text-orange-500'}`} />
                        <span className="font-bold text-label-primary">{alert.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        alert.severity === 'HIGH' ? 'bg-danger text-white' :
                        alert.severity === 'MODERATE' ? 'bg-orange-500 text-white' :
                        'bg-surfaceHover text-label-secondary border border-separator'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-label-secondary text-right">{alert.time}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
