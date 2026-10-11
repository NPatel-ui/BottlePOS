import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Unlock, 
  AlertCircle, 
  ArrowRight, 
  UserPlus, 
  Eye, 
  EyeOff, 
  Loader2, 
  Mail, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  KeyRound,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(600); // 10 minutes = 600s
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const confirmLink = useAuthStore((state) => state.confirmLink);
  const resendVerification = useAuthStore((state) => state.resendVerification);
  const navigate = useNavigate();

  // Listen for Supabase Magic Confirmation Link clicks
  useEffect(() => {
    if (!supabase) return;

    // Check if browser was redirected with active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        handleLinkConfirmed(session.user.email);
      }
    });

    // Listen for auth state change from link click
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.email) {
        handleLinkConfirmed(session.user.email);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLinkConfirmed = async (confirmedEmail: string) => {
    setShowVerificationModal(false);
    setIsUnlocking(true);
    setSuccessNotice(`Email verified (${confirmedEmail})! Granting portal access...`);
    try {
      await confirmLink(confirmedEmail);
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1200);
    } catch {
      setTimeout(() => {
        navigate('/admin/dashboard');
      }, 1200);
    }
  };

  // 10-Minute Countdown Timer
  useEffect(() => {
    let timer: any;
    if (showVerificationModal && remainingSeconds > 0 && !verificationSuccess) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showVerificationModal, remainingSeconds, verificationSuccess]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const hasLength = pass.length >= 8;
    return hasUpper && hasLower && hasSymbol && hasLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUnlocking) return;
    setError('');
    setSuccessNotice('');

    if (!isLogin) {
      // Account Creation Validation
      if (!/^[a-zA-Z]+$/.test(username)) {
        setError('Username must contain only alphabets.');
        return;
      }
      
      if (!/^\d{10}$/.test(mobile)) {
        setError('Mobile number must be exactly 10 digits.');
        return;
      }

      if (!email || !email.includes('@')) {
        setError('Email must contain an @ symbol.');
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 8 characters, with 1 uppercase, 1 lowercase, and 1 symbol.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await register(username, email, password);
        if (result.success) {
          // Open "Check email for verification" popup modal
          setVerificationEmail(result.email || email);
          setRemainingSeconds(600); // 10 minutes
          setVerificationCode('');
          setVerificationSuccess(false);
          setVerificationMessage('Verification code has been dispatched. It is valid for 10 minutes.');
          setShowVerificationModal(true);
        } else {
          setError(result.error || 'Failed to create account. Email may already be in use.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Login Validation
    if (!email) {
      setError('Email is required.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Invalid password format.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        setIsUnlocking(true);
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1000); // Unlock animation
      } else if (result.requiresVerification) {
        // Needs verification before login
        setVerificationEmail(email);
        setRemainingSeconds(600);
        setShowVerificationModal(true);
        setError('Email verification required. Please verify your email before logging in (expires in 10 minutes).');
      } else if (result.expired) {
        // 10-minute expiry passed!
        setError('Verification expired after 10 minutes. Your temporary account has been cleared. Please recreate your account.');
        setIsLogin(false); // bring to create account
        setPassword('');
        setConfirmPassword('');
      } else {
        setError(result.error || 'Invalid credentials. Please verify your details or create an account.');
        setPassword('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      const result = await verifyEmail(verificationEmail, verificationCode.trim());
      if (result.success) {
        setVerificationSuccess(true);
        setVerificationMessage('Email verified successfully! You can now log in with your credentials.');
        setSuccessNotice('Email verified! Please enter your password to sign in.');
      } else if (result.expired) {
        setError('Verification expired after 10 minutes. Please recreate your account.');
        setShowVerificationModal(false);
        setIsLogin(false);
      } else {
        setError(result.message || 'Incorrect verification code.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;
    setIsResending(true);
    setError('');
    try {
      const res = await resendVerification(verificationEmail);
      if (res.success) {
        setRemainingSeconds(600);
        setVerificationMessage('A fresh verification code has been dispatched. Valid for 10 minutes.');
      } else {
        setError(res.error || 'Could not resend verification code.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleProceedToLogin = () => {
    setShowVerificationModal(false);
    setIsLogin(true);
    setEmail(verificationEmail);
    setPassword('');
    setConfirmPassword('');
    if (verificationSuccess) {
      setSuccessNotice('Account verified! Please enter your password to unlock the portal.');
    } else {
      setSuccessNotice('Please complete verification within 10 minutes, then log in.');
    }
  };

  return (
    <div className="h-screen h-[100dvh] w-full bg-background flex items-center justify-center p-2 sm:p-4 relative overflow-hidden font-sans">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Error / Success Toast Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-full shadow-floating flex items-center gap-3 backdrop-blur-md font-bold text-sm border bg-danger/90 text-white border-danger"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="ml-2 hover:opacity-80 p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successNotice && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-full shadow-floating flex items-center gap-3 backdrop-blur-md font-bold text-sm border bg-emerald-600/90 text-white border-emerald-500"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-white" />
            <span>{successNotice}</span>
            <button 
              onClick={() => setSuccessNotice('')} 
              className="ml-2 hover:opacity-80 p-0.5 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="w-full max-w-md relative z-10"
      >
        <AnimatePresence mode="wait">
          {!isUnlocking ? (
            <motion.div
              key={isLogin ? 'login-form' : 'signup-form'}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] shadow-floating border border-white/50 w-full"
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                  {isLogin ? <Lock className="w-6 h-6 sm:w-8 sm:h-8" /> : <UserPlus className="w-6 h-6 sm:w-8 sm:h-8" />}
                </div>
              </div>

              <div className="text-center mb-4 sm:mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-label-primary tracking-tight">
                  {isLogin ? 'Admin Portal' : 'Create Account'}
                </h1>
                <p className="text-sm font-semibold text-label-tertiary mt-2">
                  {isLogin 
                    ? 'Secure access required. Sign in with verified credentials.' 
                    : 'Setup your new manager profile. Email verification required.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Username</label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                        placeholder="e.g. Alex"
                        className="w-full bg-white/50 border border-separator rounded-2xl px-5 py-2.5 sm:py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Mobile Number</label>
                      <input
                        type="tel"
                        autoComplete="off"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="10 digit phone number"
                        className="w-full bg-white/50 border border-separator rounded-2xl px-5 py-2.5 sm:py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Email Address</label>
                  <input
                    type="email"
                    autoComplete="new-password"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="manager@bottlepos.com"
                    className="w-full bg-white/50 border border-separator rounded-2xl px-5 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between pl-2 mb-1.5">
                    <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest">
                      {isLogin ? 'Password' : 'Create Password'}
                    </label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (email) {
                            setVerificationEmail(email);
                            setShowVerificationModal(true);
                          } else {
                            setError('Please type your email above first to enter verification code.');
                          }
                        }}
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" /> Verify Email
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/50 border border-separator rounded-2xl px-5 py-3 pr-12 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/50 border border-separator rounded-2xl px-5 py-3 pr-12 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-primary transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isUnlocking}
                  className="w-full btn-filled h-12 sm:h-14 text-base mt-2 flex items-center justify-center gap-2 group disabled:opacity-60 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isLogin ? 'Authenticating...' : 'Sending Verification...'}</span>
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Unlock Portal' : 'Create Account'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 sm:mt-6 text-center border-t border-separator/50 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setSuccessNotice('');
                    setUsername('');
                    setMobile('');
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sm font-bold text-label-secondary hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  {isLogin ? (
                    <>New to the system? <span className="text-primary font-black">Create an account</span></>
                  ) : (
                    <>Already have an account? <span className="text-primary font-black">Login</span></>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="unlocking"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-64"
            >
              <motion.div
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 180 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="w-24 h-24 rounded-full bg-success/10 text-success flex items-center justify-center mb-6 shadow-floating"
              >
                <Unlock className="w-10 h-10" />
              </motion.div>
              <h2 className="text-2xl font-black text-label-primary">Access Granted</h2>
              <p className="text-sm font-bold text-label-tertiary mt-2">Loading Admin Dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* POPUP MODAL: CHECK EMAIL FOR VERIFICATION (10 MINUTE EXPIRATION) */}
      <AnimatePresence>
        {showVerificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-primary to-orange-500" />

              {/* Close Button */}
              <button
                type="button"
                onClick={handleProceedToLogin}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Proceed to Login"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon & Title */}
              <div className="text-center mt-2">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 relative shadow-sm">
                  {verificationSuccess ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  ) : (
                    <Mail className="w-8 h-8 text-primary animate-pulse" />
                  )}
                  {/* Glowing 10m indicator */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                  </span>
                </div>

                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {verificationSuccess ? 'Email Verified!' : 'Check Email for Verification'}
                </h2>
                
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-2 px-2">
                  {verificationSuccess ? (
                    'Your email address has been successfully verified. You can now log into your account.'
                  ) : (
                    <>
                      We have sent a verification code to <span className="font-bold text-slate-800">{verificationEmail}</span>.
                      {verificationMessage && (
                        <span className="block mt-1 text-slate-400 font-medium text-xs">
                          {verificationMessage}
                        </span>
                      )}
                    </>
                  )}
                </p>
              </div>

              {!verificationSuccess ? (
                <div className="mt-6 space-y-4">
                  {/* 10-Minute Expiry Countdown Card */}
                  <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                    remainingSeconds > 60 
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold">Verification Valid For:</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono font-black text-sm">
                      <span className={remainingSeconds <= 60 ? 'text-red-600 animate-pulse' : 'text-amber-700'}>
                        {formatCountdown(remainingSeconds)}
                      </span>
                    </div>
                  </div>

                  {remainingSeconds === 0 ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                      <p className="text-xs font-bold text-red-700 mb-3">
                        ⏰ 10 minutes expired! Your pending registration has expired. Please recreate your account.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowVerificationModal(false);
                          setIsLogin(false);
                        }}
                        className="btn-filled w-full py-2.5 text-xs font-black uppercase tracking-wider"
                      >
                        Recreate Account Now
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Link Confirmation Waiting State */}
                      <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-center space-y-3">
                        <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Waiting for link confirmation...</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Open the email sent to <strong className="text-slate-800">{verificationEmail}</strong> and click the <strong>confirmation link</strong>. This page will automatically grant access!
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2 pt-2">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          disabled={isResending || remainingSeconds > 540}
                          className="w-full btn-filled h-12 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
                        >
                          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                          <span>{isResending ? 'Sending...' : 'Resend Confirmation Link'}</span>
                        </button>

                        <div className="flex items-center justify-center text-xs pt-1">
                          <button
                            type="button"
                            onClick={handleProceedToLogin}
                            className="font-bold text-primary hover:underline flex items-center gap-1"
                          >
                            <span>Back to Login</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Success View inside Popup */
                <div className="mt-6 text-center space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-800">
                      ✓ Email verified within the 10-minute window!
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-1 font-semibold">
                      Please enter your password on the login screen to access the BottlePOS portal.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToLogin}
                    className="w-full btn-filled h-12 flex items-center justify-center gap-2 font-bold"
                  >
                    <span>Go to Login Screen</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
