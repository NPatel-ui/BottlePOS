import { useState } from 'react';
import { TrendingUp, Calendar, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRange = '7D' | '1M' | 'YTD' | 'LAST_YEAR' | 'ALL';

const RANGE_LABELS: Record<TimeRange, string> = {
  '7D': 'Last 7 Days',
  '1M': 'This Month',
  'YTD': 'This Year (YTD)',
  'LAST_YEAR': 'Last Year',
  'ALL': 'All Time (Since Account Creation)'
};

// Mock data generator that returns $0 for a fresh account, but populates the X axis correctly
const getChartData = (range: TimeRange) => {
  if (range === '7D') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ name: d, revenue: 0 }));
  if (range === '1M') return ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({ name: w, revenue: 0 }));
  if (range === 'YTD' || range === 'LAST_YEAR') {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => ({ name: m, revenue: 0 }));
  }
  // All Time - dynamic years from start
  const currentYear = new Date().getFullYear();
  const startYear = 2024; // Assuming system launched/account created here
  const years = [];
  for (let y = startYear; y <= currentYear; y++) {
    years.push(y.toString());
  }
  return years.map(y => ({ name: y, revenue: 0 }));
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const data = getChartData(timeRange);

  return (
    <div className="flex flex-col h-full font-sans pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-label-primary tracking-tight">Sales Analytics</h1>
          <p className="text-sm font-bold text-label-tertiary mt-1">Detailed graphical insights across any timeframe</p>
        </div>
        
        {/* Custom Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn-gray flex items-center gap-2 bg-white pr-4 font-bold min-w-[220px] justify-between shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{RANGE_LABELS[timeRange]}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-[220px] bg-white rounded-apple-lg shadow-floating border border-separator overflow-hidden z-50"
              >
                {(Object.entries(RANGE_LABELS) as [TimeRange, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setTimeRange(key);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors hover:bg-surfaceHover ${
                      timeRange === key ? 'text-primary bg-primary/5' : 'text-label-secondary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="surface bg-white p-6 rounded-[2rem] border border-separator/50 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest">Revenue ({RANGE_LABELS[timeRange]})</h3>
            <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-label-primary tabular-nums tracking-tight">$0.00</p>
        </div>
        <div className="surface bg-white p-6 rounded-[2rem] border border-separator/50 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest">Transactions</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-label-primary tabular-nums tracking-tight">0</p>
        </div>
        <div className="surface bg-white p-6 rounded-[2rem] border border-separator/50 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[11px] font-extrabold text-label-tertiary uppercase tracking-widest">Avg. Ticket Size</h3>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
          </div>
          <p className="text-3xl font-black text-label-primary tabular-nums tracking-tight">$0.00</p>
        </div>
      </div>

      {/* Graphical Chart */}
      <div className="surface flex-1 bg-white p-6 rounded-[2rem] border border-separator/50 shadow-sm flex flex-col min-h-[400px]">
        <h3 className="text-lg font-black text-label-primary mb-6">Revenue Trend</h3>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px', fontWeight: 'bold' }}
                itemStyle={{ color: '#0ea5e9', fontWeight: 900 }}
                formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, 'Revenue']}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0ea5e9" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#0ea5e9' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          
          {/* Empty state overlay for fresh accounts */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-separator shadow-sm flex flex-col items-center">
              <TrendingUp className="w-8 h-8 text-label-quaternary mb-2" />
              <p className="text-sm font-extrabold text-label-secondary">No transaction data yet</p>
              <p className="text-xs font-bold text-label-tertiary">Chart will populate as sales occur</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
