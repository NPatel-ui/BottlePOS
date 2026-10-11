import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, ArrowLeft, Check, Key, X, Store, Trash2,
  Monitor, Coins, ShieldCheck, Lock, AlertCircle, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterStore, type POSRegister } from '../../store/useRegisterStore';

type ViewState = 'overview' | 'add_cashier' | 'manage_roles' | 'audit' | 'add_register' | 'manage_registers';

interface Cashier {
  id: string;
  name: string;
  pin: string;
  role: 'Cashier' | 'Supervisor';
}

const PERMISSIONS = [
  { id: 'pos_access', label: 'Access POS Terminal', cashier: true, supervisor: true, manager: true },
  { id: 'void_item', label: 'Void Items', cashier: false, supervisor: true, manager: true },
  { id: 'manual_discount', label: 'Apply Manual Discounts', cashier: false, supervisor: true, manager: true },
  { id: 'refund', label: 'Process Refunds', cashier: false, supervisor: true, manager: true },
  { id: 'drawer_open', label: 'No-Sale Drawer Open', cashier: false, supervisor: false, manager: true },
];

export default function StaffManagementPage() {
  const [view, setView] = useState<ViewState>('overview');
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  
  // Register Store
  const { registers, addRegister, removeRegister, fetchRegistersFromSupabase } = useRegisterStore();

  useEffect(() => {
    fetchRegistersFromSupabase();
  }, [fetchRegistersFromSupabase]);

  // Add Register Form State (fresh & clean)
  const [newRegName, setNewRegName] = useState('');
  const [newRegId, setNewRegId] = useState('');
  const [newRegLocation, setNewRegLocation] = useState('Front Checkout Lanes');
  const [newRegDeviceType, setNewRegDeviceType] = useState('Touchscreen Counter Terminal');
  const [newOpeningFloat, setNewOpeningFloat] = useState('200.00');
  const [newRegPin, setNewRegPin] = useState('');
  const [newRegPinConfirm, setNewRegPinConfirm] = useState('');
  const [addRegError, setAddRegError] = useState('');
  const [createdRegister, setCreatedRegister] = useState<POSRegister | null>(null);

  // Add Cashier Form State
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<'Cashier' | 'Supervisor'>('Cashier');
  const [addError, setAddError] = useState('');

  const openAddRegister = () => {
    setNewRegName('');
    setNewRegId(`REG-${Math.floor(100 + Math.random() * 900)}`);
    setNewRegLocation('Front Checkout Lanes');
    setNewRegDeviceType('Touchscreen Counter Terminal');
    setNewOpeningFloat('200.00');
    setNewRegPin('');
    setNewRegPinConfirm('');
    setAddRegError('');
    setCreatedRegister(null);
    setView('add_register');
  };

  const handleAddCashier = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    
    if (!newName.trim()) {
      setAddError('Name is required.');
      return;
    }
    if (!/^\d{4}$/.test(newPin)) {
      setAddError('PIN must be exactly 4 digits.');
      return;
    }
    
    setCashiers([...cashiers, { id: `CASH-${Math.floor(Math.random() * 1000)}`, name: newName, pin: newPin, role: newRole }]);
    setNewName('');
    setNewPin('');
    setNewRole('Cashier');
    setView('manage_roles');
  };

  const removeCashier = (id: string) => {
    setCashiers(cashiers.filter(c => c.id !== id));
  };

  const handleAddRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAddRegError('');

    if (!newRegName.trim()) { 
      setAddRegError('Please specify a Register Name (e.g. Counter 1 - Front Lane).'); 
      return; 
    }
    if (!newRegId.trim()) {
      setAddRegError('Terminal Code/ID is required.');
      return;
    }
    if (!/^\d{4}$/.test(newRegPin)) { 
      setAddRegError('Security PIN must be exactly 4 digits (0-9).'); 
      return; 
    }
    if (newRegPin !== newRegPinConfirm) {
      setAddRegError('Security PINs do not match. Please verify your PIN entry.');
      return;
    }

    const floatAmount = parseFloat(newOpeningFloat) || 200;
    const reg = addRegister({
      name: newRegName.trim(),
      id: newRegId.trim().toUpperCase(),
      pin: newRegPin,
      location: newRegLocation,
      deviceType: newRegDeviceType,
      openingFloat: floatAmount,
    });

    setCreatedRegister(reg);
  };

  return (
    <div className="flex flex-col h-full font-sans relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            {view !== 'overview' && (
              <button 
                onClick={() => setView('overview')}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-label-secondary hover:text-primary transition-colors border border-separator"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-3xl font-black text-label-primary tracking-tight">
              {view === 'overview' && 'Staff & POS Management'}
              {view === 'add_cashier' && 'Add New Cashier'}
              {view === 'manage_roles' && 'Cashier Roster'}
              {view === 'audit' && 'Permissions & Security'}
              {view === 'add_register' && 'Configure New POS Register'}
              {view === 'manage_registers' && 'Active POS Terminals'}
            </h1>
          </div>
          <p className="text-sm font-bold text-label-tertiary mt-1 ml-11">
            {view === 'overview' && 'Manage cashiers, permissions, registers, and terminal access'}
            {view === 'add_cashier' && 'Create a profile and PIN for terminal login'}
            {view === 'manage_roles' && `Currently ${cashiers.length} active staff members`}
            {view === 'audit' && 'Role-based access control matrix'}
            {view === 'add_register' && 'Create a physical POS terminal station with custom lock PIN'}
            {view === 'manage_registers' && `Currently ${registers.length} configured POS registers`}
          </p>
        </div>
        {view === 'overview' && (
          <div className="flex gap-3">
            <button onClick={openAddRegister} className="btn-tinted flex items-center gap-2">
              <Shield className="w-4 h-4" /> New Register
            </button>
            <button onClick={() => setView('add_cashier')} className="btn-filled flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Add Cashier
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="surface bg-white p-8 rounded-[2rem] flex flex-col items-center text-center border-t-4 border-t-primary">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-label-primary mb-1">Cashier Roster</h3>
              <p className="text-sm font-bold text-label-tertiary mb-6">Currently {cashiers.length} active cashiers with POS terminal access.</p>
              <button onClick={() => setView('manage_roles')} className="btn-gray w-full font-bold">Manage Roles</button>
            </div>

            <div className="surface bg-white p-8 rounded-[2rem] flex flex-col items-center text-center border-t-4 border-t-orange-500">
              <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-4 text-orange-500">
                <Shield className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-label-primary mb-1">Permissions & Security</h3>
              <p className="text-sm font-bold text-label-tertiary mb-6">Control who can void transactions and offer manual discounts.</p>
              <button onClick={() => setView('audit')} className="btn-gray w-full font-bold">Audit Access Levels</button>
            </div>

            <div className="surface bg-white p-8 rounded-[2rem] flex flex-col items-center text-center border-t-4 border-t-green-500 md:col-span-2">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
                <Store className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-label-primary mb-1">POS Registers</h3>
              <p className="text-sm font-bold text-label-tertiary mb-6">Manage physical POS terminals and their 4-digit unlock PINs.</p>
              <div className="flex gap-3 max-w-md mx-auto w-full">
                <button onClick={() => setView('manage_registers')} className="btn-gray flex-1 font-bold">View Registers ({registers.length})</button>
                <button onClick={openAddRegister} className="btn-filled bg-green-500 hover:bg-green-600 flex-1 font-bold">New Register</button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'add_cashier' && (
          <motion.div
            key="add_cashier"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-md mx-auto w-full"
          >
            <form onSubmit={handleAddCashier} autoComplete="off" className="surface bg-white p-8 rounded-[2rem] space-y-6">
              {addError && (
                <div className="p-3 bg-danger/10 text-danger text-sm font-bold rounded-lg border border-danger/20">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Full Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
                  className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">4-Digit Login PIN</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                    className="w-full bg-background border border-separator rounded-2xl pl-11 pr-5 py-3 text-lg font-black tracking-widest text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="••••"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Role & Access</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewRole('Cashier')}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      newRole === 'Cashier' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-separator text-label-secondary hover:border-separator/80'
                    }`}
                  >
                    Cashier
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('Supervisor')}
                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                      newRole === 'Supervisor' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-separator text-label-secondary hover:border-separator/80'
                    }`}
                  >
                    Supervisor
                  </button>
                </div>
              </div>
              <button type="submit" className="w-full btn-filled h-14 text-base">
                Create Cashier Profile
              </button>
            </form>
          </motion.div>
        )}

        {view === 'manage_roles' && (
          <motion.div
            key="manage_roles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="surface bg-white overflow-hidden rounded-[2rem]"
          >
            {cashiers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-label-primary mb-2">No Cashiers Found</h3>
                <p className="text-sm font-bold text-label-tertiary mb-6">You haven't added any staff members yet.</p>
                <button onClick={() => setView('add_cashier')} className="btn-filled">Add Your First Cashier</button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-surfaceHover border-b border-separator">
                  <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                    <th className="text-left px-6 py-4">Name</th>
                    <th className="text-left px-6 py-4">Role</th>
                    <th className="text-left px-6 py-4">System ID</th>
                    <th className="text-right px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cashiers.map(cashier => (
                    <tr key={cashier.id} className="border-b border-separator last:border-b-0 hover:bg-surfaceHover transition-colors">
                      <td className="px-6 py-4 font-bold text-label-primary">{cashier.name}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border ${
                          cashier.role === 'Supervisor' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {cashier.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-label-tertiary">{cashier.id}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => removeCashier(cashier.id)} className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1 ml-auto">
                          <X className="w-3 h-3" /> Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {view === 'audit' && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="surface bg-white overflow-hidden rounded-[2rem]"
          >
            <table className="w-full text-sm">
              <thead className="bg-surfaceHover border-b border-separator">
                <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                  <th className="text-left px-6 py-4">Permission</th>
                  <th className="text-center px-6 py-4">Cashier</th>
                  <th className="text-center px-6 py-4">Supervisor</th>
                  <th className="text-center px-6 py-4">Manager</th>
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map(perm => (
                  <tr key={perm.id} className="border-b border-separator/50 hover:bg-surfaceHover transition-colors">
                    <td className="px-6 py-4 font-bold text-label-primary">{perm.label}</td>
                    <td className="px-6 py-4 text-center">
                      {perm.cashier ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-label-quaternary mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {perm.supervisor ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-label-quaternary mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-center bg-primary/5">
                      {perm.manager ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-label-quaternary mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {view === 'add_register' && (
          <motion.div
            key="add_register"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto w-full"
          >
            {createdRegister ? (
              <div className="surface bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-floating border border-separator text-center">
                <div className="w-16 h-16 rounded-2xl bg-success/10 text-success flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Check className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-label-primary tracking-tight mb-1">
                  POS Register Configured!
                </h2>
                <p className="text-sm font-semibold text-label-secondary mb-6">
                  <span className="text-primary font-black">{createdRegister.name}</span> ({createdRegister.id}) has been created with a 4-digit PIN lock.
                </p>

                <div className="bg-background border border-separator rounded-2xl p-5 text-left space-y-3 mb-6">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-label-tertiary uppercase tracking-wider">Store Section:</span>
                    <span className="font-extrabold text-label-primary">{createdRegister.location}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-label-tertiary uppercase tracking-wider">Device Hardware:</span>
                    <span className="font-extrabold text-label-primary">{createdRegister.deviceType}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-label-tertiary uppercase tracking-wider">Opening Float:</span>
                    <span className="font-extrabold text-green-600">${Number(createdRegister.openingFloat || 200).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-label-tertiary uppercase tracking-wider">Security PIN:</span>
                    <span className="font-extrabold text-primary font-mono tracking-widest bg-primary/10 px-2 py-0.5 rounded">
                      {createdRegister.pin}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/pos"
                    className="btn-filled flex-1 h-13 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl shadow-floating"
                  >
                    <Lock className="w-4 h-4" /> Go to /pos Lock Screen
                  </Link>
                  <button
                    onClick={() => setView('manage_registers')}
                    className="btn-gray flex-1 h-13 text-sm font-bold rounded-2xl"
                  >
                    View All Registers
                  </button>
                </div>
              </div>
            ) : (
              <form 
                onSubmit={handleAddRegister} 
                autoComplete="off" 
                className="surface bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-floating border border-separator space-y-6"
              >
                {/* Anti-autofill decoy inputs to block browser credential injection */}
                <input type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
                <input type="password" style={{ display: 'none' }} tabIndex={-1} autoComplete="new-password" />

                {addRegError && (
                  <div className="p-4 bg-danger/10 text-danger text-sm font-bold rounded-2xl border border-danger/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{addRegError}</span>
                  </div>
                )}

                {/* Section 1: Register Identity */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-separator">
                    <Store className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-black text-label-primary">1. Terminal Station Identity</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Register Name *
                      </label>
                      <input
                        type="text"
                        name="pos_register_label_fresh"
                        autoComplete="new-password"
                        data-lpignore="true"
                        data-form-type="other"
                        value={newRegName}
                        onChange={(e) => setNewRegName(e.target.value.replace(/[^a-zA-Z0-9\s-_#]/g, ''))}
                        className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                        placeholder="e.g. Counter 1 - Front Lane"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Terminal ID *
                      </label>
                      <input
                        type="text"
                        name="pos_register_code_fresh"
                        autoComplete="new-password"
                        data-lpignore="true"
                        value={newRegId}
                        onChange={(e) => setNewRegId(e.target.value.toUpperCase().replace(/[^A-Z0-9-_]/g, ''))}
                        className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-black font-mono text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                        placeholder="REG-101"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                      Store Location / Section
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        'Front Checkout Lanes',
                        'Main Floor Counter',
                        'Liquor & Spirits Bar',
                        'Express Checkout',
                        'Drive-Thru Window',
                        'Back Office / Pickup'
                      ].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setNewRegLocation(loc)}
                          className={`p-3 rounded-xl text-xs font-bold border transition-all text-left ${
                            newRegLocation === loc
                              ? 'bg-primary/10 border-primary text-primary shadow-sm'
                              : 'bg-background border-separator text-label-secondary hover:border-separator/80'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 2: Hardware & Cash Drawer */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-separator">
                    <Monitor className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-black text-label-primary">2. Hardware & Starting Float</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Device Type
                      </label>
                      <select
                        value={newRegDeviceType}
                        onChange={(e) => setNewRegDeviceType(e.target.value)}
                        className="w-full bg-background border border-separator rounded-2xl px-4 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                      >
                        <option value="Touchscreen Counter Terminal">Touchscreen Counter Terminal</option>
                        <option value="Tablet / Handheld POS">Tablet / Handheld POS</option>
                        <option value="Dual-Screen Customer Register">Dual-Screen Customer Register</option>
                        <option value="Mobile Floor Station">Mobile Floor Station</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Opening Drawer Cash ($)
                      </label>
                      <div className="relative">
                        <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary" />
                        <input
                          type="number"
                          step="10"
                          min="0"
                          name="pos_cash_drawer_amount"
                          autoComplete="off"
                          value={newOpeningFloat}
                          onChange={(e) => setNewOpeningFloat(e.target.value)}
                          className="w-full bg-background border border-separator rounded-2xl pl-11 pr-5 py-3 text-sm font-black text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                          placeholder="200.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: 4-Digit Security Unlock PIN */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-separator">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-black text-label-primary">3. Terminal 4-Digit Unlock PIN</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Set 4-Digit Unlock PIN *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="pos_station_pin_unique"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-form-type="other"
                          maxLength={4}
                          value={newRegPin}
                          onChange={(e) => setNewRegPin(e.target.value.replace(/\D/g, ''))}
                          style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                          className="w-full bg-background border border-separator rounded-2xl pl-11 pr-5 py-3.5 text-2xl font-black tracking-[0.6em] text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm text-center"
                          placeholder="••••"
                        />
                      </div>
                      <p className="text-xs font-semibold text-label-tertiary pl-2 mt-1.5">
                        Cashiers use this PIN on /pos to unlock this terminal.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">
                        Confirm 4-Digit Unlock PIN *
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          name="pos_station_pin_confirm_unique"
                          autoComplete="new-password"
                          data-lpignore="true"
                          data-form-type="other"
                          maxLength={4}
                          value={newRegPinConfirm}
                          onChange={(e) => setNewRegPinConfirm(e.target.value.replace(/\D/g, ''))}
                          style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                          className="w-full bg-background border border-separator rounded-2xl pl-11 pr-5 py-3.5 text-2xl font-black tracking-[0.6em] text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm text-center"
                          placeholder="••••"
                        />
                      </div>
                      <p className="text-xs font-semibold text-label-tertiary pl-2 mt-1.5">
                        Confirm PIN to prevent cashier lockouts.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-separator/50 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    className="w-full btn-filled h-14 text-base font-extrabold bg-green-500 hover:bg-green-600 focus:ring-green-500/30 flex items-center justify-center gap-2 rounded-2xl shadow-floating"
                  >
                    <Store className="w-5 h-5" />
                    Generate POS Register
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {view === 'manage_registers' && (
          <motion.div
            key="manage_registers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="surface bg-white overflow-hidden rounded-[2.5rem] shadow-card border border-separator"
          >
            {registers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-label-primary mb-2">No Registers Configured</h3>
                <p className="text-sm font-bold text-label-tertiary mb-6">Create a register with a 4-digit PIN so staff can unlock /pos.</p>
                <button onClick={openAddRegister} className="btn-filled bg-green-500 hover:bg-green-600 focus:ring-green-500/30">
                  Create Your First Register
                </button>
              </div>
            ) : (
              <div>
                <div className="p-6 bg-surfaceHover/50 border-b border-separator flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-label-primary text-base">Active Terminals ({registers.length})</h3>
                    <p className="text-xs font-semibold text-label-tertiary">All registers persist and are available on the /pos terminal lock</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={openAddRegister} className="btn-filled text-xs h-9 px-4 bg-green-500 hover:bg-green-600">
                      + Add Register
                    </button>
                    <Link to="/pos" className="btn-gray text-xs h-9 px-4 flex items-center gap-1.5 font-bold">
                      <Lock className="w-3.5 h-3.5" /> Test /pos Lock
                    </Link>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surfaceHover border-b border-separator">
                      <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                        <th className="text-left px-6 py-4">Register Station</th>
                        <th className="text-left px-6 py-4">Terminal ID</th>
                        <th className="text-left px-6 py-4">Location / Hardware</th>
                        <th className="text-left px-6 py-4">Cash Float</th>
                        <th className="text-left px-6 py-4">Security PIN</th>
                        <th className="text-right px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registers.map(reg => (
                        <tr key={reg.id} className="border-b border-separator last:border-b-0 hover:bg-surfaceHover/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-label-primary">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
                                <Store className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-extrabold text-sm">{reg.name}</p>
                                <p className="text-[11px] text-label-tertiary font-medium">Ready for checkout</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-xs text-primary">{reg.id}</td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-label-primary">{reg.location || 'Main Floor'}</p>
                            <p className="text-[10px] font-semibold text-label-tertiary">{reg.deviceType || 'Counter Terminal'}</p>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-green-600">
                            ${Number(reg.openingFloat || 200).toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold bg-surfaceHover px-2 py-1 rounded-lg border border-separator text-label-secondary">
                              <Key className="w-3 h-3 text-label-tertiary" /> ••••
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link 
                                to="/pos" 
                                className="p-2 rounded-lg bg-surfaceHover hover:bg-primary/10 hover:text-primary transition-colors text-label-secondary text-xs font-bold flex items-center gap-1 border border-separator"
                                title="Open Terminal"
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> Open
                              </Link>
                              <button 
                                onClick={() => removeRegister(reg.id)} 
                                className="text-danger hover:bg-danger/10 p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
                                title="Remove Register"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
