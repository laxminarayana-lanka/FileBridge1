import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Upload,
  Key,
  FileText,
  ArrowUp,
  X,
  Shield,
  Sparkles,
  AlertCircle,
  Radio,
  Laptop,
  Smartphone,
  RefreshCw,
  Check,
  QrCode,
  Copy,
} from 'lucide-react';
import { formatBytes } from '../utils';

export default function SenderView({
  onConnectAndSend,
  isConnecting,
  connectionError,
  onResetError,
  initialTargetId = '',
  discoveredPeers = [],
  onScanNearby,
  connectingStatus = '',
  bridgeId,
  onRegenerateId
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const fileInputRef = useRef(null);
  const qrCanvasRef = useRef(null);

  // Quick Preset Test Files for demonstration (1 GB, 5 GB, 10 GB)
  const presetFiles = [
    { name: 'University_Lecture_Videos.zip', size: 1024 * 1024 * 1024, label: '1 GB' },
    { name: '4K_Drone_Raw_Footage.mp4', size: 5 * 1024 * 1024 * 1024, label: '5 GB' },
    { name: 'Research_Dataset_2026.tar', size: 10 * 1024 * 1024 * 1024, label: '10 GB' }
  ];

  // Trigger nearby scan on mount
  useEffect(() => {
    if (onScanNearby) {
      onScanNearby();
      const interval = setInterval(onScanNearby, 3000);
      return () => clearInterval(interval);
    }
  }, [onScanNearby]);

  useEffect(() => {
    if (bridgeId && qrCanvasRef.current) {
      const shareUrl = `${window.location.origin}${window.location.pathname}?connect=${bridgeId}`;
      QRCode.toCanvas(qrCanvasRef.current, shareUrl, {
        width: 210,
        margin: 1.5,
        color: { dark: '#004d61', light: '#ffffff' }
      }, (error) => {
        if (error) console.error('QR code error:', error);
      });
    }
  }, [bridgeId]);

  // Handle incoming initial target ID change
  useEffect(() => {
    if (initialTargetId) {
      setTargetId(initialTargetId);
    }
  }, [initialTargetId]);

  const handleCopyId = () => {
    if (!bridgeId) return;
    navigator.clipboard.writeText(bridgeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSelectPreset = (preset) => {
    const virtualBlob = new Blob(['FileBridge Virtual Large File Stream Benchmark: ' + preset.name], {
      type: 'application/octet-stream'
    });
    Object.defineProperty(virtualBlob, 'size', { value: preset.size, writable: false });
    Object.defineProperty(virtualBlob, 'name', { value: preset.name, writable: false });
    setSelectedFile(virtualBlob);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!targetId.trim()) return;

    onConnectAndSend(selectedFile, targetId.trim());
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-[#1f2937] tracking-tight">Send Files</h2>
        <p className="text-xs sm:text-sm text-[#4b5563] mt-1">
          Share your QR code or Unique ID, or select a nearby receiver
        </p>
      </div>

      <div className="mb-6 p-5 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] text-center">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#e2e8f0] inline-block">
          <canvas ref={qrCanvasRef} className="rounded-lg" />
        </div>
        <p className="mt-3 text-xs text-[#475569] flex items-center justify-center space-x-1.5 font-medium">
          <QrCode className="h-4 w-4 text-[#004d61]" />
          <span>Receiver can scan this QR code</span>
        </p>
        <div className="mt-3 p-3 rounded-xl bg-[#f0f4f9] border border-[#e2e8f0]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">Your Unique ID</span>
          <div className="mt-1 flex items-center justify-center space-x-2">
            <span className="text-2xl font-extrabold tracking-widest text-[#004d61] font-mono">
              {bridgeId || 'LOADING...'}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="p-2 rounded-full bg-white border border-[#cbd5e1] text-[#004d61]"
              title="Copy Unique ID"
            >
              {copiedId ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onRegenerateId}
              className="p-2 rounded-full bg-white border border-[#cbd5e1] text-[#64748b]"
              title="Generate New ID"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {connectionError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start space-x-3 text-rose-800 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-xs text-rose-900">Connection Notice</p>
            <p className="text-xs text-rose-700 mt-0.5">{connectionError}</p>
          </div>
          <button onClick={onResetError} className="text-rose-500 hover:text-rose-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Step 1: File Selection */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-2">
          Step 1: Choose File to Send
        </label>

        {!selectedFile ? (
          <div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-7 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                isDragging
                  ? 'border-[#004d61] bg-[#e9eef6] scale-[1.01]'
                  : 'border-[#cbd5e1] hover:border-[#004d61] bg-[#f8fafd] hover:bg-[#f1f5f9]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-12 w-12 rounded-2xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center mx-auto mb-3 shadow-sm">
                <Upload className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-[#1f2937]">Click to browse or drag and drop</p>
              <p className="text-xs text-[#64748b] mt-1">
                Any size: 100 MB, 1 GB, 5 GB, 10 GB+ (Videos, ZIPs, Photos, Docs)
              </p>
            </div>

            {/* Quick Test File Presets */}
            <div className="mt-3">
              <span className="text-[11px] text-[#64748b] flex items-center space-x-1 mb-1.5 font-medium">
                <Sparkles className="h-3 w-3 text-[#004d61]" />
                <span>Or test with a benchmark file:</span>
              </span>
              <div className="grid grid-cols-3 gap-2">
                {presetFiles.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSelectPreset(p)}
                    className="py-1.5 px-2 rounded-xl bg-[#f0f4f9] hover:bg-[#d3e3fd] border border-[#e2e8f0] text-[#1e293b] text-xs font-mono transition-colors flex items-center justify-center space-x-1"
                  >
                    <span className="font-bold text-[#004d61]">{p.label}</span>
                    <span className="text-[10px] text-[#64748b] truncate">{p.name.split('.').pop()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#f0f4f9] border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="h-11 w-11 rounded-xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center shrink-0">
                <FileText className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1f2937] truncate">{selectedFile.name}</p>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-[#64748b]">
                  <span className="text-[#004d61] font-mono font-bold">{formatBytes(selectedFile.size)}</span>
                  <span>•</span>
                  <span>Ready to stream</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 rounded-full hover:bg-[#e2e8f0] text-[#64748b] hover:text-[#1f2937] transition-colors"
              title="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Find a Nearby Receiver */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-2">
          Step 2: Connect to Receiver Device
        </label>
        <button
          type="button"
          onClick={() => onScanNearby?.()}
          className="mb-3 w-full py-2 px-3 rounded-xl bg-[#f0f4f9] border border-[#e2e8f0] text-xs font-semibold text-[#004d61] flex items-center justify-center space-x-1.5"
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Find Nearby Devices</span>
        </button>

        {/* Nearby Receiver View */}
          <div className="p-5 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] text-center">
            {/* Animated Radar Pulse Animation */}
            <div className="relative w-24 h-24 mx-auto mb-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[#004d61]/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-[#004d61]/30 animate-pulse" />
              <div className="relative w-12 h-12 rounded-full bg-[#c2e7ff] text-[#004d61] flex items-center justify-center shadow-sm">
                <Radio className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <p className="text-xs font-bold text-[#1f2937]">Looking for nearby devices in Receive mode...</p>
            <p className="text-[11px] text-[#64748b] mt-0.5">
              Make sure the receiving device has clicked "Receive"
            </p>

            {/* List of Discovered Nearby Devices */}
            <div className="mt-4 space-y-2">
              {discoveredPeers.length > 0 ? (
                discoveredPeers.map((peer) => (
                  <button
                    key={peer.bridgeId}
                    type="button"
                    onClick={() => {
                      setTargetId(peer.bridgeId);
                    }}
                    className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left ${
                      targetId === peer.bridgeId
                        ? 'bg-[#c2e7ff]/40 border-[#004d61] shadow-xs'
                        : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#e9eef6] text-[#004d61] flex items-center justify-center shrink-0">
                        {peer.deviceName?.toLowerCase().includes('phone') ? (
                          <Smartphone className="h-5 w-5" />
                        ) : (
                          <Laptop className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1f2937] truncate">{peer.deviceName}</p>
                        <p className="text-[10px] text-[#004d61] font-mono font-bold mt-0.5">{peer.bridgeId}</p>
                      </div>
                    </div>
                    {targetId === peer.bridgeId ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#004d61] text-white text-[10px] font-bold">
                        <Check className="h-3 w-3" />
                        <span>Selected</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#004d61] bg-[#e9eef6] px-2.5 py-1 rounded-full">
                        Tap to Connect
                      </span>
                    )}
                  </button>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-white border border-[#e2e8f0] text-[11px] text-[#64748b]">
                  No nearby devices found yet. Open "Receive" on another device or tab to see it appear here automatically.
                </div>
              )}
            </div>

            {targetId && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center space-x-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Selected Receiver: <span className="font-mono">{targetId}</span></span>
              </div>
            )}
          </div>
      </div>

      {/* Step 3: Send Action Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedFile || !targetId.trim() || isConnecting}
        className={`w-full py-3.5 px-6 rounded-full font-bold text-sm flex items-center justify-center space-x-2 transition-all ${
          !selectedFile || !targetId.trim() || isConnecting
            ? 'bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed'
            : 'bg-[#004d61] hover:bg-[#003947] text-white shadow-md hover:shadow-lg'
        }`}
      >
        {isConnecting ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>{connectingStatus || `Connecting to Receiver (${targetId})...`}</span>
          </>
        ) : (
          <>
            <ArrowUp className="h-4 w-4" />
            <span>Send Files {targetId ? `to ${targetId}` : ''}</span>
          </>
        )}
      </button>

      <div className="mt-4 flex items-center justify-center space-x-2 text-[11px] text-[#64748b]">
        <Shield className="h-3.5 w-3.5 text-[#004d61]" />
        <span>Receiver must approve handshake before transfer begins</span>
      </div>

    </div>
  );
}
