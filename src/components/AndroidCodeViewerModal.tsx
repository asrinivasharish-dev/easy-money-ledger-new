import React, { useState } from 'react';
import { X, Download, Copy, Check, Folder, FileCode, ExternalLink, Terminal } from 'lucide-react';
import { ANDROID_FILES, downloadAndroidProjectZip } from '../utils/androidProjectFiles';

interface AndroidCodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeViewerModal: React.FC<AndroidCodeViewerModalProps> = ({ isOpen, onClose }) => {
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/src/main/java/com/easymoneyledger/app/util/InterestCalculator.kt');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  if (!isOpen) return null;

  const currentFile = ANDROID_FILES[selectedFilePath] || { content: '// File not found', language: 'kotlin' };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsZipping(true);
      await downloadAndroidProjectZip();
    } catch (err) {
      console.error('Failed to download ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Android Studio Project Explorer
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                  Ready to Build APK
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Kotlin • Jetpack Compose • Room Database • Material 3 • Navigation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Generating ZIP...' : 'Download Project (.ZIP)'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Explorer Layout: File Tree Sidebar & Code Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Sidebar */}
          <div className="w-64 sm:w-72 border-r border-slate-800 bg-slate-950/60 overflow-y-auto p-3 text-xs space-y-1">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>Project Files</span>
            </div>

            {Object.keys(ANDROID_FILES).map((path) => {
              const fileName = path.split('/').pop();
              const isSelected = selectedFilePath === path;
              const isGradle = path.endsWith('.kts') || path.endsWith('.toml');
              const isXml = path.endsWith('.xml');

              return (
                <button
                  key={path}
                  onClick={() => setSelectedFilePath(path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition truncate ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title={path}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isGradle ? 'text-amber-400' : isXml ? 'text-sky-400' : 'text-emerald-400'}`} />
                  <span className="truncate">{fileName}</span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="truncate">{selectedFilePath}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px] shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed select-text">
              <pre>
                <code>{currentFile.content}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>To build in Android Studio: Open folder, allow Gradle Sync, and click Run or 'Build APK'.</span>
          </div>
          <span>Package: com.easymoneyledger.app</span>
        </div>
      </div>
    </div>
  );
};
