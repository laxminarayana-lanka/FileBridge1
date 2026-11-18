# ⚡ FileBridge Web App

> **One ID. One connection. Files transferred anywhere in the world.**

FileBridge is a modern, secure, high-performance peer-to-peer file transfer web application that connects devices directly over the internet using WebRTC DataChannels.

---

## ✨ Features Implemented

1. **Two Connection Methods**:
   - **Unique Sharing ID**: Receiver gets a 4–6 character ID (`FB-XXXX`), sender enters the ID to connect.
   - **QR Code Sharing**: Receiver renders an interactive QR code containing the session token; sender scans to pair.
2. **Mandatory Handshake Protocol**:
   - The receiver must approve the connection request (inspecting sender name, file name, and file size) before any byte of data is transmitted.
3. **Large File Streaming (1 GB to 10 GB+)**:
   - Chunked streaming pipeline with 64 KB slices.
   - Backpressure management (`bufferedAmountLowThreshold`) prevents memory leaks and browser crashes on large files.
4. **Real-time Transfer Dashboard**:
   - Live speedometer (MB/s).
   - Time remaining (ETA countdown).
   - Visual chunk map showing active blocks streaming in real time.
   - Interactive **Pause**, **Resume**, and **Cancel** controls.
5. **Transfer History**:
   - Saved locally in browser storage with file metadata, durations, and average speeds.
6. **Speed Test & Benchmark Simulator**:
   - Built-in simulator allowing instant testing of 1 GB, 2 GB, 5 GB, and 10 GB transfers across 5G, Wi-Fi 6, 4G, and rural networks.

---

## 🚀 Running the App Locally

```bash
cd filebridge
npm run dev
```

Open your browser to the URL printed (default `http://localhost:3000`).

### Testing Between Two Devices
1. Open FileBridge on **Device A** (or Tab 1) $\rightarrow$ Click **"Receive Files"**. Note the Sharing ID or QR code.
2. Open FileBridge on **Device B** (or Tab 2) $\rightarrow$ Click **"Send Files"** $\rightarrow$ Choose or drag a file $\rightarrow$ Enter Device A's ID $\rightarrow$ Click **"Connect & Request Transfer"**.
3. On Device A, click **"Accept & Download"** on the incoming request modal.
4. Watch the real-time speedometer, progress bar, and chunk map stream!
