import React, { useState, useMemo } from 'react';
import { Shield, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, X, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ChangePasswordModal({ isOpen, onClose, isForced = false }) {
  const { user, changePassword, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const checks = useMemo(() => {
    const pwd = newPassword ? newPassword.trim() : '';
    const conf = confirmPassword ? confirmPassword.trim() : '';
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9\s]/.test(pwd),
      matchesConfirm: pwd.length > 0 && pwd === conf,
    };
  }, [newPassword, confirmPassword]);

  const characterPolicyValid =
    checks.minLength &&
    checks.hasUpper &&
    checks.hasLower &&
    checks.hasNumber &&
    checks.hasSpecial &&
    checks.matchesConfirm;

  const allValid = characterPolicyValid && (isForced || currentPassword.trim().length > 0);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedNew = newPassword.trim();
    const trimmedConfirm = confirmPassword.trim();
    const trimmedCurrent = currentPassword.trim();

    if (!isForced && !trimmedCurrent) {
      setError('Please enter your current password.');
      return;
    }
    if (!checks.minLength) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (!checks.hasUpper) {
      setError('New password must include at least one uppercase letter (A–Z).');
      return;
    }
    if (!checks.hasLower) {
      setError('New password must include at least one lowercase letter (a–z).');
      return;
    }
    if (!checks.hasNumber) {
      setError('New password must include at least one digit (0–9).');
      return;
    }
    if (!checks.hasSpecial) {
      setError('New password must include at least one special character (e.g. @, !, #, $, %, _).');
      return;
    }
    if (trimmedNew !== trimmedConfirm) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(isForced ? trimmedCurrent : trimmedCurrent, trimmedNew);
      setSuccessMsg('Your new password has been encrypted with BCrypt and saved. Use this password on future logins.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
        if (onClose) onClose();
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className={`px-6 py-5 text-white flex items-center justify-between ${
          isForced
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-red-600'
            : 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/25">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {isForced ? 'Mandatory Password Update Required' : 'Change Back-Office Password'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {isForced
                  ? `Welcome, ${user?.name || user?.username}. Set your personal password to continue.`
                  : `MOR Cryptographic Credential Security • ${user?.username || user?.email}`}
              </p>
            </div>
          </div>
          {!isForced && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isForced && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">First-Login / Administrator Reset Security Policy</p>
                <p className="mt-0.5">
                  You signed in with a temporary password issued by the System Administrator. Please write your new personal password below — it will replace the temporary password for all future logins.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs font-medium text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Current Password (only required for voluntary self-service password change) */}
          {!isForced && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                New Personal Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Write new strong password"
                  required
                  autoFocus
                  className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Live Complexity Policy Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Shield size={13} className="text-blue-600" />
                MOR Back-Office Password Character Check
              </p>
              {characterPolicyValid && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ✓ All Character Checks Valid
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {[
                { ok: checks.minLength, label: 'At least 8 characters' },
                { ok: checks.hasUpper, label: 'Uppercase letter (A–Z)' },
                { ok: checks.hasLower, label: 'Lowercase letter (a–z)' },
                { ok: checks.hasNumber, label: 'At least one digit (0–9)' },
                { ok: checks.hasSpecial, label: 'Special symbol (@, !, #, $, _)' },
                { ok: checks.matchesConfirm, label: 'Confirmation matches' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-1.5 font-medium ${
                    item.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <CheckCircle2 size={13} className={item.ok ? 'text-emerald-500' : 'opacity-40'} />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-2">
            {isForced ? (
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Sign Out Instead
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition cursor-pointer ${
                allValid
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              } disabled:opacity-50`}
            >
              {submitting ? 'Encrypting & Saving...' : 'Update Password Securely'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

