import React, { useState, useRef, useEffect } from 'react';
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
  Camera,
  Laptop,
  Smartphone,
  RefreshCw,
  Check,
  ScanLine
} from 'lucide-react';
import { formatBytes } from '../utils';

export default function SenderView({
  onConnectAndSend,
  isConnecting,
  connectionError,
  onResetError,
  initialTargetId = '',
  discoveredPeers = [],
  onScanNearby
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [isDragging, setIsDragging] = useState(false);
  
  // Connection selection mode: 'radar' | 'camera' | 'manual'
  const [connectMethod, setConnectMethod] = useState(initialTargetId ? 'manual' : 'radar');
  
  // Live Camera Scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Handle incoming initial target ID change
  useEffect(() => {
    if (initialTargetId) {
      setTargetId(initialTargetId);
      setConnectMethod('manual');
    }
  }, [initialTargetId]);

  // Handle Live Camera QR Scanner
  useEffect(() => {
    if (!isCameraActive) {
      stopCamera();
      return;
    }

    let isScanning = true;
    let scanInterval = null;

    async function startCamera() {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;

        if (videoRef.current && isScanning) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();

          // If browser has native BarcodeDetector API (Chrome, Edge, Android)
          if ('BarcodeDetector' in window) {
            const barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
            scanInterval = setInterval(async () => {
              if (!isScanning || !videoRef.current) return;
              try {
                if (videoRef.current.readyState >= 2) {
                  const barcodes = await barcodeDetector.detect(videoRef.current);
                  if (barcodes.length > 0 && barcodes[0].rawValue) {
                    handleCodeFound(barcodes[0].rawValue);
                  }
                }
              } catch (e) {
                // frame decode tick error
              }
            }, 300);
          }
        }
      } catch (err) {
        setCameraError('Camera access denied or unavailable. You can enter the code manually below.');
      }
    }

    startCamera();

    return () => {
      isScanning = false;
      if (scanInterval) clearInterval(scanInterval);
      stopCamera();
    };
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCodeFound = (rawText) => {
    let extractedId = '';

    // Check if it's a URL with ?sendTo= or ?connect=
    try {
      const url = new URL(rawText);
      extractedId = url.searchParams.get('sendTo') || url.searchParams.get('connect') || '';
    } catch {
      // not a full URL
    }

    // Check if it's JSON
    if (!extractedId) {
      try {
        const parsed = JSON.parse(rawText);
        extractedId = parsed.id || '';
      } catch {
        // not json
      }
    }

    // Check if it's a raw string containing FB-XXXX
    if (!extractedId) {
      const match = rawText.match(/FB-[A-Z0-9]+/i);
      if (match) extractedId = match[0];
    }

    if (extractedId) {
      setTargetId(extractedId.toUpperCase());
      setIsCameraActive(false);
      setConnectMethod('manual');
    }
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
          Scan nearby devices, scan the receiver's QR code, or enter their ID
        </p>
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

      {/* Step 2: Connect to Receiver (Nearby Radar, Camera Scan QR, or Enter Code) */}
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-2">
          Step 2: Connect to Receiver Device
        </label>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#f0f4f9] border border-[#e2e8f0] mb-3">
          {/* 1. Radar Discovery */}
          <button
            type="button"
            onClick={() => {
              setConnectMethod('radar');
              setIsCameraActive(false);
              if (onScanNearby) onScanNearby();
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              connectMethod === 'radar'
                ? 'bg-white text-[#004d61] shadow-xs'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Radio className="h-3.5 w-3.5 text-[#004d61]" />
            <span>Nearby Radar</span>
          </button>

          {/* 2. Camera QR Scanner */}
          <button
            type="button"
            onClick={() => {
              setConnectMethod('camera');
              setIsCameraActive(true);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              connectMethod === 'camera'
                ? 'bg-white text-[#004d61] shadow-xs'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Camera className="h-3.5 w-3.5 text-[#004d61]" />
            <span>Scan QR</span>
          </button>

          {/* 3. Manual ID Input */}
          <button
            type="button"
            onClick={() => {
              setConnectMethod('manual');
              setIsCameraActive(false);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              connectMethod === 'manual'
                ? 'bg-white text-[#004d61] shadow-xs'
                : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <Key className="h-3.5 w-3.5 text-[#004d61]" />
            <span>Enter ID</span>
          </button>
        </div>

        {/* Tab 1: Nearby Radar View */}
        {connectMethod === 'radar' && (
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
        )}

        {/* Tab 2: Live Camera QR Scanner */}
        {connectMethod === 'camera' && (
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] text-center">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p className="font-semibold mb-1">Camera Notice</p>
                <p>{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setConnectMethod('manual')}
                  className="mt-2 px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold"
                >
                  Enter Code Manually
                </button>
              </div>
            ) : (
              <div>
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black shadow-md border-2 border-[#004d61]">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target Overlay */}
                  <div className="absolute inset-4 border-2 border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-0.5 bg-[#004d61] shadow-lg animate-pulse" />
                  </div>
                </div>
                <p className="text-xs font-semibold text-[#1f2937] mt-3">
                  Point camera at Receiver's QR Code
                </p>
                <p className="text-[11px] text-[#64748b] mt-0.5">
                  The receiver ID will be captured automatically
                </p>

                {/* Simulated / Quick Test Input for webcam-less environments */}
                <div className="mt-3 pt-3 border-t border-[#e2e8f0]">
                  <button
                    type="button"
                    onClick={() => {
                      const simulated = prompt('Paste QR code data or receiver ID:', 'FB-');
                      if (simulated) handleCodeFound(simulated);
                    }}
                    className="text-xs font-semibold text-[#004d61] hover:underline"
                  >
                    Paste QR Code text / URL
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manual ID Input */}
        {connectMethod === 'manual' && (
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0]">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#64748b]">
                <Key className="h-5 w-5 text-[#004d61]" />
              </div>
              <input
                type="text"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value.toUpperCase())}
                placeholder="e.g. FB-8942"
                className="w-full py-3 pl-11 pr-4 rounded-xl bg-white border border-[#cbd5e1] focus:border-[#004d61] focus:ring-2 focus:ring-[#004d61]/20 text-[#1f2937] placeholder-[#94a3b8] font-mono text-center text-lg uppercase tracking-widest outline-none transition-all shadow-inner"
                maxLength={10}
              />
            </div>
            <p className="text-[11px] text-[#64748b] mt-2 text-center">
              Enter the 4 to 6 character code displayed on the receiver's screen
            </p>
          </div>
        )}

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
            <span>Connecting to Receiver ({targetId})...</span>
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
