import React, { lazy, Suspense, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Pause,
  Play,
  X,
  CheckCircle2,
  Download,
  Activity,
  Timer,
  HardDrive,
  FileText,
  ShieldCheck,
  RotateCcw,
  Bell,
  Zap
} from 'lucide-react';
import { formatBytes, formatSpeed, formatTimeRemaining } from '../utils';

const TransferJourney = lazy(() => import('./TransferJourney'));

export default function TransferProgress({
  transferState,
  onPause,
  onResume,
  onCancel,
  onReset
}) {
  const {
    fileName,
    fileSize,
    progress = 0,
    bytesTransferred = 0,
    speed = 0,
    eta = 0,
    isPaused = false,
    isCompleted = false,
    downloadUrl = null,
    role = 'sender',
    duration = 0
  } = transferState;

  // Trigger celebration confetti on 100% completion
  useEffect(() => {
    if (isCompleted) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    }
  }, [isCompleted]);

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] max-w-xl mx-auto shadow-sm relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${
            isCompleted
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-[#c2e7ff] border-[#b9dffe] text-[#004d61]'
          }`}>
            {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
          </div>
          <div className="min-w-0">
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800'
                : isPaused
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#c2e7ff] text-[#004d61]'
            }`}>
              {isCompleted ? 'Transfer Complete' : isPaused ? 'Transfer Paused' : 'P2P Streaming Active'}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#1f2937] truncate mt-1">
              {fileName || 'Transferring file...'}
            </h3>
            <p className="text-xs text-[#64748b]">
              Role: <span className="font-semibold text-[#1e293b] capitalize">{role}</span> • {formatBytes(fileSize)} total
            </p>
          </div>
        </div>

        {!isCompleted && (
          <button
            onClick={onCancel}
            className="p-2 rounded-full hover:bg-[#f1f5f9] text-[#64748b] hover:text-rose-600 transition-colors"
            title="Cancel transfer"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Background & Alert Status Banner */}
      {!isCompleted ? (
        <div className="mb-5 flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#e9eef6] border border-[#e2e8f0] text-[11px] text-[#475569]">
          <div className="flex items-center space-x-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[#1e293b]">Runs in Background • Screen Kept Awake</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1 text-[10px] text-[#64748b]">
            <Bell className="h-3 w-3 text-[#004d61]" />
            <span>Alert will fire on completion</span>
          </div>
        </div>
      ) : (
        <div className="mb-5 flex items-center justify-between px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
          <div className="flex items-center space-x-1.5">
            <Bell className="h-3.5 w-3.5 text-emerald-600 animate-bounce" />
            <span className="font-bold">Completion Alert Sent to Both Devices!</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Chime, Notification & Vibration fired</span>
        </div>
      )}

      {/* Speedometer & Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] mb-6">
        {/* Speed */}
        <div className="text-center">
          <span className="text-[11px] font-semibold text-[#64748b] flex items-center justify-center space-x-1">
            <Activity className="h-3.5 w-3.5 text-[#004d61]" />
            <span>Speed</span>
          </span>
          <div className="text-sm sm:text-base font-extrabold text-[#004d61] font-mono mt-1">
            {isCompleted ? 'Done' : isPaused ? '0 KB/s' : formatSpeed(speed)}
          </div>
        </div>

        {/* ETA */}
        <div className="text-center border-x border-[#e2e8f0]">
          <span className="text-[11px] font-semibold text-[#64748b] flex items-center justify-center space-x-1">
            <Timer className="h-3.5 w-3.5 text-[#004d61]" />
            <span>{isCompleted ? 'Duration' : 'Time Left'}</span>
          </span>
          <div className="text-sm sm:text-base font-extrabold text-[#1f2937] font-mono mt-1">
            {isCompleted ? `${Math.ceil(duration)}s` : formatTimeRemaining(eta)}
          </div>
        </div>

        {/* Data Transferred */}
        <div className="text-center">
          <span className="text-[11px] font-semibold text-[#64748b] flex items-center justify-center space-x-1">
            <HardDrive className="h-3.5 w-3.5 text-[#004d61]" />
            <span>Transferred</span>
          </span>
          <div className="text-sm sm:text-base font-extrabold text-[#1f2937] font-mono mt-1">
            {formatBytes(bytesTransferred)}
          </div>
        </div>
      </div>

      {/* Progress Bar & Percentage */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-[#475569]">
            {isCompleted ? '100% Received' : `${formatBytes(bytesTransferred)} of ${formatBytes(fileSize)}`}
          </span>
          <span className="text-lg font-extrabold font-mono text-[#004d61]">
            {progress.toFixed(1)}%
          </span>
        </div>

        {/* Outer bar */}
        <div className="h-3.5 w-full bg-[#e2e8f0] rounded-full overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              isCompleted
                ? 'bg-emerald-500'
                : isPaused
                ? 'bg-amber-400'
                : 'bg-[#004d61]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      <Suspense fallback={
        <div className="mb-6 flex h-52 items-center justify-center rounded-2xl border border-[#dbeaf6] bg-[#e3f2ff] text-sm font-medium text-[#145b91] sm:h-60">
          Preparing delivery animation...
        </div>
      }>
        <TransferJourney progress={progress} isCompleted={isCompleted} isPaused={isPaused} />
      </Suspense>

      {/* Action Controls */}
      <div className="flex items-center space-x-3">
        {!isCompleted ? (
          <>
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex-1 py-3 px-4 rounded-full bg-[#004d61] hover:bg-[#003947] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Resume Stream</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-1 py-3 px-4 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1f2937] text-sm font-bold border border-[#cbd5e1] transition-all flex items-center justify-center space-x-2"
              >
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </button>
            )}
            <button
              onClick={onCancel}
              className="py-3 px-5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-sm font-semibold border border-rose-200 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            {role === 'receiver' && downloadUrl && (
              <a
                href={downloadUrl}
                download={fileName}
                className="w-full sm:flex-1 py-3 px-6 rounded-full bg-[#004d61] hover:bg-[#003947] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Save to Device</span>
              </a>
            )}
            <button
              onClick={onReset}
              className="w-full sm:flex-1 py-3 px-6 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1f2937] text-sm font-bold border border-[#cbd5e1] transition-all flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Transfer Another File</span>
            </button>
          </div>
        )}
      </div>

      {/* Security badge */}
      <div className="mt-4 flex items-center justify-center space-x-1.5 text-[11px] text-[#64748b]">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        <span>Direct WebRTC DataChannel stream. Zero cloud retention.</span>
      </div>

    </div>
  );
}
