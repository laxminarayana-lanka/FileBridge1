import React, { useEffect, useRef, useState } from 'react';
import { Camera, Key, Check, Radio, ShieldCheck, FileText, ArrowDownToLine } from 'lucide-react';
import { formatBytes } from '../utils';

export default function ReceiverView({
  pendingHandshake,
  onApproveHandshake,
  onDeclineHandshake,
  onConnectToSender,
  initialSenderId = '',
  isConnecting = false,
  connectingStatus = '',
  connectionError,
  onResetError
}) {
  const [connectMethod, setConnectMethod] = useState(initialSenderId ? 'manual' : 'camera');
  const [senderId, setSenderId] = useState(initialSenderId);
  const [isCameraActive, setIsCameraActive] = useState(!initialSenderId);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (initialSenderId) {
      setSenderId(initialSenderId);
      setConnectMethod('manual');
      setIsCameraActive(false);
    }
  }, [initialSenderId]);

  useEffect(() => {
    if (!isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isScanning = true;
    let scanInterval = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          scanInterval = setInterval(async () => {
            if (!isScanning || !videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) handleCodeFound(barcodes[0].rawValue);
            } catch {
              // Ignore a frame that cannot be decoded.
            }
          }, 300);
        }
      } catch {
        setCameraError('Camera access denied or unavailable. Enter the sender Unique ID manually.');
      }
    };

    startCamera();
    return () => {
      isScanning = false;
      if (scanInterval) clearInterval(scanInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive]);

  const handleCodeFound = (rawText) => {
    let extractedId = '';
    try {
      const url = new URL(rawText);
      extractedId = url.searchParams.get('connect') || url.searchParams.get('sendTo') || '';
    } catch {
      // Raw code.
    }
    if (!extractedId) {
      try {
        extractedId = JSON.parse(rawText).id || '';
      } catch {
        const match = rawText.match(/FB-[A-Z0-9]+/i);
        if (match) extractedId = match[0];
      }
    }
    if (extractedId) {
      const normalizedId = extractedId.toUpperCase();
      setSenderId(normalizedId);
      setIsCameraActive(false);
      setConnectMethod('manual');
      onConnectToSender?.(normalizedId);
    }
  };

  return (
    <div className="relative">
      {/* Handshake Approval Modal */}
      {pendingHandshake && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#e2e8f0] p-6 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center">
                <ArrowDownToLine className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1f2937]">Incoming Transfer Request</h3>
                <p className="text-xs text-[#64748b]">Permission required to receive file</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] space-y-3 mb-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Sender:</span>
                <span className="font-semibold text-[#1e293b]">{pendingHandshake.senderName || 'Nearby Peer'}</span>
              </div>
              <div className="h-px bg-[#e2e8f0]" />
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-[#e9eef6] text-[#004d61] mt-0.5">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1f2937] truncate">{pendingHandshake.file.name}</p>
                  <p className="text-xs text-[#004d61] font-mono font-bold mt-0.5">{formatBytes(pendingHandshake.file.size)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onDeclineHandshake}
                className="flex-1 py-3 px-4 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#475569] text-sm font-semibold transition-colors"
              >
                Decline
              </button>
              <button
                onClick={onApproveHandshake}
                className="flex-1 py-3 px-4 rounded-full bg-[#004d61] hover:bg-[#003947] text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Accept & Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Receiver Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e2e8f0] shadow-sm max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#d3e3fd]/60 text-[#0b57d0] text-xs font-semibold mb-3">
            <Radio className="h-3.5 w-3.5 text-[#0b57d0] animate-pulse" />
            <span>Ready to Receive</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1f2937] tracking-tight">Receive Files</h2>
          <p className="text-xs sm:text-sm text-[#4b5563] mt-1">
            Scan the sender's QR code or enter their Unique ID
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#f0f4f9] border border-[#e2e8f0] mb-3">
          <button
            type="button"
            onClick={() => { setConnectMethod('camera'); setIsCameraActive(true); }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 ${
              connectMethod === 'camera' ? 'bg-white text-[#004d61] shadow-xs' : 'text-[#64748b]'
            }`}
          >
            <Camera className="h-3.5 w-3.5" />
            <span>Scan QR</span>
          </button>
          <button
            type="button"
            onClick={() => { setConnectMethod('manual'); setIsCameraActive(false); }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 ${
              connectMethod === 'manual' ? 'bg-white text-[#004d61] shadow-xs' : 'text-[#64748b]'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Unique ID</span>
          </button>
        </div>

        {connectMethod === 'camera' ? (
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] text-center mb-6">
            {cameraError ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <p>{cameraError}</p>
                <button type="button" onClick={() => { setConnectMethod('manual'); setIsCameraActive(false); }} className="mt-2 px-3 py-1 bg-white border border-rose-300 rounded-lg font-semibold">
                  Enter ID Manually
                </button>
              </div>
            ) : (
              <div>
                <div className="relative w-full aspect-square max-w-[240px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-[#004d61]">
                  <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold text-[#1f2937] mt-3">Point camera at the Sender's QR Code</p>
                <button
                  type="button"
                  onClick={() => {
                    const qrData = prompt('Paste the sender QR code URL or Unique ID:');
                    if (qrData) handleCodeFound(qrData);
                  }}
                  className="mt-3 text-xs font-semibold text-[#004d61] hover:underline"
                >
                  Paste QR code or ID
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] mb-6">
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value.toUpperCase())}
              placeholder="e.g. FB-8942"
              className="w-full py-3 px-4 rounded-xl bg-white border border-[#cbd5e1] text-[#1f2937] font-mono text-center text-lg uppercase tracking-widest outline-none"
              maxLength={10}
            />
            <button
              type="button"
              disabled={!senderId.trim() || isConnecting}
              onClick={() => onConnectToSender(senderId.trim())}
              className="mt-3 w-full py-3 rounded-full bg-[#004d61] disabled:bg-[#e2e8f0] disabled:text-[#94a3b8] text-white text-sm font-bold"
            >
              {isConnecting ? connectingStatus || 'Connecting...' : 'Connect to Sender'}
            </button>
          </div>
        )}

        {connectionError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>{connectionError}</span>
            <button type="button" onClick={onResetError} className="ml-3 font-semibold">Dismiss</button>
          </div>
        )}
        {connectingStatus && !connectionError && !isConnecting && (
          <p role="status" className="mb-4 text-center text-xs font-semibold text-emerald-700">{connectingStatus}</p>
        )}

        {/* Security & Reliability Indicators */}
        <div className="grid grid-cols-2 gap-3 text-xs text-[#475569]">
          <div className="p-3 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] flex items-center space-x-2.5">
            <ShieldCheck className="h-4 w-4 text-[#004d61] shrink-0" />
            <span>Receiver must approve before transfer</span>
          </div>
          <div className="p-3 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] flex items-center space-x-2.5">
            <Radio className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Direct P2P over Wi-Fi, 4G & 5G</span>
          </div>
        </div>

      </div>
    </div>
  );
}
