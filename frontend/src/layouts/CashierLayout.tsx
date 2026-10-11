import { Outlet, Link } from 'react-router-dom';
import { Lock, User, Wifi, Clock, Store, Key, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterStore } from '../store/useRegisterStore';

export default function CashierLayout() {
  const { registers, unlockedRegisterId, unlockRegister, lockRegister, fetchRegistersFromSupabase } = useRegisterStore();
  const [time, setTime] = useState(new Date());

  const [selectedRegisterId, setSelectedRegisterId] = useState<string | null>(null);
  const [pinEntry, setPinEntry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRegistersFromSupabase();
  }, [fetchRegistersFromSupabase]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-select first register if available and none selected
  useEffect(() => {
    if (registers.length > 0 && !selectedRegisterId) {
      setSelectedRegisterId(registers[0].id);
    }
  }, [registers, selectedRegisterId]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegisterId) return;
    const success = unlockRegister(selectedRegisterId, pinEntry);
    if (!success) {
      setError('Invalid PIN. Please try again.');
      setPinEntry('');
    } else {
      setError('');
      setPinEntry('');
    }
  };

  const unlockedRegister = registers.find(r => r.id === unlockedRegisterId);

  if (!unlockedRegister) {
    if (registers.length === 0) {
      return (
        <div className="h-screen h-[100dvh] w-full bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
          {/* Ambient background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.35, type: 'spring' }}
            className="w-full max-w-md bg-white/85 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-floating border border-white/60 relative z-10 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-button mb-5">
              <Store className="w-8 h-8 text-white" />
            </div>

            <h1 className="text-3xl font-black text-label-primary tracking-tight mb-2">
              Terminal Lock
            </h1>
            <p className="text-label-secondary font-medium text-sm mb-6 leading-relaxed">
              Select a POS register and enter the 4-digit PIN to access the checkout system.
            </p>
            
            <div className="w-full bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex items-start gap-3.5 text-left mb-6">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-extrabold text-orange-600 text-sm mb-1">No Registers Configured</h3>
                <p className="text-xs font-semibold text-orange-700/80 leading-relaxed">
                  An administrator needs to create a POS register in the Staff Management portal before you can log in.
                </p>
              </div>
            </div>

            <Link
              to="/admin"
              className="w-full btn-filled h-12 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl group shadow-sm hover:shadow-floating transition-all"
            >
              <span>Go to Manager Portal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="h-screen h-[100dvh] w-full bg-background flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Ambient background decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, type: 'spring' }}
          className="max-w-4xl w-full bg-white/85 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-floating border border-white/60 relative z-10"
        >
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-button">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-label-primary tracking-tight mb-2">Terminal Lock</h1>
                <p className="text-label-secondary font-medium text-sm sm:text-base">Select a POS register and enter the 4-digit PIN to access the checkout system.</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-label-tertiary uppercase tracking-widest">Available Registers</h3>
                <div className="grid gap-3 max-h-[260px] overflow-y-auto pr-1">
                  {registers.map(reg => (
                    <button
                      key={reg.id}
                      onClick={() => { setSelectedRegisterId(reg.id); setError(''); setPinEntry(''); }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                        selectedRegisterId === reg.id
                          ? 'bg-primary text-white border-primary shadow-floating scale-[1.02]'
                          : 'bg-white/80 border-separator hover:border-primary/30 hover:shadow-sm text-label-primary'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedRegisterId === reg.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{reg.name}</p>
                          <p className={`text-xs font-medium ${selectedRegisterId === reg.id ? 'text-white/80' : 'text-label-tertiary'}`}>
                            {reg.id} {reg.location ? `• ${reg.location}` : ''}
                          </p>
                        </div>
                      </div>
                      {selectedRegisterId === reg.id && <ShieldCheck className="w-5 h-5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-separator/40 flex items-center justify-between text-xs text-label-tertiary">
                <Link to="/admin" className="font-bold text-primary hover:underline flex items-center gap-1">
                  Manager Portal &rarr;
                </Link>
                <span>BottlePOS Security</span>
              </div>
            </div>

            <div className="flex justify-center">
              <AnimatePresence mode="wait">
                {selectedRegisterId ? (
                  <motion.div
                    key={selectedRegisterId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="surface bg-white/90 p-8 rounded-[2rem] w-full max-w-sm shadow-elevated border border-separator"
                  >
                    <div className="text-center mb-6">
                      <div className="w-14 h-14 bg-surfaceHover rounded-2xl flex items-center justify-center mx-auto mb-3 text-primary border border-separator">
                        <Lock className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-black text-label-primary">Enter PIN</h3>
                      <p className="text-xs font-bold text-label-tertiary mt-1 truncate">
                        Unlocking {registers.find(r => r.id === selectedRegisterId)?.name}
                      </p>
                    </div>
                    
                    <form onSubmit={handlePinSubmit} autoComplete="off" className="space-y-5">
                      <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                      <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

                      {error && (
                        <div className="text-danger text-xs font-bold text-center bg-danger/10 py-2 px-3 rounded-xl border border-danger/20">
                          {error}
                        </div>
                      )}
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-label-tertiary" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="pos_terminal_unlock_pin"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-form-type="other"
                          style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                          autoFocus
                          maxLength={4}
                          value={pinEntry}
                          onChange={(e) => setPinEntry(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full bg-background border border-separator rounded-2xl pl-12 pr-4 py-3.5 text-center text-3xl tracking-[0.8em] font-black text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 transition-all shadow-inner"
                        />
                      </div>
                      <button type="submit" disabled={pinEntry.length !== 4} className="w-full btn-filled h-13 text-base disabled:opacity-50 rounded-2xl">
                        Unlock Register
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-separator rounded-[2rem] w-full max-w-sm min-h-[300px] bg-surface/50 text-label-tertiary">
                    <Key className="w-8 h-8 mb-2 text-label-tertiary" />
                    <p className="text-sm font-bold text-label-secondary">Select a Register</p>
                    <p className="text-xs mt-1">Choose a register from the left to enter PIN</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
      {/* Sleek Light Theme Header */}
      <header className="h-16 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm border-b border-separator z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center shadow-button">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold text-label-primary tracking-tight leading-tight block">BottlePOS</span>
            <span className="text-xs text-label-tertiary font-bold uppercase tracking-wider block">{unlockedRegister.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-sm text-label-secondary tabular-nums font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-label-tertiary" />
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-1.5 text-sm text-green font-bold bg-green/10 px-3 py-1.5 rounded-full">
            <Wifi className="w-4 h-4" />
            <span>Online</span>
          </div>
          <div className="w-px h-6 bg-separator mx-1" />
          <div className="flex items-center gap-2 bg-surfaceHover border border-separator px-3 py-1.5 rounded-full text-sm text-label-primary font-bold hover:border-primary/30 transition-colors cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>Cashier</span>
          </div>
          <button onClick={lockRegister} className="p-2.5 rounded-full bg-surfaceHover text-label-secondary hover:text-danger hover:bg-danger/10 transition-all duration-200 shadow-sm border border-separator" title="Lock Register">
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
