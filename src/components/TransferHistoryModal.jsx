import React, { useState } from 'react';
import { X, History, ArrowUpRight, ArrowDownLeft, Trash2, HardDrive, CheckCircle2, Clock } from 'lucide-react';
import { formatBytes, formatSpeed } from '../utils';

export default function TransferHistoryModal({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onDeleteRecord
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'sent' | 'received'

  if (!isOpen) return null;

  const filteredHistory = history.filter((item) => {
    if (filter === 'sent') return item.direction === 'sent';
    if (filter === 'received') return item.direction === 'received';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1f2937]">Transfer History</h3>
              <p className="text-xs text-[#64748b]">Past peer-to-peer file transfers</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-2 rounded-full text-[#64748b] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#64748b] hover:text-[#1f2937] hover:bg-[#f1f5f9] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 my-4">
          {['all', 'sent', 'received'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`py-1.5 px-4 rounded-full text-xs font-semibold capitalize transition-all ${
                filter === type
                  ? 'bg-[#004d61] text-white shadow-xs'
                  : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1e293b]'
              }`}
            >
              {type} ({type === 'all' ? history.length : history.filter(h => h.direction === type).length})
            </button>
          ))}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-[#64748b]">
              <HardDrive className="h-12 w-12 mx-auto mb-2 text-[#cbd5e1]" />
              <p className="text-sm font-semibold text-[#1e293b]">No transfers recorded yet</p>
              <p className="text-xs mt-1">Transferred files will show up here automatically</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#f8fafd] hover:bg-[#f0f4f9] border border-[#e2e8f0] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.direction === 'sent'
                      ? 'bg-[#c2e7ff] text-[#004d61]'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {item.direction === 'sent' ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-bold text-[#1f2937] truncate">{item.fileName}</p>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white border border-[#cbd5e1] text-[#475569]">
                        {item.direction}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-[#64748b]">
                      <span className="font-mono text-[#004d61] font-semibold">{formatBytes(item.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      {item.durationSeconds && (
                        <>
                          <span>•</span>
                          <span>{Math.ceil(item.durationSeconds)}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteRecord(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-rose-50 text-[#64748b] hover:text-rose-600 transition-all ml-2"
                  title="Delete record"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
