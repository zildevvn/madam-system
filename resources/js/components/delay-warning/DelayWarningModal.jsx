import React, { useState, useMemo, useRef, useEffect } from 'react';
import { safeParseDate } from '../../shared/utils/dateUtils';
import Icon from '../shared/Icon';

/**
 * Modal to display detailed notes for a dish, categorized by table,
 * and allow marking them as complete (served).
 * 
 */
const DelayWarningModal = ({
    item,
    onClose,
    onToggleStatus,
    currentTime
}) => {
    // Hooks must be called unconditionally and in a stable order.
    const [localChanges, setLocalChanges] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMountedRef = useRef(false);
    const isSubmittingRef = useRef(false);

    // Track the current item to avoid keeping stale selections
    // when the modal switches to another item.
    const itemId = item?.id ?? item?.ID ?? null;
    const previousItemIdRef = useRef(itemId);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (previousItemIdRef.current !== itemId) {
            previousItemIdRef.current = itemId;
            setLocalChanges({});
        }
    }, [itemId]);

    const currentTimeTs = useMemo(() => {
        if (currentTime == null || currentTime === '') {
            return Date.now();
        }

        try {
            const parsedDate = safeParseDate(currentTime);
            const timestamp = parsedDate?.getTime();

            return Number.isFinite(timestamp) ? timestamp : NaN;
        } catch {
            return NaN;
        }
    }, [currentTime]);

    // Prefer a stable record ID when available.
    // Do not use status in the key because status can change.
    const getTableKey = (t, index) => {
        if (t?.id != null) {
            return `id:${t.id}`;
        }

        if (t?.ID != null) {
            return `ID:${t.ID}`;
        }

        // Fallback for legacy data without a record ID.
        // Include the index to distinguish otherwise identical rows.
        return `fallback:${t?.tableId ?? ''}:${t?.note ?? ''}:${index}`;
    };

    const handleLocalToggle = (t, index) => {
        if (!t || t.status === 'served' || isSubmittingRef.current) {
            return;
        }

        const key = getTableKey(t, index);

        setLocalChanges(prev => ({
            ...prev,
            [key]: prev[key] === 'served' ? 'pending' : 'served'
        }));
    };

    const handleConfirm = async () => {
        if (isSubmittingRef.current) {
            return;
        }

        const tables = Array.isArray(item?.tables) ? item.tables : [];

        // Preserve the original behavior when there are no updates.
        const pendingUpdates = tables.filter((t, index) => {
            const key = getTableKey(t, index);

            return (
                localChanges[key] === 'served' &&
                t?.status !== 'served'
            );
        });

        if (pendingUpdates.length === 0) {
            onClose?.();
            return;
        }

        // Do not silently close when updates are required but
        // the callback is missing.
        if (typeof onToggleStatus !== 'function') {
            console.error(
                'DelayWarningModal: onToggleStatus is not a function.'
            );
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        try {
            // Keep the original callback arguments and their order.
            // Await each update so asynchronous failures can be caught.
            for (const t of pendingUpdates) {
                await onToggleStatus(
                    { allIds: t.allIds, id: t.id },
                    'served',
                    null,
                    t.tableId
                );
            }

            if (isMountedRef.current) {
                onClose?.();
            }
        } catch (error) {
            console.error(
                'DelayWarningModal: Failed to update served status.',
                error
            );

            // Keep the modal open so the user can review and retry.
            // Note: earlier updates may already have succeeded.
        } finally {
            isSubmittingRef.current = false;

            if (isMountedRef.current) {
                setIsSubmitting(false);
            }
        }
    };

    if (!item) {
        return null;
    }

    const tables = Array.isArray(item.tables) ? item.tables : [];

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            role="presentation"
        >
            <div
                className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delay-warning-modal-title"
            >
                <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h6
                            id="delay-warning-modal-title"
                            className="label-table mb-0"
                        >
                            {item.name_vi
                                ? `${item.name_vi} - ${item.name}`
                                : item.name}
                        </h6>

                        <p className="text-[12px] font-bold text-gray-500 mt-1 mb-0">
                            Tổng cộng: {item.totalQuantity ?? 0} phần đang chờ
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label="Đóng cửa sổ"
                        className="btn-close p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center disabled:opacity-50"
                    >
                        <Icon
                            name="close"
                            className="w-6 h-6 text-slate-500"
                            size={24}
                        />
                    </button>
                </div>

                <div className="px-2 py-4 md:p-6 max-h-[70vh] overflow-y-auto mdt-scrollbar">
                    <div className="space-y-4">
                        {tables.map((t, idx) => {
                            const key = getTableKey(t, idx);
                            const isCurrentlyDone =
                                (localChanges[key] ?? t.status) === 'served';

                            const orderTimeTs = Number(t.orderTimeTs);
                            const hasValidTime =
                                Number.isFinite(currentTimeTs) &&
                                Number.isFinite(orderTimeTs);

                            const itemDiff = hasValidTime
                                ? Math.max(
                                    1,
                                    Math.floor(
                                        (currentTimeTs - orderTimeTs) /
                                        60000
                                    )
                                )
                                : null;

                            const tableName = String(t.name ?? '');

                            return (
                                <div
                                    key={key}
                                    className={`flex justify-between items-start p-2 rounded-lg border transition-all duration-300 ${isCurrentlyDone
                                        ? 'bg-gray-50 border-gray-100 opacity-60 cursor-default'
                                        : 'bg-white border-gray-100 shadow-sm hover:border-orange-200 group cursor-pointer'
                                        }`}
                                    onClick={() => handleLocalToggle(t, idx)}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div
                                            className={`w-4 h-4 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-300 ${isCurrentlyDone
                                                ? 'bg-green-500 border-green-500 shadow-lg shadow-green-100'
                                                : 'bg-white border-gray-200 hover:border-orange-400 group-hover:scale-110'
                                                }`}
                                            aria-hidden="true"
                                        >
                                            {isCurrentlyDone && (
                                                <Icon
                                                    name="check"
                                                    className="w-3 h-3 text-white"
                                                    size={12}
                                                />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-[14px] font-bold transition-all duration-300 ${isCurrentlyDone
                                                        ? 'text-gray-400 line-through'
                                                        : 'text-gray-800'
                                                        }`}
                                                >
                                                    Bàn{' '}
                                                    {tableName.replace(
                                                        /^Bàn\s+/i,
                                                        ''
                                                    )}
                                                </span>

                                                {t.quantity > 1 && (
                                                    <span
                                                        className={`text-[11px] font-black px-2 py-0.5 rounded-lg transition-all duration-300 ${isCurrentlyDone
                                                            ? 'bg-gray-100 text-gray-400'
                                                            : 'bg-orange-50 text-orange-500'
                                                            }`}
                                                    >
                                                        x{t.quantity}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                    {itemDiff !== null
                                                        ? `${itemDiff} phút trước`
                                                        : 'Không xác định thời gian'}
                                                </span>

                                                {itemDiff !== null &&
                                                    itemDiff >= 10 &&
                                                    !isCurrentlyDone && (
                                                        <span
                                                            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1 ${itemDiff >= 20
                                                                ? 'bg-red-50 text-red-500'
                                                                : 'bg-yellow-50 text-yellow-600'
                                                                }`}
                                                        >
                                                            <span
                                                                className={`w-1 h-1 rounded-full animate-pulse ${itemDiff >=
                                                                    20
                                                                    ? 'bg-red-500'
                                                                    : 'bg-yellow-500'
                                                                    }`}
                                                            />
                                                            TRỄ
                                                        </span>
                                                    )}
                                            </div>

                                            {t.note && (
                                                <div className="mt-2 bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                                    <Icon
                                                        name="pencil"
                                                        className="w-3 h-3 text-orange-400 mt-0.5 shrink-0"
                                                        size={12}
                                                    />

                                                    <p className="m-0 text-[11px] font-bold text-gray-800 leading-tight">
                                                        {t.note}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {tables.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-4">
                                Không có dữ liệu bàn.
                            </p>
                        )}
                    </div>
                </div>

                <div className="py-4 px-2 md:p-6 pt-0">
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="w-full mdt-btn btn-confirm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Đang xử lý...' : 'Xong'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DelayWarningModal;