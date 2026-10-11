import { useState } from 'react';
import { Eye, EyeOff, Lock, ArrowRight, HelpCircle, Activity, FileText, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function Login() {
  const { login, error: authError, clearError } = useAuth();
  
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const displayError = error || authError;

  const handleClearError = () => {
    if (error) setError('');
    if (authError && clearError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputValue = email.trim();
    
    if (!inputValue) { 
      setError('Invalid username or email. Please enter your registered MOR email or username.');    
      return; 
    }

    if (!password || !password.trim()) {
      setError('Invalid password. Please enter your password.');
      return;
    }
    
    handleClearError();
    setLoading(true);

    try {
      await login(inputValue, password);
    } catch (err) {
      setError(err?.message || 'Invalid username/email or password. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      {/* ═══ LEFT PANEL — Royal Blue Brand Section ═══ */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-[#1e40af] text-white p-8 lg:p-12 flex-col justify-between h-full">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <img
                src="/mor-logo.jpeg"
                alt="Ministry of Revenues"
                className="w-full h-full object-cover"
                onError={e => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-white/15 items-center justify-center text-white font-bold text-sm hidden">MOR</div>
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">ITAS Tax Audit System</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-xl my-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">MINISTRY OF REVENUES - ITAS</p>
          <h2 className="text-[2.25rem] lg:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-white">
            Tax audit administration, operated with clarity.
          </h2>
          <p className="text-blue-100/80 text-[14px] leading-relaxed max-w-lg">
            Sign in to access the MOR Tax Audit System — annual audit planning, risk-based case selection, desk &amp; comprehensive audits, joint &amp; transfer pricing audits, and quality assurance in one secure console.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-blue-200/70 text-xs">
          <Lock size={13} />
          <span>Authorized personnel only • Ethiopian Ministry of Revenues</span>
        </div>
      </div>

      {/* ═══ RIGHT PANEL — Dark Theme Login Form ═══ */}
      <div className="w-full md:w-1/2 h-full bg-[#050505] flex items-center justify-center p-6 lg:p-8 text-white overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-5 my-auto">
          <div className="space-y-1">
            <h2 className="text-[2.2rem] font-bold tracking-tight text-white">Welcome back</h2>
            <p className="text-sm text-gray-400">Sign in to continue to the ITAS Tax Audit System.</p>
          </div>

          {displayError && (
            <div
              role="alert"
              className="text-xs text-red-200 bg-red-950/80 border border-red-600/80 rounded-xl px-4 py-3.5 flex items-start gap-3 shadow-lg shadow-red-950/50"
            >
              <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-red-300 text-[12px]">Authentication Failed</p>
                <p className="text-red-200/95 leading-relaxed">{displayError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em] mb-2">
                Username or Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    handleClearError();
                  }}
                  placeholder="Enter your official MOR email or username"
                  className={`w-full pl-10 pr-4 py-3 bg-[#111827] border ${
                    displayError ? 'border-red-600/80 focus:ring-red-500/40 focus:border-red-500' : 'border-gray-800 focus:ring-blue-500/40 focus:border-blue-500'
                  } text-white placeholder-gray-500 text-[13px] rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 font-mono`}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Sign in using your official MOR email address or assigned system username.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                  Password <span className="text-red-400">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    handleClearError();
                  }}
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-3 bg-[#111827] border ${
                    displayError ? 'border-red-600/80 focus:ring-red-500/40 focus:border-red-500' : 'border-gray-800 focus:ring-blue-500/40 focus:border-blue-500'
                  } text-white placeholder-gray-600 text-[13px] rounded-xl focus:outline-none focus:ring-2 transition-all duration-200`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1.5 flex items-center justify-between">
                <span>🔒 BCrypt Hash Verified • 5-Attempt Lockout Guard</span>
                <span>15-Min Idle Timeout</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30 cursor-pointer"
            >
              {loading ? 'Verifying Credentials…' : 'Sign in to ITAS'}
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-gray-800/80">
            {[
              { icon: HelpCircle, label: 'Help Center' },
              { icon: Activity, label: 'System Status' },
              { icon: FileText, label: 'Privacy Policy' },
              { icon: Mail, label: 'Contact Support' },
            ].map((link, i) => (
              <a key={i} href="#" className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-blue-400 transition-colors duration-150">
                <link.icon size={11} />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
