import Peer from 'peerjs';

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk
const BUFFERED_AMOUNT_HIGH_THRESHOLD = 2 * 1024 * 1024; // 2 MB backpressure limit
const BUFFERED_AMOUNT_LOW_THRESHOLD = 512 * 1024; // 512 KB resume threshold

export class FileBridgeEngine {
  constructor() {
    this.peer = null;
    this.connection = null;
    this.broadcast = null;
    this.myBridgeId = null;
    this.role = null; // 'sender' | 'receiver' | 'idle'

    // Transfer State
    this.activeTransfer = null;
    this.isPaused = false;
    this.isCancelled = false;
    this.callbacks = {};

    // Speed tracker
    this.bytesTransferredWindow = 0;
    this.lastSpeedCheck = Date.now();
    this.currentSpeed = 0;
    this.speedInterval = null;

    // Local tab-to-tab channel
    try {
      this.broadcast = new BroadcastChannel('filebridge_broadcast_bus');
      this.broadcast.onmessage = (event) => this.handleBroadcastMessage(event.data);
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  // --- RECEIVER INITIALIZATION ---
  initReceiver(customId) {
    this.role = 'receiver';
    this.cleanupPeer();

    const normalizedId = (customId || 'FB-' + Math.random().toString(36).substring(2, 6).toUpperCase()).replace(/[^A-Z0-9-]/gi, '').toUpperCase();
    this.myBridgeId = normalizedId;

    try {
      // Initialize PeerJS with public STUN servers for internet traversal
      this.peer = new Peer(normalizedId.toLowerCase(), {
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        },
        debug: 1
      });

      this.peer.on('open', (id) => {
        this.emit('ready', { bridgeId: this.myBridgeId, peerId: id });
        this.startReceiverBeacon();
      });

      this.peer.on('connection', (conn) => {
        this.connection = conn;
        this.setupConnectionHandlers(conn);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS fallback notice:', err.type, err.message);
        // Fallback to local broadcast mode gracefully if cloud signaling has ID collision
        this.emit('ready', { bridgeId: this.myBridgeId, peerId: normalizedId.toLowerCase(), localOnly: true });
        this.startReceiverBeacon();
      });

    } catch (err) {
      console.error('Peer init error:', err);
      this.emit('ready', { bridgeId: this.myBridgeId, localOnly: true });
      this.startReceiverBeacon();
    }

    return this.myBridgeId;
  }

  getDeviceName() {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    let os = 'Nearby Device';
    if (ua.includes('Win')) os = 'Windows PC';
    else if (ua.includes('Mac')) os = 'MacBook';
    else if (ua.includes('Android')) os = 'Android Phone';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iPhone';
    else if (ua.includes('Linux')) os = 'Linux PC';
    return `${os} (${this.myBridgeId || 'Ready'})`;
  }

  startReceiverBeacon() {
    this.stopReceiverBeacon();
    // Announce immediately
    if (this.broadcast && this.myBridgeId) {
      this.broadcast.postMessage({
        type: 'PEER_ANNOUNCE',
        bridgeId: this.myBridgeId,
        deviceName: this.getDeviceName(),
        timestamp: Date.now()
      });
    }
    // Beacon periodically so newly opened senders discover this receiver
    this.receiverBeaconInterval = setInterval(() => {
      if (this.role === 'receiver' && this.myBridgeId && this.broadcast) {
        this.broadcast.postMessage({
          type: 'PEER_ANNOUNCE',
          bridgeId: this.myBridgeId,
          deviceName: this.getDeviceName(),
          timestamp: Date.now()
        });
      }
    }, 2500);
  }

  stopReceiverBeacon() {
    if (this.receiverBeaconInterval) {
      clearInterval(this.receiverBeaconInterval);
      this.receiverBeaconInterval = null;
    }
  }

  scanNearbyPeers() {
    if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'PEER_SCAN_REQUEST'
      });
    }
  }

  // --- SENDER CONNECTION ---
  connectToReceiver(targetBridgeId, senderName = 'Sender Device') {
    this.role = 'sender';
    this.cleanupPeer();

    const normalizedTarget = targetBridgeId.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

    return new Promise((resolve, reject) => {
      try {
        const tempSenderId = 'sender-' + Math.random().toString(36).substring(2, 9);
        this.peer = new Peer(tempSenderId, {
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          },
          debug: 1
        });

        const timeout = setTimeout(() => {
          // If PeerJS cloud takes too long, test local broadcast channel
          if (this.broadcast) {
            this.broadcast.postMessage({
              type: 'PING_RECEIVER',
              targetId: normalizedTarget,
              senderId: tempSenderId,
              senderName
            });
          }
        }, 3000);

        this.peer.on('open', () => {
          const conn = this.peer.connect(normalizedTarget.toLowerCase(), {
            reliable: true,
            serialization: 'binary'
          });

          this.connection = conn;
          this.setupConnectionHandlers(conn);

          conn.on('open', () => {
            clearTimeout(timeout);
            resolve(conn);
          });
        });

        this.peer.on('error', (err) => {
          clearTimeout(timeout);
          // Try local broadcast fallback for same-browser testing
          if (this.broadcast) {
            this.broadcast.postMessage({
              type: 'PING_RECEIVER',
              targetId: normalizedTarget,
              senderId: tempSenderId,
              senderName
            });
            resolve('broadcast_fallback');
          } else {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // --- CONNECTION EVENT HANDLERS ---
  setupConnectionHandlers(conn) {
    conn.on('data', (data) => this.handleIncomingData(data));
    conn.on('close', () => this.emit('disconnected'));
    conn.on('error', (err) => this.emit('error', err));
  }

  handleBroadcastMessage(msg) {
    if (!msg || typeof msg !== 'object') return;

    // Discovery protocol
    if (msg.type === 'PEER_SCAN_REQUEST') {
      if (this.role === 'receiver' && this.myBridgeId) {
        this.broadcast.postMessage({
          type: 'PEER_ANNOUNCE',
          bridgeId: this.myBridgeId,
          deviceName: this.getDeviceName(),
          timestamp: Date.now()
        });
      }
    } else if (msg.type === 'PEER_ANNOUNCE') {
      if (msg.bridgeId && msg.bridgeId !== this.myBridgeId) {
        this.emit('peer_discovered', {
          bridgeId: msg.bridgeId,
          deviceName: msg.deviceName || `Nearby Peer (${msg.bridgeId})`,
          timestamp: msg.timestamp || Date.now()
        });
      }
    }

    if (this.role === 'receiver') {
      if (msg.type === 'PING_RECEIVER' && msg.targetId === this.myBridgeId) {
        this.broadcast.postMessage({
          type: 'RECEIVER_PONG',
          targetId: msg.senderId,
          receiverId: this.myBridgeId
        });
      } else if (msg.type === 'DATA_ENVELOPE' && msg.targetId === this.myBridgeId) {
        this.handleIncomingData(msg.payload);
      }
    } else if (this.role === 'sender') {
      if (msg.type === 'RECEIVER_PONG' && msg.targetId === this.peer?.id) {
        this.emit('connected_via_bus');
      } else if (msg.type === 'DATA_ENVELOPE' && msg.targetId === this.peer?.id) {
        this.handleIncomingData(msg.payload);
      }
    }
  }

  sendPayload(payload) {
    if (this.connection && this.connection.open) {
      this.connection.send(payload);
    } else if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'DATA_ENVELOPE',
        targetId: this.role === 'sender' ? this.targetBridgeId : this.senderPeerId,
        payload
      });
    }
  }

  // --- INCOMING DATA DISPATCHER ---
  handleIncomingData(data) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        // raw string
      }
    }

    if (data.type === 'HANDSHAKE_REQUEST') {
      // Receiver prompts user for approval
      this.emit('handshake_requested', {
        senderName: data.senderName,
        file: data.file,
        approve: () => {
          this.activeTransfer = {
            fileName: data.file.name,
            fileSize: data.file.size,
            fileType: data.file.type,
            totalChunks: data.file.totalChunks,
            receivedChunks: 0,
            chunks: new Array(data.file.totalChunks),
            startTime: Date.now(),
            bytesTransferred: 0
          };
          this.startSpeedTracker();
          this.sendPayload({ type: 'HANDSHAKE_RESPONSE', approved: true });
          this.emit('transfer_started', this.activeTransfer);
        },
        decline: () => {
          this.sendPayload({ type: 'HANDSHAKE_RESPONSE', approved: false, reason: 'Declined by receiver' });
          this.emit('transfer_declined');
        }
      });
    } else if (data.type === 'HANDSHAKE_RESPONSE') {
      if (data.approved) {
        this.emit('handshake_approved');
      } else {
        this.emit('handshake_declined', data.reason);
      }
    } else if (data.type === 'CHUNK') {
      this.handleReceivedChunk(data);
    } else if (data.type === 'PAUSE') {
      this.isPaused = true;
      this.emit('paused_by_peer');
    } else if (data.type === 'RESUME') {
      this.isPaused = false;
      this.emit('resumed_by_peer');
    } else if (data.type === 'CANCEL') {
      this.handleCancel();
    }
  }

  // --- SENDER: INITIATE HANDSHAKE ---
  requestTransfer(file, senderName = 'Android Device') {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    this.activeTransfer = {
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || 'application/octet-stream',
      totalChunks,
      currentChunk: 0,
      startTime: null,
      bytesTransferred: 0
    };

    this.sendPayload({
      type: 'HANDSHAKE_REQUEST',
      senderName,
      file: {
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        totalChunks
      }
    });

    this.emit('handshake_waiting');
  }

  // --- SENDER: STREAMING CHUNKS WITH BACKPRESSURE ---
  async startStreaming() {
    if (!this.activeTransfer || !this.activeTransfer.file) return;

    this.isPaused = false;
    this.isCancelled = false;
    this.activeTransfer.startTime = Date.now();
    this.startSpeedTracker();
    this.emit('transfer_started', this.activeTransfer);

    const file = this.activeTransfer.file;
    const totalChunks = this.activeTransfer.totalChunks;
    let chunkIndex = this.activeTransfer.currentChunk || 0;

    const dataChannel = this.connection?.dataChannel;
    if (dataChannel) {
      dataChannel.bufferedAmountLowThreshold = BUFFERED_AMOUNT_LOW_THRESHOLD;
    }

    while (chunkIndex < totalChunks && !this.isCancelled) {
      if (this.isPaused) {
        await new Promise((resolve) => {
          this.resumeResolve = resolve;
        });
      }

      // Check backpressure on RTCDataChannel
      if (dataChannel && dataChannel.bufferedAmount > BUFFERED_AMOUNT_HIGH_THRESHOLD) {
        await new Promise((resolve) => {
          const onLow = () => {
            dataChannel.removeEventListener('bufferedamountlow', onLow);
            resolve();
          };
          dataChannel.addEventListener('bufferedamountlow', onLow);
        });
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      const buffer = await slice.arrayBuffer();

      // Convert ArrayBuffer to base64 or send directly
      this.sendPayload({
        type: 'CHUNK',
        index: chunkIndex,
        total: totalChunks,
        data: Array.from(new Uint8Array(buffer))
      });

      chunkIndex++;
      this.activeTransfer.currentChunk = chunkIndex;
      this.activeTransfer.bytesTransferred = end;
      this.bytesTransferredWindow += (end - start);

      const progress = (end / file.size) * 100;
      this.emit('transfer_progress', {
        progress,
        bytesTransferred: end,
        totalBytes: file.size,
        currentChunk: chunkIndex,
        totalChunks,
        speed: this.currentSpeed,
        eta: this.calculateETA(file.size - end)
      });

      // Yield slightly to prevent blocking main UI thread on high-speed transfers
      if (chunkIndex % 8 === 0) {
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    if (!this.isCancelled && chunkIndex >= totalChunks) {
      this.stopSpeedTracker();
      this.emit('transfer_completed', {
        fileName: file.name,
        fileSize: file.size,
        duration: (Date.now() - this.activeTransfer.startTime) / 1000
      });
    }
  }

  // --- RECEIVER: CHUNK ASSEMBLY & DOWNLOAD ---
  handleReceivedChunk(chunkMsg) {
    if (!this.activeTransfer) return;

    const { index, total, data } = chunkMsg;
    const uint8 = new Uint8Array(data);
    this.activeTransfer.chunks[index] = uint8;
    this.activeTransfer.receivedChunks++;
    this.activeTransfer.bytesTransferred += uint8.length;
    this.bytesTransferredWindow += uint8.length;

    const progress = (this.activeTransfer.receivedChunks / total) * 100;
    this.emit('transfer_progress', {
      progress,
      bytesTransferred: this.activeTransfer.bytesTransferred,
      totalBytes: this.activeTransfer.fileSize,
      currentChunk: this.activeTransfer.receivedChunks,
      totalChunks: total,
      speed: this.currentSpeed,
      eta: this.calculateETA(this.activeTransfer.fileSize - this.activeTransfer.bytesTransferred)
    });

    if (this.activeTransfer.receivedChunks >= total) {
      this.stopSpeedTracker();
      const blob = new Blob(this.activeTransfer.chunks, { type: this.activeTransfer.fileType });
      const downloadUrl = URL.createObjectURL(blob);

      this.emit('transfer_completed', {
        fileName: this.activeTransfer.fileName,
        fileSize: this.activeTransfer.fileSize,
        fileType: this.activeTransfer.fileType,
        downloadUrl,
        duration: (Date.now() - this.activeTransfer.startTime) / 1000
      });

      // Auto-trigger download
      this.triggerDownload(downloadUrl, this.activeTransfer.fileName);
    }
  }

  triggerDownload(url, fileName) {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // --- CONTROLS: PAUSE / RESUME / CANCEL ---
  pauseTransfer() {
    this.isPaused = true;
    this.sendPayload({ type: 'PAUSE' });
    this.emit('transfer_paused');
  }

  resumeTransfer() {
    this.isPaused = false;
    this.sendPayload({ type: 'RESUME' });
    if (this.resumeResolve) {
      this.resumeResolve();
      this.resumeResolve = null;
    }
    this.emit('transfer_resumed');
  }

  cancelTransfer() {
    this.isCancelled = true;
    this.sendPayload({ type: 'CANCEL' });
    this.handleCancel();
  }

  handleCancel() {
    this.stopSpeedTracker();
    this.activeTransfer = null;
    this.isPaused = false;
    this.emit('transfer_cancelled');
  }

  // --- SPEED TRACKER & ETA ---
  startSpeedTracker() {
    this.bytesTransferredWindow = 0;
    this.lastSpeedCheck = Date.now();
    this.currentSpeed = 0;

    if (this.speedInterval) clearInterval(this.speedInterval);
    this.speedInterval = setInterval(() => {
      const now = Date.now();
      const timeElapsed = (now - this.lastSpeedCheck) / 1000;
      if (timeElapsed > 0) {
        this.currentSpeed = this.bytesTransferredWindow / timeElapsed;
        this.bytesTransferredWindow = 0;
        this.lastSpeedCheck = now;
      }
    }, 500);
  }

  stopSpeedTracker() {
    if (this.speedInterval) {
      clearInterval(this.speedInterval);
      this.speedInterval = null;
    }
    this.currentSpeed = 0;
  }

  calculateETA(remainingBytes) {
    if (!this.currentSpeed || this.currentSpeed <= 0) return 0;
    return remainingBytes / this.currentSpeed;
  }

  cleanupPeer() {
    this.stopSpeedTracker();
    this.stopReceiverBeacon();
    if (this.connection) {
      try { this.connection.close(); } catch {}
      this.connection = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
  }

  destroy() {
    this.cleanupPeer();
    if (this.broadcast) {
      try { this.broadcast.close(); } catch {}
    }
  }
}
