import React from 'react';
import { formatPrice } from '../../shared/utils/formatCurrency';
import ProductItem from '../ProductItem';
import Icon from '../shared/Icon';

/**
 * PaymentItemEditor: Renders the scrollable item list with per-table grouping,
 * table selector, and product search for the Cashier payment modal.
 * [WHY] Shared pre-order items (reservation_item_id) are read-only; individual extras are editable.
 */
const PaymentItemEditor = ({
    selectedTable,
    currentOrder,
    draftItems,
    allProducts,
    allTables = [],
    searchQuery,
    onSearchChange,
    showProductSearch,
    onToggleProductSearch,
    targetTableId,
    onSelectTargetTable,
    handleUpdateQuantity,
    handleUpdateNote,
    handleUpdateItemDiscount,
    handleAddProduct,
    filteredProducts,
    isReadOnly = false,
    isSplitMode = false,
    selectedSplitItems = [],
    onToggleSplitItem,
    onUpdateSplitQuantity
}) => {
    // [WHY] Detect unified group order — has reservation.table_ids for the table selector
    const isUnifiedGroup = currentOrder?.reservation?.type === 'group';
    const groupTableIds = isUnifiedGroup && Array.isArray(currentOrder.reservation.table_ids)
        ? currentOrder.reservation.table_ids.map(id => Number(id)).sort((a, b) => a - b)
        : [];

    // [WHY] Derive table list for the selector:
    // - Unified group: use reservation.table_ids (individual tables)
    // - Staff-merged: use mergedTables string
    const mergedStr = currentOrder?.mergedTables || selectedTable.merged_tables;
    const selectorTableIds = groupTableIds.length > 0
        ? groupTableIds
        : (mergedStr ? mergedStr.split('-').map(s => s.trim()).filter(id => id && !isNaN(parseInt(id))).map(Number) : []);

    // [WHY] Centralized table resolution logic to ensure consistent ID identification
    const dbTableId = selectedTable?.originalTableId || currentOrder?.tableId || currentOrder?.table_id || currentOrder?.table?.id;

    // [WHY] Precompute map of table IDs to display names for O(1) rendering lookups
    const tableMap = React.useMemo(() => {
        const map = new Map();
        for (let i = 0; i < allTables.length; i++) {
            const tbl = allTables[i];
            map.set(tbl.id.toString(), (tbl.name || tbl.id).toString().replace(/^Bàn\s+/i, ''));
        }
        return map;
    }, [allTables]);

    // [WHY] Map IDs to display names (e.g. 47 -> "44")
    const resolveTableLabel = React.useCallback((tid) => {
        if (!tid) return '';
        return tableMap.get(tid.toString()) || tid.toString().replace(/^Bàn\s+/i, '');
    }, [tableMap]);

    // [WHY] Group and consolidate draft items outside JSX to avoid complex nested reduce operations on render
    const groupedAndConsolidatedSections = React.useMemo(() => {
        const groups = draftItems.reduce((acc, item) => {
            let tGroup;
            if (isUnifiedGroup) {
                tGroup = item.reservation_item_id ? 'GROUP' : (item.tableId || 'GROUP');
            } else {
                tGroup = item.tableId || dbTableId || selectedTable?.id || 'GROUP';
            }

            if (!acc[tGroup]) acc[tGroup] = [];
            acc[tGroup].push(item);
            return acc;
        }, {});

        const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
            if (a === 'GROUP') return -1;
            if (b === 'GROUP') return 1;
            return isNaN(a) ? 1 : a - b;
        });

        return sortedEntries.map(([tGroup, tableItems]) => {
            const subtotal = tableItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
            const isSharedSection = tGroup === 'GROUP';
            const displayTableTitle = isSharedSection
                ? `Món chung${groupTableIds.length > 0 ? ` (Bàn ${groupTableIds.map(resolveTableLabel).join('-')})` : ''}`
                : `Bàn ${resolveTableLabel(tGroup)}`;
            const sectionReadOnly = isSharedSection && isUnifiedGroup;

            const consolidatedMap = tableItems.reduce((grp, item) => {
                const k = item.product_id 
                    ? `prod-${item.product_id}-${item.note || ''}-${item.price}-${item.discount || 0}-${item.discountType || 'fixed'}` 
                    : `custom-${item.name}-${item.note || ''}-${item.price}-${item.discount || 0}-${item.discountType || 'fixed'}`;
                if (!grp[k]) {
                    grp[k] = { ...item, mergeKey: k, originalIds: [item.id || item.order_item_id], quantity: item.quantity };
                } else {
                    grp[k].originalIds.push(item.id || item.order_item_id);
                    grp[k].quantity += item.quantity;
                }
                return grp;
            }, {});

            return {
                tGroup,
                subtotal,
                isSharedSection,
                displayTableTitle,
                sectionReadOnly,
                items: Object.values(consolidatedMap)
            };
        });
    }, [draftItems, isUnifiedGroup, dbTableId, selectedTable?.id, groupTableIds, resolveTableLabel]);

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header Content — "Điều chỉnh món" for editable items */}
            {!isReadOnly && (
                <div className="px-6 pt-5 pb-2">
                    <div className="mb-4 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">Điều chỉnh món</p>
                            <button
                                onClick={() => onToggleProductSearch(!showProductSearch)}
                                className={`ml-auto w-6 h-6 rounded-lg ${showProductSearch ? 'bg-gray-200 text-gray-500' : 'bg-orange-500 text-white'} flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-colors`}
                            >
                                <Icon name="plus" className="w-[14px] h-[14px]" size={14} />
                            </button>
                        </div>

                        {/* Table Selector — works for both staff-merged and group reservations */}
                        {selectorTableIds.length > 1 && (
                            <div className="select-tables flex flex-wrap gap-1.5 mb-3 bg-gray-50/80 p-1.5 rounded-xl border border-gray-100">
                                {selectorTableIds.map(id => (
                                    <button
                                        key={id}
                                        onClick={() => onSelectTargetTable(id)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer
                                            ${targetTableId === id
                                                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                                                : 'bg-white text-gray-400 hover:text-gray-600'
                                            }
                                        `}
                                    >
                                        {resolveTableLabel(id)}
                                    </button>
                                ))}
                            </div>
                        )}

                        {showProductSearch && (
                            <div className="relative mb-0">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Tìm món thêm..."
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[16px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
                                />
                                {filteredProducts.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                        {filteredProducts.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleAddProduct(p)}
                                                className="w-full px-4 py-2.5 text-left hover:bg-orange-50 flex items-center justify-between border-none bg-transparent cursor-pointer transition-colors group"
                                            >
                                                <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600">{p.name}</span>
                                                <span className="text-xs font-black text-gray-400">{formatPrice(p.price)}đ</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Scrollable List Content */}
            <div className="px-6 pb-4 overflow-y-auto flex-1 hide-scrollbar min-h-0">
                {draftItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic text-sm">Chưa có món nào.</div>
                ) : (
                    <div className="space-y-1">
                        {groupedAndConsolidatedSections.map(({ tGroup, subtotal, isSharedSection, displayTableTitle, sectionReadOnly, items }) => (
                            <div key={tGroup} className="space-y-1 mb-4 last:mb-0">
                                {/* Section header — always show for unified group, or staff-merged */}
                                {(isUnifiedGroup || mergedStr) && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border italic ${isSharedSection ? 'text-orange-400 bg-orange-50 border-orange-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                                            {displayTableTitle}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-gray-100"></div>
                                        <span className="text-[10px] font-black text-gray-400 tracking-tighter">
                                            {formatPrice(subtotal)}đ
                                        </span>
                                    </div>
                                )}
                                {items.map((item, idx) => {
                                    const actualTableId = item.tableId || dbTableId || selectedTable?.id;
                                    const itemId = item.order_item_id || item.id;
                                    const splitEntry = selectedSplitItems.find(i => i.order_item_id === itemId);
                                    const isSelected = !!splitEntry;
                                    const productItemReadOnly = isReadOnly || sectionReadOnly || isSplitMode;

                                    const itemContext = {
                                        productId: item.product_id || item.id,
                                        tableId: parseInt(actualTableId),
                                        note: item.note || '',
                                        price: item.price,
                                        discount: item.discount,
                                        discountType: item.discountType,
                                    };

                                    return (
                                        <div key={item.mergeKey} className="flex items-center gap-4 py-1">
                                            {isSplitMode && !sectionReadOnly && (
                                                <div className="flex flex-col items-center gap-2 shrink-0">
                                                    <div
                                                        onClick={() => onToggleSplitItem(item)}
                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${isSelected ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-200' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                                                    >
                                                        {isSelected && (
                                                            <Icon name="check" className="w-[14px] h-[14px] text-white" size={14} />
                                                        )}
                                                    </div>
                                                    {isSelected && item.quantity > 1 && (
                                                        <div className="flex flex-col items-center bg-orange-50 rounded-lg p-1 border border-orange-100 shadow-sm">
                                                            <button
                                                                onClick={() => onUpdateSplitQuantity(itemId, Math.min(item.quantity, splitEntry.quantity + 1))}
                                                                disabled={splitEntry.quantity >= item.quantity}
                                                                className="w-5 h-5 flex items-center justify-center text-[12px] font-black text-orange-400 hover:text-orange-600 disabled:opacity-30 border-none bg-transparent cursor-pointer"
                                                            >
                                                                +
                                                            </button>
                                                            <span className="text-[11px] font-black text-orange-600 leading-none py-1">{splitEntry.quantity}</span>
                                                            <button
                                                                onClick={() => onUpdateSplitQuantity(itemId, Math.max(1, splitEntry.quantity - 1))}
                                                                disabled={splitEntry.quantity <= 1}
                                                                className="w-5 h-5 flex items-center justify-center text-[12px] font-black text-orange-400 hover:text-orange-600 disabled:opacity-30 border-none bg-transparent cursor-pointer"
                                                            >
                                                                -
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <ProductItem
                                                    item={item}
                                                    context={itemContext}
                                                    onUpdateQuantity={handleUpdateQuantity}
                                                    onUpdateNote={handleUpdateNote}
                                                    onUpdateDiscount={handleUpdateItemDiscount}
                                                    showNoteButton={!productItemReadOnly}
                                                    isReadOnly={productItemReadOnly}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentItemEditor;
