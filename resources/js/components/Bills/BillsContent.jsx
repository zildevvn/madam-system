import React from 'react';
import ActiveOrderTableList from '../ActiveOrderTableList';
import DelayWarnings from '../DelayWarnings';

const BillsContent = ({
    activeTablesToDisplay,
    activeOrders,
    currentTime,
    handleTableClick,
    allTables,
    error
}) => {
    return (
        <div className="md-management-page__content py-4 md:py-8">
            <div className="w-full max-w-[1240px] mx-auto px-[20px]">
                <div className="grid grid-cols-12 gap-6 md:gap-4">
                    {/* Left: Table List */}
                    <div className="col-span-12 md:col-span-8 lg:col-span-9 bg-gray-50/50 rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        {error && (
                            <div className="w-full bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <ActiveOrderTableList
                            tables={activeTablesToDisplay}
                            orders={activeOrders}
                            currentTime={currentTime}
                            onTableClick={handleTableClick}
                            filterType="food"
                            showNewOrderHighlight={true}
                        />
                    </div>

                    {/* Right: Delay Warnings Sidebar */}
                    <div className="col-span-12 md:col-span-4 lg:col-span-3">
                        <DelayWarnings
                            tables={allTables}
                            orders={activeOrders}
                            currentTime={currentTime}
                            title='Danh sách món'
                            filterType="food"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillsContent;
