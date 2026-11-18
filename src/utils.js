export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  const mb = bytesPerSec / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB/s`;
  }
  const kb = bytesPerSec / 1024;
  return `${kb.toFixed(0)} KB/s`;
}

export function formatTimeRemaining(seconds) {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--';
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}

export function generateBridgeId() {
  // 6-character clean Crockford base-32 ID (avoiding 0, O, 1, I)
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let id = 'FB-';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export function getFileCategory(mimeType, fileName) {
  const ext = fileName?.split('.').pop()?.toLowerCase() || '';
  if (mimeType?.startsWith('video/') || ['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext)) return 'video';
  if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return 'image';
  if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['pdf', 'doc', 'docx', 'txt', 'epub'].includes(ext)) return 'document';
  return 'file';
}
