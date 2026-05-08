import React from 'react';

/**
 * HeaderBanner Component
 * [WHY] Isolated the marquee notification banner UI into its own component.
 * [RULE] Must support infinite smooth scrolling and be easy to notice without disruption.
 */
const HeaderBanner = ({ latestMessage, showBanner }) => {
    if (!showBanner || !latestMessage) return null;

    return (
        <div className="bg-orange-500 text-white py-1.5 overflow-hidden border-b border-orange-600 shadow-sm">
            <div className="w-full flex items-center justify-center whitespace-nowrap">
                {[1].map((i) => (
                    <React.Fragment key={i}>
                        <div className="flex items-center gap-3 px-8">
                            <span className="bg-red-500 flex items-center gap-1.5 font-black uppercase tracking-[0.15em] text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                </svg>
                                Message
                            </span>
                            <span className="text-[11px] md:text-[12px] font-bold uppercase tracking-wide">
                                {latestMessage.user?.name}: {latestMessage.content}
                            </span>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default HeaderBanner;
