import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Laptop, 
  Smartphone, 
  Maximize2, 
  ScanBarcode, 
  Receipt, 
  ShieldCheck
} from 'lucide-react';

interface DesktopOnlyGuardProps {
  children: React.ReactNode;
}

const DESKTOP_MIN_WIDTH = 1024; // Standard tablet/laptop breakpoint

export default function DesktopOnlyGuard({ children }: DesktopOnlyGuardProps) {
  const [isMobileOrSmall, setIsMobileOrSmall] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setWindowWidth(width);

      // Check mobile user agent
      const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      );

      // iPads/Tablets or Mobile phones under desktop resolution
      if (width < DESKTOP_MIN_WIDTH || (isMobileUA && width < 1200)) {
        setIsMobileOrSmall(true);
      } else {
        setIsMobileOrSmall(false);
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isMobileOrSmall && (
          <motion.div
            key="desktop-only-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[999999] bg-[#070b14] text-white flex items-center justify-center p-4 sm:p-6 select-none overflow-y-auto min-h-screen min-h-[100dvh]"
            style={{ minHeight: '100dvh' }}
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-lg w-full bg-slate-900/90 border border-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] p-7 sm:p-9 shadow-2xl text-center overflow-hidden my-auto"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500" />

              {/* Hardware Device Visual */}
              <div className="relative flex items-center justify-center mb-6">
                {/* Floating Desktop / Laptop Graphic */}
                <motion.div 
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 relative"
                >
                  <Laptop className="w-10 h-10" />
                  
                  {/* Subtle Monitor Badge */}
                  <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-blue-400 shadow-md">
                    <Monitor className="w-4 h-4" />
                  </div>
                </motion.div>

                {/* Disallowed Mobile Badge */}
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 10, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="absolute -top-1 right-12 w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 backdrop-blur-sm"
                  title="Mobile devices not supported"
                >
                  <div className="relative">
                    <Smartphone className="w-5 h-5 opacity-70" />
                    <span className="absolute inset-0 flex items-center justify-center text-red-500 font-black text-sm">✕</span>
                  </div>
                </motion.div>
              </div>

              {/* Brand Header */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 mb-4 text-xs font-bold text-slate-300">
                <span className="text-base">🍾</span>
                <span>BottlePOS Retail Workstation</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                Please Open on Desktop or Laptop
              </h1>

              {/* Explanatory Message */}
              <p className="text-sm font-medium text-slate-400 leading-relaxed mb-6">
                BottlePOS is an enterprise point-of-sale system built exclusively for desktop monitors, registers, and laptop displays to support high-density inventory grids, barcode scanning, and receipt printing.
              </p>

              {/* Resolution / Device Spec Card */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-6 text-left space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" /> Current Viewport:
                  </span>
                  <span className="font-mono font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-md border border-red-800/40">
                    {windowWidth}px (Below 1024px)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Required Display:
                  </span>
                  <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                    1024px+ (Desktop / Laptop)
                  </span>
                </div>
              </div>

              {/* Workstation Features Required */}
              <div className="grid grid-cols-2 gap-2 text-left mb-6">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <ScanBarcode className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Hardware Barcode Scanners</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Thermal Receipt Printers</span>
                </div>
              </div>

              {/* Instruction Prompt */}
              <div className="text-xs text-slate-400 font-medium bg-blue-950/40 border border-blue-800/30 rounded-xl p-3 flex items-center justify-center gap-2">
                <span>💻 If on a laptop, please <strong>maximize your browser window</strong>.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Render Application for Desktop */}
      <div className={isMobileOrSmall ? 'hidden' : 'block'}>
        {children}
      </div>
    </>
  );
}
