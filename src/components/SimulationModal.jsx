import React, { useState } from 'react';
import { X, PlayCircle, Wifi, Signal, Zap, Shield, Sparkles } from 'lucide-react';
import { formatBytes } from '../utils';

export default function SimulationModal({ isOpen, onClose, onStartSimulation }) {
  const [fileSizeGB, setFileSizeGB] = useState(5); // 1, 5, 10 GB
  const [networkProfile, setNetworkProfile] = useState('5g'); // '5g' | 'wifi' | '4g' | 'rural'

  if (!isOpen) return null;

  const profiles = [
    { id: '5g', name: '5G Ultra Wideband', speed: '120 MB/s', icon: Zap, color: 'text-amber-600' },
    { id: 'wifi', name: 'Wi-Fi 6 Fiber', speed: '55 MB/s', icon: Wifi, color: 'text-[#004d61]' },
    { id: '4g', name: '4G LTE Mobile', speed: '18 MB/s', icon: Signal, color: 'text-[#0b57d0]' },
    { id: 'rural', name: 'Rural / High Jitter', speed: '3.5 MB/s', icon: Signal, color: 'text-rose-600' }
  ];

  const handleStart = () => {
    onStartSimulation({
      fileSizeGB,
      networkProfile
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-[#e2e8f0] p-6 sm:p-8 shadow-xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-[#e2e8f0]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-[#c2e7ff] text-[#004d61] flex items-center justify-center">
              <PlayCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1f2937]">Speed Benchmark Simulator</h3>
              <p className="text-xs text-[#64748b]">Simulate large file transfers with realistic speed profiles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-[#64748b] hover:text-[#1e293b] hover:bg-[#f1f5f9] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File Size Selection */}
        <div className="my-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-2">
            Select Test File Size
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 5, 10].map((size) => (
              <button
                key={size}
                onClick={() => setFileSizeGB(size)}
                className={`py-3 rounded-2xl border text-center transition-all ${
                  fileSizeGB === size
                    ? 'border-[#004d61] bg-[#e9eef6] text-[#004d61] font-bold shadow-xs'
                    : 'border-[#cbd5e1] bg-[#f8fafd] hover:bg-white text-[#475569]'
                }`}
              >
                <div className="text-base font-extrabold">{size} GB</div>
                <div className="text-[10px] text-[#64748b] mt-0.5">Test File</div>
              </button>
            ))}
          </div>
        </div>

        {/* Network Conditions */}
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4b5563] mb-2">
            Simulated Network Connection
          </label>
          <div className="space-y-2">
            {profiles.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => setNetworkProfile(p.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    networkProfile === p.id
                      ? 'border-[#004d61] bg-[#e9eef6]'
                      : 'border-[#e2e8f0] bg-[#f8fafd] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl bg-white border border-[#e2e8f0] ${p.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1f2937]">{p.name}</p>
                      <p className="text-xs text-[#64748b]">Simulated throughput ~{p.speed}</p>
                    </div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    networkProfile === p.id ? 'border-[#004d61] bg-[#004d61]' : 'border-[#cbd5e1]'
                  }`}>
                    {networkProfile === p.id && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 px-6 rounded-full bg-[#004d61] hover:bg-[#003947] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>Launch {fileSizeGB} GB Speed Test</span>
        </button>

      </div>
    </div>
  );
}
