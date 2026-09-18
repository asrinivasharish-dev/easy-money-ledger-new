import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Smartphone,
  Laptop,
  Tablet,
  ShieldCheck,
  AlertCircle,
  Database,
  ArrowUpCircle
} from 'lucide-react';
import { User } from '../firebase';
import { SyncStatus } from '../utils/googleSyncService';

interface GoogleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  totalLoansCount: number;
  errorMessage: string | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<void>;
  onUploadLocalData: () => Promise<void>;
}

export function GoogleSyncModal({
  isOpen,
  onClose,
  user,
  syncStatus,
  lastSyncedAt,
  totalLoansCount,
  errorMessage,
  onSignIn,
  onSignOut,
  onSyncNow,
  onUploadLocalData,
}: GoogleSyncModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (action: () => Promise<void>, successMessage?: string) => {
    setIsProcessing(true);
    setLocalError(null);
    setActionSuccess(null);
    try {
      await action();
      if (successMessage) {
        setActionSuccess(successMessage);
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch (err: any) {
      console.error('Action error:', err);
      setLocalError(err.message || 'An error occurred during synchronization.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="google-sync-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="google-sync-modal-container"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Google Multi-Device Sync</h3>
              <p className="text-[11px] text-slate-500 font-medium">Access your ledger from any phone, PC, or tablet</p>
            </div>
          </div>
          <button
            id="close-sync-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-500 hover:text-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Error alerts */}
          {(errorMessage || localError) && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Sync Notification:</span>
                <span>{localError || errorMessage}</span>
              </div>
            </div>
          )}

          {/* Success alerts */}
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Success</span>
                <span>{actionSuccess}</span>
              </div>
            </div>
          )}

          {user ? (
            /* SIGNED IN VIEW */
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google Account'}
                      className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-xs shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                      {(user.displayName || user.email || 'G').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-900 truncate">
                        {user.displayName || 'Google User'}
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                    <span className="text-xs text-slate-500 block truncate">{user.email}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Active</span>
                </div>
              </div>

              {/* Status Metrics Box */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Database className="w-3.5 h-3.5 text-emerald-700" />
                    Cloud Records:
                  </span>
                  <span className="font-bold text-slate-900">{totalLoansCount} loans saved in cloud</span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${syncStatus === 'SYNCING' ? 'animate-spin' : ''}`} />
                    Sync Status:
                  </span>
                  <span className="font-bold text-emerald-800">
                    {syncStatus === 'SYNCING' ? 'Synchronizing...' : 'Up to date with Cloud'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="text-slate-500">Last Synced:</span>
                  <span className="font-semibold text-slate-700">
                    {lastSyncedAt ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Multi-Device Graphic Banner */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-md">
                <div className="flex items-center gap-1 text-emerald-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                  <Tablet className="w-5 h-5" />
                  <Laptop className="w-6 h-6" />
                </div>
                <div className="text-xs">
                  <span className="font-bold block text-emerald-300">Live Across Multiple Devices</span>
                  <span className="text-[11px] text-slate-300 block">
                    Any change you make here updates automatically on all devices logged into this Google account.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  id="sync-now-btn"
                  onClick={() => handleAction(onSyncNow, 'Cloud database refreshed & synced!')}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition active:scale-98 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Syncing...' : 'Sync Cloud Data Now'}</span>
                </button>

                <button
                  id="upload-local-btn"
                  onClick={() => handleAction(onUploadLocalData, 'All offline transactions uploaded to your Google account!')}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Upload & Merge Local Offline Records</span>
                </button>

                <button
                  id="sign-out-btn"
                  onClick={() => handleAction(onSignOut, 'Signed out of Google account.')}
                  disabled={isProcessing}
                  className="w-full py-2 px-4 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out (Revert to Offline Mode)</span>
                </button>
              </div>
            </div>
          ) : (
            /* NOT SIGNED IN VIEW */
            <div className="space-y-4">
              {/* Value Proposition Cards */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Seamless Cloud Sync</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Keep your records instantly synchronized between your Android phone, work laptop, and home PC.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Private & Secured by Google</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Only your authenticated Google account can read or modify your personal ledger. No one else has access.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Offline Room & Local Storage Preserved</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      You can continue adding loans even if you lose network connectivity. Data automatically syncs when back online.
                    </p>
                  </div>
                </div>
              </div>

              {/* Big Google Sign-In Button */}
              <button
                id="google-signin-btn"
                onClick={() => handleAction(onSignIn, 'Successfully connected with Google!')}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition active:scale-98 disabled:opacity-50"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isProcessing ? 'Connecting to Google...' : 'Continue with Google Account'}</span>
              </button>

              <p className="text-[10px] text-center text-slate-400">
                Signing in enables multi-device cloud synchronization via Google Cloud Firestore.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
