const STORAGE_KEY = 'filebridge_transfer_history';

export const historyService = {
  getHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  },

  addRecord: (record) => {
    try {
      const history = historyService.getHistory();
      const newRecord = {
        id: record.id || 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        fileName: record.fileName || 'Unknown File',
        fileSize: record.fileSize || 0,
        direction: record.direction || 'sent', // 'sent' | 'received'
        status: record.status || 'completed', // 'completed' | 'interrupted' | 'failed'
        peerId: record.peerId || 'Unknown Peer',
        peerName: record.peerName || 'Remote Device',
        timestamp: record.timestamp || Date.now(),
        avgSpeedMBs: record.avgSpeedMBs || 0,
        durationSeconds: record.durationSeconds || 0,
        blobUrl: record.blobUrl || null
      };

      const updated = [newRecord, ...history].slice(0, 50); // keep last 50
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return newRecord;
    } catch (e) {
      console.error('Failed to save transfer record:', e);
      return null;
    }
  },

  updateRecord: (id, updates) => {
    try {
      const history = historyService.getHistory();
      const updated = history.map(item => item.id === id ? { ...item, ...updates } : item);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update transfer record:', e);
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
  },

  deleteRecord: (id) => {
    try {
      const history = historyService.getHistory();
      const updated = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete history record:', e);
    }
  }
};
