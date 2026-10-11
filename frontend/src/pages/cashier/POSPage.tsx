import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Trash2, CreditCard, Banknote, Search, X, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import type { Product } from '../../types/backend';

// ─── Mock Data ──────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Whiskey', 'Vodka', 'Tequila', 'Wine', 'Beer', 'Rum', 'Mixers'] as const;

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1', sku: 'WH-001', name: 'Macallan 18yr', category: 'Whiskey', brand: 'Macallan',
    bottle_price: 349.99, cost: 250, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 5, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '2', sku: 'VD-001', name: 'Grey Goose', category: 'Vodka', brand: 'Grey Goose',
    bottle_price: 34.99, cost: 20, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 10, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '3', sku: 'TQ-001', name: 'Casamigos Blanco', category: 'Tequila', brand: 'Casamigos',
    bottle_price: 49.99, cost: 30, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 15, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '4', sku: 'WN-001', name: 'Veuve Clicquot Brut', category: 'Wine', brand: 'Veuve Clicquot',
    bottle_price: 59.99, cost: 40, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 8, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '5', sku: 'WH-002', name: 'Buffalo Trace', category: 'Whiskey', brand: 'Buffalo Trace',
    bottle_price: 29.99, cost: 15, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 20, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '6', sku: 'RM-001', name: 'Kraken Black Spiced', category: 'Rum', brand: 'Kraken',
    bottle_price: 24.99, cost: 12, size: '1.75L', active_status: true, age_restricted: true,
    reorder_threshold: 12, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '7', sku: 'BR-001', name: 'Modelo Especial 12pk', category: 'Beer', brand: 'Modelo',
    bottle_price: 16.99, cost: 10, size: '12pk', active_status: true, age_restricted: true,
    reorder_threshold: 25, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '8', sku: 'VD-002', name: "Tito's Handmade", category: 'Vodka', brand: "Tito's",
    bottle_price: 21.99, cost: 11, size: '1.75L', active_status: true, age_restricted: true,
    reorder_threshold: 30, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '9', sku: 'WH-003', name: 'Jack Daniels Old No.7', category: 'Whiskey', brand: 'Jack Daniels',
    bottle_price: 27.99, cost: 14, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 20, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
  {
    id: '10', sku: 'TQ-002', name: 'Don Julio 1942', category: 'Tequila', brand: 'Don Julio',
    bottle_price: 169.99, cost: 110, size: '750ml', active_status: true, age_restricted: true,
    reorder_threshold: 3, organization_id: 'org1', store_id: 's1',
    created_at: '', updated_at: '',
  },
];

// ─── Component ──────────────────────────────────────────────────────

