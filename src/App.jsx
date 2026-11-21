import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import ReceiverView from './components/ReceiverView';
import SenderView from './components/SenderView';
import TransferProgress from './components/TransferProgress';
import TransferHistoryModal from './components/TransferHistoryModal';
import SimulationModal from './components/SimulationModal';
import NearbyShareIllustration from './components/NearbyShareIllustration';
import { FileBridgeEngine } from './services/transferEngine';
import { historyService } from './services/historyService';
import { backgroundAlertService } from './services/backgroundService';
import { generateBridgeId, formatBytes } from './utils';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Shield,
  Sparkles,
  FolderOpen,
  Share2,
  WifiOff,
  Tv,
  CheckCircle2,
  HardDrive,
  Bell,
  X
} from 'lucide-react';

export default function App() {
  // Navigation / View states
  // 'home' | 'send' | 'receive'
  const [activeTab, setActiveTab] = useState('home');
  // Bottom navigation tab: 'clean' | 'browse' | 'share'
  const [bottomNav, setBottomNav] = useState('share');
  const [initialSendToId, setInitialSendToId] = useState('');

  const [myBridgeId, setMyBridgeId] = useState('');
  const [pendingHandshake, setPendingHandshake] = useState(null);
  const [pendingConnectionRequest, setPendingConnectionRequest] = useState(null);
  const [discoveredPeers, setDiscoveredPeers] = useState([]);
  
  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [completionToast, setCompletionToast] = useState(null);

  // Connection & Transfer States
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingStatus, setConnectingStatus] = useState('');
  const [connectionError, setConnectionError] = useState(null);
  const [transferState, setTransferState] = useState({
    isActive: false,
    fileName: '',
    fileSize: 0,
    progress: 0,
    bytesTransferred: 0,
    speed: 0,
    eta: 0,
    isPaused: false,
    isCompleted: false,
    downloadUrl: null,
    role: 'sender',
    currentChunk: 0,
    totalChunks: 100,
    duration: 0
  });

  const engineRef = useRef(null);
  const simulationTimerRef = useRef(null);

  // Check URL query parameters for auto-send connect (e.g. ?sendTo=FB-XXXX or ?connect=FB-XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sendToCode = params.get('sendTo');
    const senderCode = params.get('connect');
    if (sendToCode) {
      setInitialSendToId(sendToCode.toUpperCase());
      setActiveTab('send');
    } else if (senderCode) {
      setInitialSendToId(senderCode.toUpperCase());
      setActiveTab('receive');
    }

    // Request notification permission early so user gets alert on completion
    const timer = setTimeout(() => {
      backgroundAlertService.requestNotificationPermission();
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Engine & History
  useEffect(() => {
    const engine = new FileBridgeEngine();
    engineRef.current = engine;

    const initialId = generateBridgeId();
    setMyBridgeId(initialId);
    engine.initReceiver(initialId);

    // Event listeners
    engine.on('peer_discovered', (peer) => {
      setDiscoveredPeers((prev) => {
        const index = prev.findIndex((p) => p.bridgeId === peer.bridgeId);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...peer };
          return updated;
        }
        return [...prev, peer];
      });
    });

    engine.on('connection_status', (status) => {
      setConnectingStatus(status);
    });

    engine.on('handshake_waiting', () => {
      setConnectingStatus('Waiting for receiver approval...');
    });

    engine.on('handshake_requested', (req) => {
      setPendingHandshake(req);
    });

    engine.on('connection_requested', (req) => {
      setPendingConnectionRequest(req);
      setBottomNav('share');
      setActiveTab('send');
    });

    engine.on('connection_approved', () => {
      setIsConnecting(false);
      setConnectingStatus('Connected to sender.');
    });

    engine.on('connection_declined', () => {
      setIsConnecting(false);
      setConnectingStatus('');
      setConnectionError('The sender declined the connection request.');
    });

    engine.on('handshake_approved', () => {
      setIsConnecting(false);
      engine.startStreaming();
    });

    engine.on('handshake_declined', (reason) => {
      setIsConnecting(false);
      setConnectionError(reason || 'Transfer request declined by receiver.');
    });

    engine.on('transfer_started', (transfer) => {
      backgroundAlertService.startBackgroundKeepAlive();
      setTransferState((prev) => ({
        ...prev,
        isActive: true,
        fileName: transfer.fileName,
        fileSize: transfer.fileSize,
        progress: 0,
        bytesTransferred: 0,
        isPaused: false,
        isCompleted: false,
        downloadUrl: null,
        role: engine.role,
        totalChunks: transfer.totalChunks || 100,
        currentChunk: 0
      }));
    });

    engine.on('transfer_progress', (p) => {
      backgroundAlertService.updateTabProgress(p.progress, transferState.fileName);
      setTransferState((prev) => ({
        ...prev,
        progress: p.progress,
        bytesTransferred: p.bytesTransferred,
        speed: p.speed,
        eta: p.eta,
        currentChunk: p.currentChunk,
        totalChunks: p.totalChunks
      }));
    });

    engine.on('transfer_completed', (res) => {
      backgroundAlertService.stopBackgroundKeepAlive();
      backgroundAlertService.sendCompletionAlert({
        role: engine.role,
        fileName: res.fileName,
        fileSize: res.fileSize
      });

      setCompletionToast({
        role: engine.role,
        fileName: res.fileName,
        fileSize: res.fileSize,
        duration: res.duration || 0
      });

      setTransferState((prev) => ({
        ...prev,
        progress: 100,
        bytesTransferred: prev.fileSize,
        isCompleted: true,
        downloadUrl: res.downloadUrl,
        duration: res.duration || 0
      }));

      // Record to history
      const record = historyService.addRecord({
        fileName: res.fileName,
        fileSize: res.fileSize,
        direction: engine.role === 'sender' ? 'sent' : 'received',
        status: 'completed',
        durationSeconds: res.duration || 0,
        avgSpeedMBs: res.fileSize / ((res.duration || 1) * 1024 * 1024)
      });

      if (record) {
        setHistory(historyService.getHistory());
      }
    });

    engine.on('transfer_completed_ack', (ack) => {
      // Sender receives confirmation that receiver finished
      backgroundAlertService.sendCompletionAlert({
        role: 'sender',
        fileName: ack.fileName,
        fileSize: ack.fileSize
      });
    });

    engine.on('transfer_paused', () => {
      setTransferState((prev) => ({ ...prev, isPaused: true }));
    });

    engine.on('transfer_resumed', () => {
      setTransferState((prev) => ({ ...prev, isPaused: false }));
    });

    engine.on('transfer_cancelled', () => {
      backgroundAlertService.stopBackgroundKeepAlive();
      setTransferState((prev) => ({ ...prev, isActive: false }));
    });

    setHistory(historyService.getHistory());

    return () => {
      engine.destroy();
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  // Regenerate Bridge ID
  const handleRegenerateId = () => {
    const newId = generateBridgeId();
    setMyBridgeId(newId);
    if (engineRef.current) {
      engineRef.current.initReceiver(newId);
    }
  };

  // Handshake Approval
  const handleApproveHandshake = () => {
    if (pendingHandshake && pendingHandshake.approve) {
      pendingHandshake.approve();
      setPendingHandshake(null);
    }
  };

  const handleDeclineHandshake = () => {
    if (pendingHandshake && pendingHandshake.decline) {
      pendingHandshake.decline();
      setPendingHandshake(null);
    }
  };

  // Connect & Request Send
  const handleConnectAndSend = async (file, targetId) => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      await engineRef.current.connectToReceiver(targetId, 'Nearby Device');
      engineRef.current.requestTransfer(file, 'Nearby Device');
    } catch (err) {
      setIsConnecting(false);
      setConnectionError(
        'Could not establish connection with sharing code: ' + targetId + '. Please check the code or verify both devices are online.'
      );
    }
  };

  const handleConnectToSender = async (senderId) => {
    setIsConnecting(true);
    setConnectionError(null);
    setConnectingStatus('Connecting to sender...');

    try {
      const engine = engineRef.current;
      if (!engine) throw new Error('The transfer engine is not ready yet.');
      await engine.connectToReceiver(senderId, engine.getDeviceName());
      engine.requestConnection(engine.getDeviceName());
    } catch (err) {
      setIsConnecting(false);
      setConnectingStatus('');
      setConnectionError(err.message || 'Could not connect to that sender. Check the Unique ID and try again.');
    }
  };

  const handleApproveConnectionRequest = (file) => {
    if (!pendingConnectionRequest || !file) return;

    try {
      pendingConnectionRequest.approve();
      setPendingConnectionRequest(null);
      engineRef.current.requestTransfer(file, 'Nearby Device');
    } catch (err) {
      setPendingConnectionRequest(null);
      setConnectionError(err.message || 'Could not start the file transfer.');
    }
  };

  const handleDeclineConnectionRequest = () => {
    pendingConnectionRequest?.decline();
    setPendingConnectionRequest(null);
  };

  // Transfer Controls
  const handlePause = () => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      setTransferState((prev) => ({ ...prev, isPaused: true }));
      return;
    }
    engineRef.current?.pauseTransfer();
  };

  const handleResume = () => {
    if (transferState.isActive && !simulationTimerRef.current && transferState.fileSize) {
      resumeSimulation();
      return;
    }
    engineRef.current?.resumeTransfer();
  };

  const handleCancel = () => {
    backgroundAlertService.stopBackgroundKeepAlive();
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    engineRef.current?.cancelTransfer();
    setTransferState((prev) => ({ ...prev, isActive: false }));
  };

  const handleReset = () => {
    backgroundAlertService.stopBackgroundKeepAlive();
    setCompletionToast(null);
    setTransferState({
      isActive: false,
      fileName: '',
      fileSize: 0,
      progress: 0,
      bytesTransferred: 0,
      speed: 0,
      eta: 0,
      isPaused: false,
      isCompleted: false,
      downloadUrl: null,
      role: 'sender',
      currentChunk: 0,
      totalChunks: 100,
      duration: 0
    });
  };

  // --- SIMULATION ENGINE ---
  const handleStartSimulation = ({ fileSizeGB, networkProfile }) => {
    const totalBytes = fileSizeGB * 1024 * 1024 * 1024;
    const speedMap = {
      '5g': 120 * 1024 * 1024,
      'wifi': 55 * 1024 * 1024,
      '4g': 18 * 1024 * 1024,
      'rural': 3.5 * 1024 * 1024
    };
    const targetSpeed = speedMap[networkProfile] || (50 * 1024 * 1024);
    const fileName = `NearbyShare_${fileSizeGB}GB_Benchmark.tar`;

    setTransferState({
      isActive: true,
      fileName,
      fileSize: totalBytes,
      progress: 0,
      bytesTransferred: 0,
      speed: targetSpeed,
      eta: totalBytes / targetSpeed,
      isPaused: false,
      isCompleted: false,
      downloadUrl: '#',
      role: 'sender',
      currentChunk: 0,
      totalChunks: Math.ceil(totalBytes / (64 * 1024)),
      duration: 0
    });

    runSimulationLoop(totalBytes, targetSpeed, fileName, 0);
  };

  const runSimulationLoop = (totalBytes, targetSpeed, fileName, initialTransferred = 0) => {
    let transferred = initialTransferred;
    const intervalMs = 200;
    const startTime = Date.now() - (initialTransferred / targetSpeed) * 1000;

    if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);

    simulationTimerRef.current = setInterval(() => {
      const jitter = (Math.random() * 0.3 - 0.15);
      const currentSpeed = targetSpeed * (1 + jitter);
      const deltaBytes = currentSpeed * (intervalMs / 1000);

      transferred += deltaBytes;
      if (transferred >= totalBytes) {
        transferred = totalBytes;
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;

        const duration = (Date.now() - startTime) / 1000;
        backgroundAlertService.sendCompletionAlert({
          role: 'sender',
          fileName,
          fileSize: totalBytes
        });
        setCompletionToast({
          role: 'sender',
          fileName,
          fileSize: totalBytes,
          duration
        });

        setTransferState((prev) => ({
          ...prev,
          progress: 100,
          bytesTransferred: totalBytes,
          isCompleted: true,
          speed: 0,
          eta: 0,
          duration
        }));

        historyService.addRecord({
          fileName,
          fileSize: totalBytes,
          direction: 'sent',
          status: 'completed',
          durationSeconds: duration,
          avgSpeedMBs: totalBytes / (duration * 1024 * 1024)
        });
        setHistory(historyService.getHistory());
        return;
      }

      const progress = (transferred / totalBytes) * 100;
      const remainingBytes = totalBytes - transferred;
      const eta = remainingBytes / currentSpeed;

      setTransferState((prev) => ({
        ...prev,
        progress,
        bytesTransferred: transferred,
        speed: currentSpeed,
        eta,
        currentChunk: Math.floor(transferred / (64 * 1024))
      }));
    }, intervalMs);
  };

  const resumeSimulation = () => {
    setTransferState((prev) => ({ ...prev, isPaused: false }));
    runSimulationLoop(
      transferState.fileSize,
      transferState.speed || 50 * 1024 * 1024,
      transferState.fileName,
      transferState.bytesTransferred
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] text-[#1f2937] flex flex-col font-sans selection:bg-[#004d61] selection:text-white pb-20">
      
      {/* Top Google Files Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
        onOpenSimulation={() => setIsSimulationOpen(true)}
        onToggleMenu={() => setIsHistoryOpen(true)}
      />

      {/* Floating Completion Alert Banner (for both Sender and Receiver) */}
      {completionToast && (
        <div className="fixed top-20 inset-x-4 z-50 max-w-md mx-auto animate-bounce-gentle">
          <div className="p-4 rounded-2xl bg-white border-2 border-emerald-500 shadow-xl flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1f2937] truncate">
                  {completionToast.role === 'sender' ? '✅ File Sent Successfully!' : '📥 File Received & Saved!'}
                </p>
                <p className="text-[11px] text-[#64748b] truncate mt-0.5">
                  {completionToast.fileName} ({formatBytes(completionToast.fileSize)})
                </p>
              </div>
            </div>
            <button
              onClick={() => setCompletionToast(null)}
              className="p-1.5 rounded-full hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#1f2937]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-start">

        {/* If Active Transfer: show the speedometer dashboard */}
        {transferState.isActive ? (
          <TransferProgress
            transferState={transferState}
            onPause={handlePause}
            onResume={handleResume}
            onCancel={handleCancel}
            onReset={handleReset}
          />
        ) : bottomNav === 'clean' ? (
          /* Clean Tab Screen */
          <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center mx-auto mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1f2937]">Storage & Memory Clean</h3>
            <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
              FileBridge streams chunks directly between browsers in 64 KB slices with zero RAM buildup and zero cached cloud retention.
            </p>
            <div className="mt-6 p-4 rounded-2xl bg-[#f8fafd] border border-[#e2e8f0] text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Transfer Memory Footprint:</span>
                <span className="font-bold text-emerald-600 font-mono">0 MB (Direct WebRTC)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748b]">Local Cache:</span>
                <span className="font-bold text-[#1e293b] font-mono">Optimized</span>
              </div>
            </div>
            <button
              onClick={() => { setBottomNav('share'); setActiveTab('home'); }}
              className="mt-6 w-full py-3 rounded-full bg-[#004d61] hover:bg-[#003947] text-white text-xs font-bold transition-all"
            >
              Return to Nearby Share
            </button>
          </div>
        ) : bottomNav === 'browse' ? (
          /* Browse Tab Screen */
          <div className="bg-white rounded-3xl p-6 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-[#c2e7ff] text-[#004d61]">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1f2937]">Browse Files</h3>
                  <p className="text-xs text-[#64748b]">Recent transfers and presets</p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="text-xs font-semibold text-[#004d61] hover:underline"
              >
                Full History
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-[#64748b]">
                <HardDrive className="h-10 w-10 mx-auto text-[#cbd5e1] mb-2" />
                <p className="text-xs font-semibold">No recent files received or sent</p>
                <button
                  onClick={() => { setBottomNav('share'); setActiveTab('send'); }}
                  className="mt-4 px-4 py-2 rounded-full bg-[#004d61] text-white text-xs font-semibold"
                >
                  Send a File Now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {history.slice(0, 5).map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-[#f8fafd] border border-[#e2e8f0] flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-[#1f2937] truncate">{item.fileName}</p>
                      <p className="text-[10px] text-[#64748b]">{formatBytes(item.fileSize)} • {item.direction}</p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'send' ? (
          /* Send View (Sender without QR code!) */
          <div>
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#004d61] hover:text-[#003947] mb-3 px-2 py-1 rounded-lg hover:bg-[#e9eef6] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Nearby Share</span>
            </button>
            <SenderView
              onConnectAndSend={handleConnectAndSend}
              isConnecting={isConnecting}
              connectionError={connectionError}
              onResetError={() => setConnectionError(null)}
              initialTargetId={initialSendToId}
              discoveredPeers={discoveredPeers}
              onScanNearby={() => engineRef.current?.scanNearbyPeers()}
              connectingStatus={connectingStatus}
              bridgeId={myBridgeId}
              onRegenerateId={handleRegenerateId}
              pendingConnectionRequest={pendingConnectionRequest}
              onApproveConnectionRequest={handleApproveConnectionRequest}
              onDeclineConnectionRequest={handleDeclineConnectionRequest}
            />
          </div>
        ) : activeTab === 'receive' ? (
          /* Receive View (Receiver with QR Code!) */
          <div>
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#004d61] hover:text-[#003947] mb-3 px-2 py-1 rounded-lg hover:bg-[#e9eef6] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Nearby Share</span>
            </button>
            <ReceiverView
              pendingHandshake={pendingHandshake}
              onApproveHandshake={handleApproveHandshake}
              onDeclineHandshake={handleDeclineHandshake}
              initialSenderId={initialSendToId}
              onConnectToSender={handleConnectToSender}
              isConnecting={isConnecting}
              connectingStatus={connectingStatus}
              connectionError={connectionError}
              onResetError={() => setConnectionError(null)}
            />
          </div>
        ) : (
          /* Default Nearby Share Home View matching the Google Files screenshot */
          <div className="flex flex-col items-center">
            
            {/* Mascot Blob Illustration — larger, centered */}
            <div className="w-full flex justify-center pt-4 pb-0">
              <NearbyShareIllustration className="w-72 h-48 sm:w-80 sm:h-52" />
            </div>

            {/* Title — bold, matching Google Files style */}
            <h1 className="text-[26px] sm:text-[30px] font-bold tracking-tight text-[#1a1a2e] text-center mt-3 leading-tight">
              Nearby Share
            </h1>

            {/* Send & Receive Buttons — wide pill, equal size, teal fill */}
            <div className="flex items-center justify-center gap-3 mt-6 w-full max-w-[300px]">
              <button
                onClick={() => setActiveTab('send')}
                className="flex-1 py-3 px-6 rounded-full bg-[#004d61] hover:bg-[#003a4a] active:bg-[#002e3b] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <ArrowUp className="h-[18px] w-[18px] stroke-[2.5]" />
                <span>Send</span>
              </button>

              <button
                onClick={() => setActiveTab('receive')}
                className="flex-1 py-3 px-6 rounded-full bg-[#004d61] hover:bg-[#003a4a] active:bg-[#002e3b] text-white font-semibold text-[15px] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                <ArrowDown className="h-[18px] w-[18px] stroke-[2.5]" />
                <span>Receive</span>
              </button>
            </div>

            {/* "Using Nearby Share" subtle badge pill */}
            <div className="mt-5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-[#dde3ea] shadow-sm text-xs font-medium text-[#444746]">
                {/* Nearby Share ∞ icon in mini form */}
                <svg viewBox="0 0 20 14" width="18" height="13" fill="none" className="shrink-0">
                  <path d="M3 7 C4 5,6 5,7 7 C8 9,10 9,11 7 C12 5,14 5,15 7 C16 9,18 9,19 7" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
                <span>Using <span className="text-[#1a73e8] font-semibold">Nearby Share</span></span>
              </div>
            </div>

            {/* Feature Info Cards — matching right-side screenshot */}
            <div className="w-full mt-6 space-y-2.5">
              {/* Card 1: HD Original Quality */}
              <div className="p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#edf2fb] border border-[#dde3ea] text-[#004d61] flex items-center justify-center font-bold text-[13px] shrink-0 tracking-wide">
                  HD
                </div>
                <p className="text-sm text-[#444746] leading-snug">
                  Quickly share original quality photos, videos, apps, and more
                </p>
              </div>

              {/* Card 2: Offline / No Mobile Data */}
              <div className="p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#edf2fb] border border-[#dde3ea] text-[#004d61] flex items-center justify-center shrink-0">
                  <WifiOff className="h-5 w-5" />
                </div>
                <p className="text-sm text-[#444746] leading-snug">
                  Share even when you do not have mobile data or an internet connection
                </p>
              </div>

              {/* Card 3: Safe / Choose who can share */}
              <div className="p-4 rounded-2xl bg-white border border-[#e3e8ef] shadow-sm flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#edf2fb] border border-[#dde3ea] text-[#004d61] flex items-center justify-center shrink-0">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-sm text-[#444746] leading-snug">
                  Share safely and choose who can share files with you
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Bottom Navigation Bar (Clean | Browse | Nearby Share) - exactly matching screenshot */}
      <nav className="fixed bottom-0 inset-x-0 bg-[#f8fafd] border-t border-[#e2e8f0] z-40 py-2">
        <div className="max-w-md mx-auto px-6 flex items-center justify-around">
          
          {/* 1. Clean */}
          <button
            onClick={() => { setBottomNav('clean'); }}
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all ${
              bottomNav === 'clean' ? 'text-[#004d61]' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <div className={`py-1 px-4 rounded-full transition-all ${
              bottomNav === 'clean' ? 'bg-[#c2e7ff]' : ''
            }`}>
              <Sparkles className="h-5 w-5" />
            </div>
            <span className={`text-[11px] mt-1 ${bottomNav === 'clean' ? 'font-bold text-[#004d61]' : 'font-medium'}`}>
              Clean
            </span>
          </button>

          {/* 2. Browse */}
          <button
            onClick={() => { setBottomNav('browse'); }}
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all ${
              bottomNav === 'browse' ? 'text-[#004d61]' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <div className={`py-1 px-4 rounded-full transition-all ${
              bottomNav === 'browse' ? 'bg-[#c2e7ff]' : ''
            }`}>
              <FolderOpen className="h-5 w-5" />
            </div>
            <span className={`text-[11px] mt-1 ${bottomNav === 'browse' ? 'font-bold text-[#004d61]' : 'font-medium'}`}>
              Browse
            </span>
          </button>

          {/* 3. Nearby Share (Active by default) */}
          <button
            onClick={() => { setBottomNav('share'); }}
            className={`flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all ${
              bottomNav === 'share' ? 'text-[#004d61]' : 'text-[#64748b] hover:text-[#1e293b]'
            }`}
          >
            <div className={`py-1 px-4 rounded-full transition-all ${
              bottomNav === 'share' ? 'bg-[#c2e7ff]' : ''
            }`}>
              <Share2 className="h-5 w-5" />
            </div>
            <span className={`text-[11px] mt-1 ${bottomNav === 'share' ? 'font-bold text-[#004d61]' : 'font-medium'}`}>
              Nearby Share
            </span>
          </button>

        </div>
      </nav>

      {/* History Modal */}
      <TransferHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => {
          historyService.clearHistory();
          setHistory([]);
        }}
        onDeleteRecord={(id) => {
          historyService.deleteRecord(id);
          setHistory(historyService.getHistory());
        }}
      />

      {/* Simulation / Benchmark Modal */}
      <SimulationModal
        isOpen={isSimulationOpen}
        onClose={() => setIsSimulationOpen(false)}
        onStartSimulation={handleStartSimulation}
      />

    </div>
  );
}
