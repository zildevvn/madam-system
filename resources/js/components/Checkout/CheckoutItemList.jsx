import React from 'react';
import ProductItem from '../ProductItem';

const CheckoutItemList = ({
    selectedItems,
    handleUpdateQuantity,
    handleUpdateNote,
    guestCount,
    onUpdateGuestCount,
    isSplitMode,
    splitItems,
    onToggleSplitItem
}) => {
    return (
        <main className="px-2 pt-4 max-w-2xl mx-auto space-y-4">
            <div className="list-products bg-white rounded-md shadow-sm py-5 px-4 mb-4">
                {selectedItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Chưa có món nào được chọn</p>
                ) : (
                    <>
                        {!isSplitMode && (
                            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                                <label className='flex-shrink-0 font-bold text-gray-700'>Số lượng khách:</label>
                                <input 
                                    className='w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500' 
                                    type="number" 
                                    min="1"
                                    placeholder="Số lượng khách" 
                                    value={guestCount}
                                    onChange={(e) => onUpdateGuestCount(e.target.value)}
                                />
                            </div>
                        )}

                        {isSplitMode && (
                            <div className="mb-4 bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <p className="text-xs text-orange-700 font-bold uppercase tracking-tight">Chế độ tách đơn</p>
                                <p className="text-[11px] text-orange-600 mt-0.5">Chọn những món muốn tách sang hóa đơn mới.</p>
                            </div>
                        )}

                        {selectedItems.map((item) => {
                            const isSelected = splitItems?.some(i => i.product_id === item.id);
                            return (
                                <div key={item.id} className="flex items-start gap-3">
                                    {isSplitMode && (
                                        <div 
                                            onClick={() => onToggleSplitItem(item)}
                                            className={`mt-4 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}
                                        >
                                            {isSelected && (
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <ProductItem
                                            item={item}
                                            onUpdateQuantity={handleUpdateQuantity}
                                            onUpdateNote={handleUpdateNote}
                                            showNoteButton={!isSplitMode}
                                            isReadOnly={isSplitMode}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </main>
    );
};

export default React.memo(CheckoutItemList);