export default function POSPage() {
  const { items, addItem, updateQuantity, clearCart, getSubtotal, getTaxAmount, getTotal } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Payment State
  const [paymentType, setPaymentType] = useState<'cash' | 'card' | null>(null);
  const [paymentStep, setPaymentStep] = useState<'input' | 'processing' | 'success'>('input');
  
  // Inputs
  const [cashTendered, setCashTendered] = useState('');
  const [cardDetails, setCardDetails] = useState({ number: '', exp: '', cvv: '' });

  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef('');

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Block global shortcuts if modal is open
    if (paymentType !== null) return;
    
    if (document.activeElement === barcodeInputRef.current) return;
    if (e.key === 'F1' && items.length > 0) { e.preventDefault(); handleStartCheckout('cash'); return; }
    if (e.key === 'F2' && items.length > 0) { e.preventDefault(); handleStartCheckout('card'); return; }
    if (e.key === 'Enter' && barcodeBufferRef.current.length > 2) {
      const scanned = barcodeBufferRef.current;
      barcodeBufferRef.current = '';
      const found = MOCK_PRODUCTS.find(p => p.sku === scanned || p.barcode === scanned);
      if (found) addItem(found);
      return;
    }
    if (e.key.length === 1) {
      barcodeBufferRef.current += e.key;
      setTimeout(() => { barcodeBufferRef.current = ''; }, 500);
    }
  }, [addItem, items.length, paymentType]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleStartCheckout = (type: 'cash' | 'card') => {
    if (items.length === 0) return;
    setPaymentType(type);
    setPaymentStep('input');
    setCashTendered('');
    setCardDetails({ number: '', exp: '', cvv: '' });
  };

  const processPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      setPaymentStep('success');
      setTimeout(() => {
        clearCart();
        setPaymentType(null);
      }, 2500);
    }, 1500);
  };

  const changeDue = Math.max(0, parseFloat(cashTendered || '0') - getTotal());
  const canSubmitCash = parseFloat(cashTendered || '0') >= getTotal();
  const canSubmitCard = cardDetails.number.length >= 15 && cardDetails.exp.length === 5 && cardDetails.cvv.length >= 3;

  return (
    <div className="flex h-full p-4 gap-4 bg-background relative">
      
      {/* ── Payment Overlay Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {paymentType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => paymentStep === 'input' && setPaymentType(null)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-floating border border-separator overflow-hidden"
            >
              {/* Modal Header */}
              {paymentStep === 'input' && (
                <div className="px-6 py-5 border-b border-separator flex items-center justify-between bg-surfaceHover">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {paymentType === 'cash' ? <Banknote className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-label-primary">
                        {paymentType === 'cash' ? 'Cash Tender' : 'Card Payment'}
                      </h2>
                      <p className="text-sm font-semibold text-label-tertiary">Total Due: ${getTotal().toFixed(2)}</p>
                    </div>
                  </div>
                  <button onClick={() => setPaymentType(null)} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-label-secondary hover:text-danger hover:bg-danger/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Modal Body */}
              <div className="p-6">
                {paymentStep === 'input' && paymentType === 'cash' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-label-secondary uppercase tracking-widest mb-2">Amount Tendered</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-label-tertiary">$</span>
                        <input
                          autoFocus
                          type="number"
                          placeholder="0.00"
                          value={cashTendered}
                          onChange={(e) => setCashTendered(e.target.value)}
                          className="w-full text-4xl font-black text-label-primary bg-surfaceHover rounded-2xl py-4 pl-10 pr-4 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all border border-transparent focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[10, 20, 50, 100].map(amt => (
                        <button key={amt} onClick={() => setCashTendered(amt.toString())} className="btn-gray text-lg font-bold py-3">
                          ${amt}
                        </button>
                      ))}
                      <button onClick={() => setCashTendered(getTotal().toFixed(2))} className="col-span-2 btn-tinted text-lg font-bold py-3">
                        Exact Change
                      </button>
                    </div>

                    <div className="bg-background rounded-apple-lg p-4 border border-separator flex justify-between items-center">
                      <span className="text-sm font-bold text-label-tertiary uppercase tracking-widest">Change Due</span>
                      <span className={`text-2xl font-black ${canSubmitCash ? 'text-success' : 'text-label-tertiary'}`}>
                        ${changeDue.toFixed(2)}
                      </span>
                    </div>

                    <button 
                      disabled={!canSubmitCash} 
                      onClick={processPayment}
                      className="w-full btn-filled h-14 text-lg mt-4 disabled:opacity-50"
                    >
                      Complete Transaction
                    </button>
                  </div>
                )}

                {paymentStep === 'input' && paymentType === 'card' && (
                  <div className="space-y-4">
                    <div className="flex gap-2 mb-4">
                      <button onClick={processPayment} className="flex-1 bg-surfaceHover hover:bg-primary hover:text-white text-label-primary font-bold py-4 rounded-2xl transition-all border border-separator shadow-sm flex flex-col items-center gap-2">
                        <CreditCard className="w-6 h-6" />
                        <span>Send to Terminal</span>
                      </button>
                    </div>
                    
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-separator"></div>
                      <span className="shrink-0 mx-4 text-xs font-bold text-label-tertiary uppercase tracking-widest">OR MANUAL ENTRY</span>
                      <div className="flex-grow border-t border-separator"></div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-label-secondary uppercase tracking-widest mb-1">Card Number</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        className="w-full text-base font-bold text-label-primary bg-surfaceHover rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-label-secondary uppercase tracking-widest mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.exp}
                          onChange={(e) => setCardDetails({ ...cardDetails, exp: e.target.value })}
                          className="w-full text-base font-bold text-label-primary bg-surfaceHover rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/50"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-label-secondary uppercase tracking-widest mb-1">CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          className="w-full text-base font-bold text-label-primary bg-surfaceHover rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <button 
                      disabled={!canSubmitCard} 
                      onClick={processPayment}
                      className="w-full btn-filled h-14 text-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-5 h-5" />
                      Charge ${getTotal().toFixed(2)}
                    </button>
                  </div>
                )}

                {paymentStep === 'processing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <div className="w-20 h-20 rounded-full border-4 border-separator border-t-primary animate-spin" />
                    <div className="text-center">
                      <h3 className="text-xl font-extrabold text-label-primary">Processing Payment</h3>
                      <p className="text-sm font-semibold text-label-tertiary mt-1">Please wait while we authorize the transaction...</p>
                    </div>
                  </div>
                )}

                {paymentStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                      className="w-24 h-24 bg-success/10 text-success rounded-full flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <div className="text-center">
                      <h3 className="text-2xl font-black text-label-primary">Payment Approved!</h3>
                      <p className="text-sm font-bold text-label-tertiary mt-2 tracking-widest uppercase">Transaction Complete</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Left: Categories (15%) ───────────────────────────── */}
      <div className="w-[15%] flex flex-col gap-2 shrink-0">
        <h2 className="text-sm font-bold text-label-secondary uppercase tracking-widest px-2 mb-2">Categories</h2>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`w-full text-left px-4 py-3 rounded-apple-lg font-semibold transition-all duration-300 ${
              activeCategory === cat
                ? 'bg-primary text-white shadow-button scale-105'
                : 'bg-surface text-label-secondary hover:bg-surfaceHover hover:scale-[1.02] border border-transparent hover:border-separator shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Center: Products Grid (55%) ───────────────────────────── */}
      <div className="w-[55%] flex flex-col bg-surface rounded-[2rem] shadow-elevated border border-separator overflow-hidden">
        {/* Search Header */}
        <div className="p-4 border-b border-separator bg-white shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-label-tertiary" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Search by name or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surfaceHover border-none rounded-full px-4 py-3 pl-12 text-sm text-label-primary font-bold placeholder:text-label-tertiary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 p-4 overflow-y-auto bg-background/50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <motion.button
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={product.id}
                onClick={() => addItem(product)}
                className="flex flex-col bg-white p-4 rounded-apple-lg shadow-card border border-separator text-left group hover:border-primary/30 hover:shadow-floating transition-all"
              >
                <div className="flex justify-between items-start w-full mb-3">
                  <span className="text-[10px] font-extrabold px-2 py-1 bg-surfaceHover text-label-tertiary rounded-full uppercase tracking-widest">
                    {product.size || 'N/A'}
                  </span>
                  {product.age_restricted && (
                    <span className="text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 21+
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-label-primary text-sm mb-1 leading-tight group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-xs font-medium text-label-tertiary mb-3">{product.sku}</p>
                <div className="mt-auto flex justify-between items-center w-full pt-3 border-t border-separator/50">
                  <span className="text-lg font-black text-label-primary">
                    ${product.bottle_price.toFixed(2)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surfaceHover group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </motion.button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-label-tertiary font-bold text-lg">
                No products found matching your search.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Floating Cart (30%) ─────────────────────────── */}
      <div className="w-[30%] flex flex-col bg-surface rounded-[2rem] shadow-floating border border-separator overflow-hidden relative">
        <div className="px-5 py-4 border-b border-separator bg-white shrink-0 flex justify-between items-center z-10">
          <h2 className="text-lg font-black text-label-primary tracking-tight">Current Order</h2>
          <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
            {items.reduce((sum, i) => sum + i.quantity, 0)} items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-background/30">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-label-tertiary"
              >
                <div className="w-16 h-16 rounded-full bg-surfaceHover flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-extrabold text-label-secondary">Your cart is empty</p>
                <p className="text-sm mt-1 font-medium">Tap a product to add it</p>
              </motion.div>
            ) : (
              items.map((item) => (
                <motion.div
                  key={item.cartItemId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-4 rounded-apple-lg mb-2 shadow-sm border border-separator flex flex-col gap-3 group"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-label-primary text-sm truncate">{item.name}</p>
                      <p className="text-xs text-label-tertiary font-bold">${item.bottle_price.toFixed(2)} each</p>
                    </div>
                    <p className="font-black text-primary text-sm shrink-0">
                      ${(item.bottle_price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <button onClick={() => updateQuantity(item.cartItemId, 0)} className="text-[11px] uppercase tracking-widest text-danger font-extrabold flex items-center hover:bg-danger/10 px-2 py-1.5 rounded transition-colors">
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                    </button>
                    <div className="flex items-center bg-surfaceHover rounded-full p-1 border border-separator">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartItemId, item.quantity - 1); }}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-background transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-label-primary">{item.quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartItemId, item.quantity + 1); }}
                        className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-background transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Checkout Area */}
        <div className="bg-white p-5 border-t border-separator shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10 shrink-0">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm font-bold text-label-tertiary">
              <span>Subtotal</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-label-tertiary">
              <span>Tax (8.25%)</span>
              <span>${getTaxAmount().toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-separator border-dashed mt-2 items-end">
              <span className="text-lg font-extrabold text-label-secondary">Total</span>
              <span className="text-4xl font-black text-label-primary tabular-nums tracking-tight">
                ${getTotal().toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleStartCheckout('cash')}
              disabled={items.length === 0}
              className="btn-tinted h-14 flex flex-col items-center justify-center gap-1 disabled:opacity-40"
            >
              <Banknote className="w-5 h-5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Cash <kbd className="opacity-50 ml-1 font-mono">F1</kbd></span>
            </button>
            <button
              onClick={() => handleStartCheckout('card')}
              disabled={items.length === 0}
              className="btn-filled h-14 flex flex-col items-center justify-center gap-1 disabled:opacity-40"
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest">Card <kbd className="opacity-50 ml-1 font-mono">F2</kbd></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
