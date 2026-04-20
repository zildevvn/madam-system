import React from 'react';

const AdminTelemetry = ({ testPrinter, testingPrinter, testWebsocket, testingWS, setLogs, logs }) => {
    return (
        <div className="bg-[#0a0f1e] rounded-[40px] sm:rounded-[56px] shadow-2xl overflow-hidden flex flex-col border border-white/5 flex-1 relative group">
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="p-8 sm:p-10 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-4 tracking-tight">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500/50 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></span>
                    </span>
                    Node Telemetry
                </h2>
            </div>

            <div className="p-6 sm:p-10 space-y-6 sm:space-y-8 flex-1 font-mono leading-relaxed overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] sm:rounded-[32px] bg-white/[0.03] border border-white/5 group/link hover:bg-white/[0.06] hover:border-orange-500/30 transition-all duration-300 gap-4 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-hover/link:animate-pulse shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[#475569] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Terminal</span>
                                <span className="text-white text-[13px] font-bold tracking-tight">LAN_TX_01</span>
                            </div>
                        </div>
                        <button
                            onClick={testPrinter}
                            disabled={testingPrinter}
                            className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-orange-500/20 border-none active:scale-95"
                        >
                            {testingPrinter ? 'Probing...' : 'Test Link'}
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[24px] sm:rounded-[32px] bg-white/[0.03] border border-white/5 group/link hover:bg-white/[0.06] hover:border-blue-500/30 transition-all duration-300 gap-4 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover/link:animate-pulse shadow-sm">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[#475569] text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-0.5">Broadcaster</span>
                                <span className="text-white text-[13px] font-bold tracking-tight">WS_PULSE_LIVE</span>
                            </div>
                        </div>
                        <button
                            onClick={testWebsocket}
                            disabled={testingWS}
                            className="w-full sm:w-auto px-5 py-2.5 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-blue-500/20 border-none active:scale-95"
                        >
                            {testingWS ? 'Syncing...' : 'Live Test'}
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-600 text-[9px] font-bold uppercase tracking-[0.3em]">Execution Stack</span>
                        <button onClick={() => setLogs([])} className="text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest bg-transparent border-none p-0 cursor-pointer">Clear</button>
                    </div>
                    <div className="bg-black/60 rounded-[32px] p-6 sm:p-8 h-48 sm:h-64 overflow-y-auto space-y-3 shadow-inner border border-white/5 custom-scrollbar-hidden flex flex-col-reverse backdrop-blur-xl">
                        {logs.length === 0 && <div className="text-slate-700 italic text-[10px] h-full flex items-center justify-center">Null telemetry...</div>}
                        {logs.map((log, idx) => (
                            <div key={idx} className={`text-[10px] py-1 block leading-relaxed ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-blue-400'}`}>
                                <span className="text-[#334155] font-black mr-3 tabular-nums">[{log.time}]</span>
                                <span className="font-bold opacity-80">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTelemetry;
