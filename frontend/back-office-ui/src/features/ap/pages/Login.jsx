import { useState } from 'react';
import { Eye, EyeOff, Lock, ArrowRight, HelpCircle, Activity, FileText, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('Mor@2026!');
  const [showPwd, setShowPwd]     = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const inputValue = email.trim();
    
    if (!inputValue) { 
      setError('Username or email is required');    
      return; 
    }

    const effectivePassword = password || 'Mor@2026!';
    
    setError('');
    setLoading(true);

    try {
      await login(inputValue, effectivePassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please check the username or email.');
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
            <h1 className="text-lg font-bold tracking-tight text-white">ITAS Back-office</h1>
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-w-xl my-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200/80">MINISTRY OF REVENUE - ITAS</p>
          <h2 className="text-[2.25rem] lg:text-[2.75rem] font-extrabold leading-[1.1] tracking-tight text-white">
            Tax administration, operated with clarity.
          </h2>
          <p className="text-blue-100/80 text-[14px] leading-relaxed max-w-lg">
            Sign in to access the back-office suite — registration, workflow tasks, and tax-type administration in one secure console.
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
            <p className="text-sm text-gray-400">Sign in to continue to the ITAS Back-office.</p>
          </div>

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
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. getnet.bekele@mor.gov.et, u-ad-01, or eden.haile@mor.gov.et"
                  className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-gray-800 text-white placeholder-gray-500 text-[13px]
                             rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                             transition-all duration-200 font-mono"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                Sign in using your official MOR email address (e.g. <code className="text-blue-400">getnet.bekele@mor.gov.et</code>) or system username.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-[0.08em]">
                  Password <span className="text-red-400">*</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-400">
                  Default: <code className="font-mono">Mor@2026!</code>
                </span>
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
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password (default: Mor@2026!)"
                  className="w-full pl-10 pr-11 py-3 bg-[#111827] border border-gray-800 text-white placeholder-gray-600 text-[13px]
                             rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500
                             transition-all duration-200"
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

            {error && (
              <div className="text-xs text-red-300 bg-red-950/60 border border-red-700/70 rounded-xl px-3.5 py-3 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30 cursor-pointer"
            >
              {loading ? 'Verifying Credentials…' : 'Sign in to ITAS'}
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Quick-Fill Helper for System Admin & Existing Roles */}
          <div className="pt-3 border-t border-gray-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span className="font-bold uppercase tracking-wider text-gray-500">Quick-Fill Credentials</span>
              <span className="text-[10px] text-blue-400 font-mono">Password: Mor@2026!</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: '🛡️ System Admin', id: 'admin@mor.gov.et', sub: 'User & Security Admin' },
                { label: '🏅 QA Officer', id: 'qa.officer1@mor.gov.et', sub: 'ISO 19011 QA Inspector' },
                { label: '⭐ QA Team Leader', id: 'qa.tl1@mor.gov.et', sub: 'QA Supervisory Review' },
                { label: '🏛️ QA Director', id: 'qa.director@mor.gov.et', sub: 'Executive QA Governance' },
                { label: '🏢 LTO1 Manager', id: 'u-tcm-federal-lto1', sub: 'Federal LTO-1 Manager' },
                { label: '📋 Desk TL (LTO1)', id: 'u-tl-federal-lto1-desk-1', sub: 'Desk Audit Team Leader' },
                { label: '🔍 Desk Auditor', id: 'u-aud-federal-lto1-desk-1-1', sub: 'Desk Audit Execution' },
                { label: '📊 Comp Auditor', id: 'u-aud-federal-lto1-comp-1-1', sub: 'Comprehensive Audit' },
                { label: '⚖️ Joint TL (LTO2)', id: 'fed2.ja.tl@mor.gov.et', sub: 'Joint Audit Team Leader' },
                { label: '⚖️ Joint Auditor', id: 'fed.ja.auditor1@mor.gov.et', sub: 'Joint Audit Workspace' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setEmail(preset.id);
                    setPassword('Mor@2026!');
                    setError('');
                  }}
                  className="text-left px-2.5 py-2 rounded-lg bg-[#111827] hover:bg-blue-950/50 border border-gray-800 hover:border-blue-600/50 transition cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-gray-200 truncate">{preset.label}</div>
                  <div className="text-[10px] text-gray-500 font-mono truncate">{preset.id}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 mt-4 pt-1">
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
