import React from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  Battery,
  Code,
  Download,
  RotateCw
} from 'lucide-react';

export type DeviceFrameMode = 'phone' | 'tablet-portrait' | 'tablet-landscape' | 'responsive';

interface PhoneFrameProps {
  children: React.ReactNode;
  deviceMode: DeviceFrameMode;
  onChangeDeviceMode: (mode: DeviceFrameMode) => void;
  onRotateDevice: () => void;
  onOpenCodeViewer: () => void;
  onDownloadZip: () => void;
  currentTime: string;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  deviceMode,
  onChangeDeviceMode,
  onRotateDevice,
  onOpenCodeViewer,
  onDownloadZip,
  currentTime,
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-start p-2 sm:p-4">
      {/* Top Banner with Device Mode Switcher, Rotate Action & Android Studio Actions */}
      <header className="w-full max-w-6xl flex flex-wrap items-center justify-between gap-3 py-3 px-4 mb-3 bg-slate-800/80 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-lg">
        {/* App Branding & Platform badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/30">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Easy Money Ledger</h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Android Jetpack Compose
              </span>
            </div>
            <p className="text-xs text-slate-400">Offline Personal Loan & Borrowing Ledger • Tablet Portrait & Landscape Ready</p>
          </div>
        </div>

        {/* Action Controls: Code, Download, Device Selection & Rotate */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Device Frame Mode Segmented Control */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              id="device-mode-phone"
              onClick={() => onChangeDeviceMode('phone')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                deviceMode === 'phone'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview on Smartphone"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phone</span>
            </button>

            <button
              id="device-mode-tablet-portrait"
              onClick={() => onChangeDeviceMode('tablet-portrait')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                deviceMode === 'tablet-portrait'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview on Tablet Portrait (768×1024)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet (Port)</span>
            </button>

            <button
              id="device-mode-tablet-landscape"
              onClick={() => onChangeDeviceMode('tablet-landscape')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                deviceMode === 'tablet-landscape'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Preview on Tablet Landscape (1140×760)"
            >
              <Tablet className="w-3.5 h-3.5 rotate-90" />
              <span className="hidden sm:inline">Tablet (Land)</span>
            </button>

            <button
              id="device-mode-responsive"
              onClick={() => onChangeDeviceMode('responsive')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition ${
                deviceMode === 'responsive'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fluid Fullscreen / Actual Tablet Browser"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full</span>
            </button>
          </div>

          {/* Device Orientation Rotation Button */}
          <button
            id="rotate-device-btn"
            onClick={onRotateDevice}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-emerald-400 text-xs font-semibold transition border border-slate-600"
            title="Rotate Device between Portrait and Landscape"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Rotate</span>
          </button>

          {/* Android Code Viewer */}
          <button
            onClick={onOpenCodeViewer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-600"
            title="Inspect all Kotlin, Jetpack Compose, Room & Gradle source code"
          >
            <Code className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Android Code</span>
          </button>

          {/* Download Android Studio ZIP */}
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20"
            title="Download full Android Studio project as ZIP ready to build APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download ZIP</span>
          </button>
        </div>
      </header>

      {/* Mode Status Indicator Bar */}
      <div className="w-full max-w-6xl mb-2.5 flex items-center justify-between text-[11px] text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Active View:</span>
          <span className="text-emerald-400 font-bold capitalize">
            {deviceMode === 'phone' && 'Smartphone Portrait (420 × 870)'}
            {deviceMode === 'tablet-portrait' && 'Android Tablet Portrait (780 × 980)'}
            {deviceMode === 'tablet-landscape' && 'Android Tablet Landscape (1140 × 760)'}
            {deviceMode === 'responsive' && 'Fluid Responsive Mode (Auto-adapts to container)'}
          </span>
        </div>
        <span className="hidden md:inline text-slate-400">
          Touch, stylus & keyboard friendly • Dual-pane layout in landscape
        </span>
      </div>

      {/* Main Content: Depending on Device Mode */}
      {deviceMode === 'phone' && (
        <div className="relative w-full max-w-[420px] h-[870px] bg-slate-950 rounded-[48px] p-3.5 shadow-2xl border-[5px] border-slate-700/90 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
          {/* Phone Hardware Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-800" />
            <div className="w-10 h-1 rounded-full bg-slate-800 ml-2" />
          </div>

          {/* Android Status Bar */}
          <div className="w-full pt-2 px-6 pb-1 flex items-center justify-between text-[11px] font-semibold text-slate-300 z-40 bg-slate-900/40 select-none">
            <span>{currentTime}</span>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] font-bold text-emerald-400">5G</span>
              <Wifi className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <span>98%</span>
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Phone Display Screen */}
          <div className="relative flex-1 w-full bg-slate-50 text-slate-900 rounded-[34px] overflow-hidden flex flex-col shadow-inner">
            {children}
          </div>

          {/* Android Navigation Gesture Pill */}
          <div className="w-full pt-2 flex justify-center items-center pb-1">
            <div className="w-32 h-1 bg-slate-600 rounded-full" />
          </div>
        </div>
      )}

      {deviceMode === 'tablet-portrait' && (
        <div className="relative w-full max-w-[780px] h-[980px] max-h-[92vh] bg-slate-950 rounded-[38px] p-4 shadow-2xl border-[6px] border-slate-700/90 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
          {/* Tablet Front Camera Centered in Portrait Bezel */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 z-50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
          </div>

          {/* Android Tablet Status Bar */}
          <div className="w-full pt-2 px-6 pb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300 z-40 bg-slate-900/50 select-none">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{currentTime}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Easy Money Ledger Tablet</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="text-[10px] font-bold text-emerald-400">5G Ultra</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1">
                <span>98%</span>
                <Battery className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Tablet Display Screen */}
          <div className="relative flex-1 w-full bg-slate-50 text-slate-900 rounded-[26px] overflow-hidden flex flex-col shadow-inner">
            {children}
          </div>

          {/* Tablet Navigation Gesture Bar */}
          <div className="w-full pt-2 flex justify-center items-center pb-1">
            <div className="w-44 h-1.5 bg-slate-600 rounded-full" />
          </div>
        </div>
      )}

      {deviceMode === 'tablet-landscape' && (
        <div className="relative w-full max-w-[1140px] h-[780px] max-h-[90vh] bg-slate-950 rounded-[38px] p-4 shadow-2xl border-[6px] border-slate-700/90 ring-1 ring-white/10 flex flex-col justify-between overflow-hidden">
          {/* Tablet Front Camera Centered in Landscape Long Bezel */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-900 border border-slate-700 z-50 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
          </div>

          {/* Android Tablet Landscape Status Bar */}
          <div className="w-full pt-1.5 px-6 pb-1.5 flex items-center justify-between text-xs font-semibold text-slate-300 z-40 bg-slate-900/50 select-none">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{currentTime}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">Tablet Landscape Workspace</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="text-[10px] font-bold text-emerald-400">5G Ultra</span>
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-1">
                <span>98%</span>
                <Battery className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Tablet Display Screen in Landscape Mode */}
          <div className="relative flex-1 w-full bg-slate-50 text-slate-900 rounded-[26px] overflow-hidden flex flex-col shadow-inner">
            {children}
          </div>

          {/* Tablet Navigation Gesture Bar in Landscape */}
          <div className="w-full pt-1.5 flex justify-center items-center pb-1">
            <div className="w-56 h-1.5 bg-slate-600 rounded-full" />
          </div>
        </div>
      )}

      {deviceMode === 'responsive' && (
        <div className="w-full max-w-6xl bg-slate-50 text-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/40 min-h-[780px] flex flex-col">
          {children}
        </div>
      )}
    </div>
  );
};
