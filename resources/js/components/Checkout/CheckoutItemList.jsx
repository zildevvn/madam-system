import React, { useMemo } from 'react';
import ProductItem from '../ProductItem';

const CheckoutItemList = ({
    selectedItems,
    originalItems = {},
    handleUpdateQuantity,
    handleUpdateNote,
    guestCount,
    onUpdateGuestCount,
    isSplitMode,
    selectedSplitItems,
    toggleSplitItem,
    handleUpdateSplitQuantity
}) => {
    // [WHY] Group items visually by product and note so that when the backend splits 
    // quantities into multiple rows (for different statuses like pending/served), 
    // they still appear as a single unified item on the staff-order page.
    const groupedSelectedItems = useMemo(() => {
        const groups = {};
        selectedItems.forEach(item => {
            // Group by split status, product_id, and note.
            const groupKey = item.isSplit 
                ? `split-${item.id}` 
                : (item.product_id ? `prod-${item.product_id}-${item.note || ''}` : `custom-${item.name}-${item.note || ''}`);
            
            const itemKey = item.order_item_id || item.id;
            const originalQty = originalItems[itemKey]?.quantity || 0;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    ...item,
                    groupKey,
                    originalIds: [item.id],
                    originalOrderItemIds: [item.order_item_id || item.id],
                    totalQuantity: item.quantity,
                    originalTotalQuantity: originalQty,
                };
            } else {
                groups[groupKey].originalIds.push(item.id);
                groups[groupKey].originalOrderItemIds.push(item.order_item_id || item.id);
                groups[groupKey].totalQuantity += item.quantity;
                groups[groupKey].originalTotalQuantity += originalQty;
            }
        });
        return Object.values(groups);
    }, [selectedItems, originalItems]);

    // [WHY] Distribute quantity updates across the underlying raw items.
    // When adding, we add to the first item (backend will split it automatically).
    // When removing, we remove from the last item (typically the newest/pending one).
    const onGroupUpdateQuantity = (groupKey, newTotalQty) => {
        const group = groupedSelectedItems.find(g => g.groupKey === groupKey);
        if (!group) return;

        const diff = newTotalQty - group.totalQuantity;
        if (diff === 0) return;

        if (diff > 0) {
            // Increase the FIRST item in the group
            const firstId = group.originalIds[0];
            const firstItem = selectedItems.find(i => i.id === firstId);
            if (firstItem) {
                handleUpdateQuantity(firstId, firstItem.quantity + diff);
            }
        } else {
            // Decrease from the LAST item backwards
            let remainingDiff = -diff;
            for (let i = group.originalIds.length - 1; i >= 0; i--) {
                const id = group.originalIds[i];
                const item = selectedItems.find(it => it.id === id);
                if (!item) continue;
                
                if (item.quantity > remainingDiff) {
                    handleUpdateQuantity(id, item.quantity - remainingDiff);
                    break;
                } else {
                    handleUpdateQuantity(id, 0); // removes it
                    remainingDiff -= item.quantity;
                    if (remainingDiff === 0) break;
                }
            }
        }
    };

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

                        {groupedSelectedItems.map((group, index) => {
                            // Determine if any item in this group is split
                            const splitItem = selectedSplitItems.find(si => {
                                const siId = String(si.order_item_id || si.id);
                                return group.originalOrderItemIds.some(id => String(id) === siId);
                            });
                            const isSelected = !!splitItem;

                            return (
                                <div key={group.groupKey || index} className="flex items-start gap-3">
                                    {isSplitMode && !group.isSplit && group.order_item_id && (
                                        <div className="flex flex-col items-center gap-2 pt-4">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSplitItem(group)}
                                                className="w-5 h-5 accent-orange-500 cursor-pointer"
                                            />
                                            {isSelected && group.totalQuantity > 1 && (
                                                <div className="flex items-center bg-gray-100 rounded-full p-0.5 border border-gray-200 shadow-sm mt-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateSplitQuantity(splitItem.order_item_id || splitItem.id, Math.max(1, splitItem.quantity - 1));
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
                                                            handleUpdateSplitQuantity(splitItem.order_item_id || splitItem.id, Math.min(group.totalQuantity, splitItem.quantity + 1));
                                                        }}
                                                        disabled={splitItem.quantity >= group.totalQuantity}
                                                        className={`w-6 h-6 flex items-center justify-center rounded-full border-none transition-all ${splitItem.quantity >= group.totalQuantity ? 'bg-transparent text-gray-300' : 'bg-orange-500 text-white shadow-md active:scale-90 cursor-pointer'}`}
                                                    >
                                                        <svg width="12" height="12" strokeWidth="3" viewBox="0 0 24 24" fill="none"><path d="M6 12H12M18 12H12M12 12V6M12 12V18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <ProductItem
                                            item={{ ...group, quantity: group.totalQuantity }}
                                            originalQuantity={group.originalTotalQuantity}
                                            onUpdateQuantity={(id, newQty) => onGroupUpdateQuantity(group.groupKey, newQty)}
                                            onUpdateNote={(id, note) => handleUpdateNote(group.originalIds[0], note)}
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
