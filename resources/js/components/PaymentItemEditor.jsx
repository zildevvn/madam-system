import React from 'react';
import { formatPrice } from '../utils/format';
import ProductItem from './ProductItem';

const PaymentItemEditor = ({
    selectedTable,
    currentOrder,
    draftItems,
    allProducts,
    searchQuery,
    setSearchQuery,
    showProductSearch,
    setShowProductSearch,
    targetTableId,
    setTargetTableId,
    handleUpdateQuantity,
    handleUpdateNote,
    handleAddProduct,
    filteredProducts,
    isReadOnly = false
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

    return (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header Content — "Điều chỉnh món" for editable items */}
            {!isReadOnly && (
                <div className="px-6 pt-5 pb-2">
                    <div className="mb-4 relative">
                        <div className="flex items-center gap-2 mb-2">
                            <p className="m-0 text-[10px] font-bold uppercase tracking-widest text-gray-400">Điều chỉnh món</p>
                            <button
                                onClick={() => setShowProductSearch(!showProductSearch)}
                                className={`ml-auto w-6 h-6 rounded-lg ${showProductSearch ? 'bg-gray-200 text-gray-500' : 'bg-orange-500 text-white'} flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-colors`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                            </button>
                        </div>

                        {/* Table Selector — works for both staff-merged and group reservations */}
                        {selectorTableIds.length > 1 && (
                            <div className="select-tables flex flex-wrap gap-1.5 mb-3 bg-gray-50/80 p-1.5 rounded-xl border border-gray-100">
                                {selectorTableIds.map(id => (
                                    <button
                                        key={id}
                                        onClick={() => setTargetTableId(id)}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border-none cursor-pointer
                                            ${targetTableId === id
                                                ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                                                : 'bg-white text-gray-400 hover:text-gray-600'
                                            }
                                        `}
                                    >
                                        {id}
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
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all font-medium"
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
                        {Object.entries(
                            draftItems.reduce((acc, item) => {
                                // [RULE] For unified group orders:
                                // - Items with reservation_item_id = shared pre-order → GROUP bucket
                                // - Items without reservation_item_id = individual extras → per-table bucket
                                const isGroupReservation = currentOrder?.reservation && currentOrder?.reservation.type === 'group';

                                let tGroup;
                                if (isGroupReservation) {
                                    // Shared pre-order items go to GROUP, individual extras go to their table
                                    tGroup = item.reservation_item_id ? 'GROUP' : (item.tableId || 'GROUP');
                                } else {
                                    // Standard staff-merge: group by table
                                    tGroup = item.tableId || selectedTable.originalTableId || selectedTable.id;
                                }

                                if (!acc[tGroup]) acc[tGroup] = [];
                                acc[tGroup].push(item);
                                return acc;
                            }, {})
                        ).sort(([a], [b]) => a === 'GROUP' ? -1 : a - b).map(([tGroup, tableItems]) => {
                            const subtotal = tableItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                            const isSharedSection = tGroup === 'GROUP';

                            // [WHY] Display title for each section
                            const displayTableTitle = isSharedSection
                                ? `Món chung${groupTableIds.length > 0 ? ` (Bàn ${groupTableIds.join('-')})` : ''}`
                                : `Bàn ${tGroup.toString().split('-')[0]}`;

                            // [WHY] Shared pre-order items are always read-only.
                            // Individual extras are editable.
                            const sectionReadOnly = isSharedSection;

                            return (
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
                                    {tableItems.map((item, idx) => {
                                        const actualTableId = item.tableId || selectedTable.id;
                                        // [WHY] Per-item read-only: shared dishes (reservation_item_id) are locked
                                        const itemReadOnly = isReadOnly || sectionReadOnly;
                                        return (
                                            <ProductItem
                                                key={`${item.product_id || item.id}-${actualTableId}`}
                                                item={item}
                                                onUpdateQuantity={(id, q) => handleUpdateQuantity(item.product_id || item.id, parseInt(actualTableId), q)}
                                                onUpdateNote={(id, n) => handleUpdateNote(item.product_id || item.id, parseInt(actualTableId), n)}
                                                showNoteButton={!itemReadOnly}
                                                isReadOnly={itemReadOnly}
                                            />
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentItemEditor;
