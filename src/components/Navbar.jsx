import React from 'react';
import { Menu, Search, History, PlayCircle, Shield, Globe } from 'lucide-react';

export default function Navbar({ onOpenHistory, historyCount, onOpenSimulation, onToggleMenu }) {
  return (
    <header className="sticky top-0 z-30 bg-[#f8fafd] border-b border-[#e2e8f0]/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left: Google Files Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onToggleMenu}
            className="p-2 rounded-full hover:bg-[#e9eef6] text-[#475569] transition-colors"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            {/* Google Files Iconic 4-Color Folder Logo */}
            <div className="w-8 h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8">
                {/* Folder back */}
                <path d="M40 12H24L20 8H8C5.79 8 4 9.79 4 12V36C4 38.21 5.79 40 8 40H40C42.21 40 44 38.21 44 36V16C44 13.79 42.21 12 40 12Z" fill="#1A73E8"/>
                {/* Folder tab accents */}
                <path d="M4 36V20C4 17.79 5.79 16 8 16H40C42.21 16 44 17.79 44 20V36H4Z" fill="#FFFFFF" fillOpacity="0.15"/>
                {/* 4 Colored Corners/Tabs */}
                <circle cx="14" cy="22" r="3" fill="#EA4335" />
                <circle cx="22" cy="22" r="3" fill="#FBBC04" />
                <circle cx="30" cy="22" r="3" fill="#34A853" />
                <circle cx="38" cy="22" r="3" fill="#4285F4" />
              </svg>
            </div>

            <div className="flex items-baseline space-x-1.5">
              <span className="font-semibold text-xl tracking-tight text-[#1f2937]">Files</span>
              <span className="text-[11px] font-medium text-[#004d61] bg-[#c2e7ff] px-2 py-0.5 rounded-full hidden sm:inline-block">
                FileBridge
              </span>
            </div>
          </div>
        </div>

        {/* Center: Search pill bar (resembling the second screenshot) */}
        <div className="flex-1 max-w-sm hidden md:flex items-center px-3.5 py-1.5 bg-[#ffffff] border border-[#e2e8f0] rounded-full shadow-sm hover:border-[#cbd5e1] transition-all">
          <Search className="h-4 w-4 text-[#64748b] mr-2 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder="Search in Files"
            className="w-full bg-transparent text-xs text-[#1e293b] placeholder-[#64748b] outline-none cursor-default"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Speed Demo button */}
          <button
            onClick={onOpenSimulation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-[#e9eef6] hover:bg-[#dbeafe] text-[#004d61] text-xs font-semibold transition-all border border-[#cbd5e1]/40"
            title="Benchmark 1 GB to 10 GB transfer speed"
          >
            <PlayCircle className="h-3.5 w-3.5 text-[#004d61]" />
            <span className="hidden sm:inline">Speed Test</span>
          </button>

          {/* History button */}
          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full bg-[#e9eef6] hover:bg-[#dbeafe] text-[#1e293b] text-xs font-semibold transition-all border border-[#cbd5e1]/40"
            title="Transfer History"
          >
            <History className="h-4 w-4 text-[#475569]" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-[#004d61] text-[10px] font-bold text-white flex items-center justify-center">
                {historyCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
