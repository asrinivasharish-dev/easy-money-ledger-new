import React, { useState } from 'react';
import { X, Download, Upload, Shield, Check, Copy, AlertCircle, FileJson } from 'lucide-react';
import { Loan } from '../types';

interface BackupRestoreModalProps {
  isOpen: boolean;
  loans: Loan[];
  onClose: () => void;
  onRestore: (loans: Loan[]) => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  loans,
  onClose,
  onRestore,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const backupData = {
      app: 'Easy Money Ledger',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalLoans: loans.length,
      loans: loans,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `easy_money_ledger_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatusMessage({ type: 'success', text: 'Backup JSON downloaded to your device!' });
  };

  const handleCopyBackup = () => {
    const backupData = {
      app: 'Easy Money Ledger',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      loans: loans,
    };
    navigator.clipboard.writeText(JSON.stringify(backupData, null, 2));
    setStatusMessage({ type: 'success', text: 'Backup JSON copied to clipboard!' });
  };

  const handleRestore = () => {
    try {
      if (!jsonText.trim()) {
        setStatusMessage({ type: 'error', text: 'Please paste a valid JSON backup.' });
        return;
      }

      const parsed = JSON.parse(jsonText);
      const restoredLoans = Array.isArray(parsed) ? parsed : (parsed.loans || []);

      if (!Array.isArray(restoredLoans) || restoredLoans.length === 0) {
        setStatusMessage({ type: 'error', text: 'No valid loan records found in JSON.' });
        return;
      }

      onRestore(restoredLoans);
      setStatusMessage({ type: 'success', text: `Successfully restored ${restoredLoans.length} loan records!` });
      setJsonText('');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Invalid JSON format. Please verify the file contents.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Backup & Restore</h3>
            <p className="text-xs text-slate-500">Protect your local ledger records</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Privacy Notice */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <strong className="font-bold">100% Offline & Private:</strong> Easy Money Ledger does not store or send personal financial information to any remote server. Export a local JSON backup file to keep your data safe.
            </div>
          </div>

          {/* Export Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-sm font-bold text-slate-900">Export Local Backup</h4>
            <p className="text-xs text-slate-500">
              Contains all {loans.length} loans, simple interest terms, and repayments.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCopyBackup}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            </div>
          </div>

          {/* Restore Section */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-sm font-bold text-slate-900">Restore from Backup</h4>
            <p className="text-xs text-slate-500">
              Upload a `.json` backup file or paste the JSON text below.
            </p>

            <div className="relative">
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
            </div>

            <textarea
              rows={3}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Paste JSON content here: {"loans": [...]}'
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />

            <button
              type="button"
              onClick={handleRestore}
              disabled={!jsonText.trim()}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Ledger Data</span>
            </button>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
