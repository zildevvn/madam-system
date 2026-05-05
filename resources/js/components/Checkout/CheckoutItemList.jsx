import React from 'react';
import ProductItem from '../ProductItem';

const CheckoutItemList = ({
    selectedItems,
    handleUpdateQuantity,
    handleUpdateNote,
    guestCount,
    onUpdateGuestCount,
    isSplitMode,
    selectedSplitItems,
    toggleSplitItem,
    handleUpdateSplitQuantity
}) => {
    return (
        <main className="px-2 pt-4 max-w-2xl mx-auto space-y-4">
            <div className="list-products bg-white rounded-md shadow-sm py-5 px-4 mb-4">
                {selectedItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Chưa có món nào được chọn</p>
                ) : (
                    <>
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

                        {selectedItems.map((item, index) => {
                            const itemKey = item.order_item_id || item.id;
                            const splitItem = selectedSplitItems.find(si => si.order_item_id === itemKey);
                            const isSelected = !!splitItem;

                            return (
                                <div key={itemKey || index} className="flex items-start gap-3">
                                    {isSplitMode && (
                                        <div className="flex flex-col items-center gap-2 pt-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSplitItem(item)}
                                                className="w-5 h-5 accent-orange-500 cursor-pointer"
                                            />
                                            {isSelected && item.quantity > 1 && (
                                                <div className="flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200 shadow-sm mt-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateSplitQuantity(itemKey, Math.max(1, splitItem.quantity - 1));
                                                        }}
                                                        disabled={splitItem.quantity <= 1}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-full border-none transition-all ${splitItem.quantity <= 1 ? 'bg-transparent text-gray-300' : 'bg-white text-gray-700 shadow-sm active:scale-90 cursor-pointer'}`}
                                                    >
                                                        <svg width="12" height="12" strokeWidth="2.5" viewBox="0 0 24 24" fill="none"><path d="M6 12H18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                    </button>

                                                    <span className="px-2 font-black text-gray-800 text-[10px] min-w-[18px] text-center">
                                                        {splitItem.quantity}
                                                    </span>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateSplitQuantity(itemKey, Math.min(item.quantity, splitItem.quantity + 1));
                                                        }}
                                                        disabled={splitItem.quantity >= item.quantity}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-full border-none transition-all ${splitItem.quantity >= item.quantity ? 'bg-transparent text-gray-300' : 'bg-orange-500 text-white shadow-md active:scale-90 cursor-pointer'}`}
                                                    >
                                                        <svg width="12" height="12" strokeWidth="3" viewBox="0 0 24 24" fill="none"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                    </button>
                                                </div>
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
