import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, Radio, ShieldCheck, FileText, ArrowDownToLine, RefreshCw, Link2, Share2 } from 'lucide-react';
import { formatBytes } from '../utils';

export default function ReceiverView({
  bridgeId,
  onRegenerateId,
  pendingHandshake,
  onApproveHandshake,
  onDeclineHandshake
}) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const qrCanvasRef = useRef(null);

  // Generate QR Code on canvas
  useEffect(() => {
    if (bridgeId && qrCanvasRef.current) {
      // Direct link that pre-fills the receiver ID for the sender
      const shareUrl = `${window.location.origin}${window.location.pathname}?sendTo=${bridgeId}`;

      QRCode.toCanvas(
        qrCanvasRef.current,
        shareUrl,
        {
          width: 210,
          margin: 1.5,
          color: {
            dark: '#004d61', // Deep Google Files teal
            light: '#ffffff'
          }
        },
        (error) => {
          if (error) console.error('QR code error:', error);
        }
      );
    }
  }, [bridgeId]);

  const handleCopyId = () => {
    if (!bridgeId) return;
    navigator.clipboard.writeText(bridgeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = () => {
    if (!bridgeId) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?sendTo=${bridgeId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
            Sender can scan this QR code or enter your ID to connect instantly
          </p>
        </div>

        {/* QR Code Section (Prominent for Receiver!) */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] mb-6">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#e2e8f0]">
            <canvas ref={qrCanvasRef} className="rounded-lg" />
          </div>
          
          <p className="text-xs text-[#475569] mt-3.5 flex items-center space-x-1.5 font-medium text-center">
            <QrCode className="h-4 w-4 text-[#004d61] shrink-0" />
            <span>Scan with phone camera or browser to connect directly</span>
          </p>

          {/* Quick Copy Link Button */}
          <button
            onClick={handleCopyLink}
            className="mt-3 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#e9eef6] text-[#004d61] text-xs font-semibold border border-[#cbd5e1] transition-all shadow-2xs"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />
                <span>Copy Direct Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* Unique Sharing ID Display */}
        <div className="mb-6 p-4 rounded-2xl bg-[#f0f4f9] border border-[#e2e8f0] text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Your Unique Sharing ID</span>
          <div className="mt-2 flex items-center justify-center space-x-2 sm:space-x-3">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-widest text-[#004d61] font-mono">
              {bridgeId || 'LOADING...'}
            </span>
            <button
              onClick={handleCopyId}
              className="p-2.5 rounded-full bg-white hover:bg-[#d3e3fd] text-[#004d61] border border-[#cbd5e1] transition-colors shadow-xs"
              title="Copy ID to Clipboard"
            >
              {copiedId ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
            </button>
            <button
              onClick={onRegenerateId}
              className="p-2.5 rounded-full bg-white hover:bg-[#d3e3fd] text-[#64748b] hover:text-[#1e293b] border border-[#cbd5e1] transition-colors shadow-xs"
              title="Generate New ID"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          {copiedId && (
            <p className="text-xs text-emerald-600 mt-1 font-semibold">Copied ID to clipboard!</p>
          )}
        </div>

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
