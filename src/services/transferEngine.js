import Peer from 'peerjs';

const CHUNK_SIZE = 64 * 1024; // 64 KB per chunk (optimal for WebRTC MTU & SCTP fragmentation)
const BUFFERED_AMOUNT_HIGH_THRESHOLD = 4 * 1024 * 1024; // 4 MB backpressure threshold
const BUFFERED_AMOUNT_LOW_THRESHOLD = 1024 * 1024; // 1 MB resume threshold

// Public global STUN and TURN relay servers for guaranteed peer connectivity across 4G/5G and NATs
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Free public TURN relays from Open Relay Project (metered.ca) for symmetric NAT & mobile cellular networks
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

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

    const normalizedId = (customId || 'FB-' + Math.random().toString(36).substring(2, 6).toUpperCase())
      .replace(/[^A-Z0-9-]/gi, '')
      .toUpperCase();
    this.myBridgeId = normalizedId;

    try {
      this.peer = new Peer(normalizedId.toLowerCase(), {
        config: ICE_CONFIG,
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
        console.warn('PeerJS receiver notice:', err.type, err.message);
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
    this.targetBridgeId = normalizedTarget;

    return new Promise((resolve, reject) => {
      let isResolved = false;
      const tempSenderId = 'fb-' + Math.random().toString(36).substring(2, 9);

      // Connection timeout: 20 seconds for cross-network WebRTC STUN/TURN negotiation
      const timeout = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          // Check if local same-browser receiver is present
          if (this.broadcast) {
            this.broadcast.postMessage({
              type: 'PING_RECEIVER',
              targetId: normalizedTarget,
              senderId: tempSenderId,
              senderName
            });
          }
          reject(new Error(`Connection to ${normalizedTarget} timed out. Ensure the receiver is online and has "Receive" open.`));
        }
      }, 20000);

      try {
        this.peer = new Peer(tempSenderId, {
          config: ICE_CONFIG,
          debug: 1
        });

        this.peer.on('open', () => {
          this.emit('connection_status', 'Contacting receiver...');

          const conn = this.peer.connect(normalizedTarget.toLowerCase(), {
            reliable: true
          });

          this.connection = conn;
          this.setupConnectionHandlers(conn);

          conn.on('open', () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              this.emit('connection_status', 'Connected! Requesting approval...');
              resolve(conn);
            }
          });

          conn.on('error', (err) => {
            console.error('DataConnection error:', err);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeout);
              reject(err);
            }
          });
        });

        this.peer.on('error', (err) => {
          console.warn('Peer error during connect:', err);
          // If PeerJS reports peer-unavailable, check local BroadcastChannel first (same machine test)
          if (this.broadcast) {
            this.broadcast.postMessage({
              type: 'PING_RECEIVER',
              targetId: normalizedTarget,
              senderId: tempSenderId,
              senderName
            });
          }
          if (!isResolved && err.type === 'peer-unavailable') {
            isResolved = true;
            clearTimeout(timeout);
            reject(new Error(`Receiver "${normalizedTarget}" was not found. Please verify the code on the receiver's screen.`));
          }
        });

      } catch (err) {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeout);
          reject(err);
        }
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
    } else if (msg.type === 'PING_RECEIVER' && this.role === 'receiver' && msg.targetId === this.myBridgeId) {
      this.broadcast.postMessage({
        type: 'RECEIVER_PONG',
        targetId: msg.senderId,
        receiverId: this.myBridgeId
      });
    } else if (msg.type === 'RECEIVER_PONG' && this.role === 'sender') {
      this.emit('connected_via_bus');
    } else if (msg.type === 'DATA_ENVELOPE') {
      this.handleIncomingData(msg.payload);
    } else if (msg.type === 'BINARY_ENVELOPE') {
      this.handleIncomingData(msg.buffer);
    }
  }

  // Send control JSON or binary packet
  sendPayload(payload) {
    if (this.connection && this.connection.open) {
      this.connection.send(payload);
    } else if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'DATA_ENVELOPE',
        payload
      });
    }
  }

  // Send raw high-speed binary buffer directly
  sendBinaryChunk(arrayBuffer) {
    if (this.connection && this.connection.open) {
      this.connection.send(arrayBuffer);
    } else if (this.broadcast) {
      this.broadcast.postMessage({
        type: 'BINARY_ENVELOPE',
        buffer: arrayBuffer
      });
    }
  }

  // --- INCOMING DATA DISPATCHER ---
  handleIncomingData(data) {
    // 1. Binary Packet (Magic byte 0x42)
    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data) || (data && data.byteLength)) {
      const buffer = data instanceof ArrayBuffer ? data : data.buffer;
      const view = new DataView(buffer, data.byteOffset || 0, data.byteLength || buffer.byteLength);
      
      if (view.byteLength >= 13 && view.getUint8(0) === 0x42) {
        const chunkIndex = view.getUint32(1);
        const totalChunks = view.getUint32(5);
        const chunkLength = view.getUint32(9);
        const rawSlice = new Uint8Array(buffer, (data.byteOffset || 0) + 13, chunkLength);
        
        this.handleReceivedBinaryChunk(chunkIndex, totalChunks, rawSlice);
        return;
      }
    }

    // 2. Control Messages (JSON object)
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return;
      }
    }

    if (!data || typeof data !== 'object') return;

    if (data.type === 'HANDSHAKE_REQUEST') {
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
    } else if (data.type === 'PAUSE') {
      this.isPaused = true;
      this.emit('paused_by_peer');
    } else if (data.type === 'RESUME') {
      this.isPaused = false;
      this.emit('resumed_by_peer');
    } else if (data.type === 'CANCEL') {
      this.handleCancel();
    } else if (data.type === 'TRANSFER_ACK') {
      if (this.role === 'sender') {
        this.emit('transfer_completed_ack', data);
      }
    }
  }

  // --- SENDER: INITIATE HANDSHAKE ---
  requestTransfer(file, senderName = 'Sender Device') {
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

  // --- SENDER: STREAMING CHUNKS DIRECTLY IN RAW BINARY WITH BACKPRESSURE ---
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

      // Hardware Flow Control / Backpressure: if socket buffer is full, wait for it to drain
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
      const sliceBuffer = await slice.arrayBuffer();

      // Pack into 13-byte header + raw binary data (ZERO JSON overhead!)
      // [Byte 0: 0x42 (magic), Bytes 1-4: chunkIndex, Bytes 5-8: totalChunks, Bytes 9-12: length, Bytes 13+: raw bytes]
      const packet = new Uint8Array(13 + sliceBuffer.byteLength);
      packet[0] = 0x42;
      const view = new DataView(packet.buffer);
      view.setUint32(1, chunkIndex);
      view.setUint32(5, totalChunks);
      view.setUint32(9, sliceBuffer.byteLength);
      packet.set(new Uint8Array(sliceBuffer), 13);

      this.sendBinaryChunk(packet.buffer);

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

  // --- RECEIVER: ASSEMBLE CHUNKS DIRECTLY FROM RAW BINARY ---
  handleReceivedBinaryChunk(index, total, rawSlice) {
    if (!this.activeTransfer) return;

    this.activeTransfer.chunks[index] = rawSlice;
    this.activeTransfer.receivedChunks++;
    this.activeTransfer.bytesTransferred += rawSlice.length;
    this.bytesTransferredWindow += rawSlice.length;

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

      // Send confirmation to sender so both devices alert simultaneously
      this.sendPayload({
        type: 'TRANSFER_ACK',
        fileName: this.activeTransfer.fileName,
        fileSize: this.activeTransfer.fileSize
      });

      this.emit('transfer_completed', {
        fileName: this.activeTransfer.fileName,
        fileSize: this.activeTransfer.fileSize,
        fileType: this.activeTransfer.fileType,
        downloadUrl,
        duration: (Date.now() - this.activeTransfer.startTime) / 1000
      });

      this.triggerDownload(downloadUrl, this.activeTransfer.fileName);
    }
  }

  triggerDownload(url, fileName) {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn('Auto download notice:', e);
    }
  }

  // --- CONTROLS ---
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
