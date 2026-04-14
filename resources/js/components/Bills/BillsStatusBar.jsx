import React from 'react';

const BillsStatusBar = ({ statusCounts, isBar = false }) => (
    <div className="bg-white py-3 border-t border-b border-gray-200">
        <div className="flex items-center gap-2 w-full max-w-[1200px] mx-auto px-[20px] justify-between overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4">
                <p className="item-info flex items-center gap-1 m-0 text-sm text-gray-500 font-bold">
                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                    <span>1-5p: <span className="text-gray-900">{statusCounts.active}</span></span>
                </p>
                {!isBar && (
                    <>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-blue-500 font-bold">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            <span>5-10p: <span className="text-gray-900">{statusCounts.alert}</span></span>
                        </p>
                        <p className="item-info flex items-center gap-1 m-0 text-sm text-yellow-500 font-bold">
                            <span className="w-2 h-2 mdt-bg-yellow rounded-full"></span>
                            <span>10-20p: <span className="text-gray-900">{statusCounts.warning}</span></span>
                        </p>
                    </>
                )}
                <p className="item-info flex items-center gap-1 m-0 text-sm text-red-500 font-bold">
                    <span className="w-2 h-2 mdt-bg-red rounded-full"></span>
                    <span>{isBar ? '> 5p' : '> 20p'}: <span className="text-gray-900">{statusCounts.critical}</span></span>
                </p>
            </div>
        </div>
    </div>
);

export default BillsStatusBar;
