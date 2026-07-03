import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    selectSelectedItems,
    selectOriginalItems
} from '../store/slices/orderSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';

/**
 * [WHY] Shared utility to derive merged table IDs from a group key string.
 * Centralizes the logic to prevent drift and duplication across state computations.
 */
const parseGroupKey = (groupKey, excludeTableId) => {
    if (!groupKey) return [];
    return groupKey.split('-')
        .map(id => parseInt(id))
        .filter(id => id.toString() !== excludeTableId?.toString());
};

/**
 * useCheckoutState: Centralizes routing, Redux selectors, and UI state 
 * for the checkout process to keep logic hooks clean.
 */
export const useCheckoutState = () => {
    const { tableId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Redux selectors
    const activeOrderId = useAppSelector(state => state.order.activeOrderId);
    const orderStatus = useAppSelector(state => state.order.orderStatus);
    const isModified = useAppSelector(state => state.order.isModified);
    const orderNote = useAppSelector(state => state.order.orderNote);
    const isConfirmed = orderStatus && orderStatus !== 'draft';
    const selectedItems = useAppSelector(selectSelectedItems);
    const allTables = useAppSelector(selectTables);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);
    const originalItems = useAppSelector(selectOriginalItems);
    const currentUser = useAppSelector(state => state.auth.user);

    // [WHY] Initialize mergedTableIds from existing group state (Rule 312: state synchronization)
    const initialMergedIds = useMemo(() => {
        const groupKey = tableIdToGroupKey[tableId?.toString()];
        return parseGroupKey(groupKey, tableId);
    }, [tableId, tableIdToGroupKey]);

    // Local UI state 
    const [selectedTableId, setSelectedTableId] = useState(tableId);
    const [mergedTableIds, setMergedTableIds] = useState(initialMergedIds);
    const [showMergeDropdown, setShowMergeDropdown] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [warningTitle, setWarningTitle] = useState('Lỗi in Bill Bar!');
    const [warningMessage, setWarningMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('Đơn hàng đã được lưu thành công.');
    const [undoSplitData, setUndoSplitData] = useState(null);

    const isTableChanged = useMemo(() => selectedTableId !== tableId, [selectedTableId, tableId]);

    const isMergeChanged = useMemo(() => {
        if (mergedTableIds.length !== initialMergedIds.length) return true;
        return !mergedTableIds.every(id => initialMergedIds.includes(id));
    }, [mergedTableIds, initialMergedIds]);

    // [WHY] Keep local merge state in sync with backend (selector updates)
    useEffect(() => {
        setMergedTableIds(initialMergedIds);
    }, [initialMergedIds]);

    const total = useMemo(() =>
        selectedItems.filter(item => !item.isSplit).reduce((acc, item) => acc + (item.price * item.quantity), 0)
        , [selectedItems]);

    const totalQuantity = useMemo(() =>
        selectedItems.filter(item => !item.isSplit).reduce((acc, item) => acc + item.quantity, 0)
        , [selectedItems]);

    return {
        tableId,
        navigate,
        dispatch,
        activeOrderId,
        orderStatus,
        isModified,
        isConfirmed,
        selectedItems,
        allTables,
        tableIdToGroupKey,
        originalItems,
        currentUser,
        selectedTableId,
        setSelectedTableId,
        mergedTableIds,
        setMergedTableIds,
        showMergeDropdown,
        setShowMergeDropdown,
        showSuccessPopup,
        setShowSuccessPopup,
        showWarningPopup,
        setShowWarningPopup,
        warningTitle,
        setWarningTitle,
        warningMessage,
        setWarningMessage,
        successMessage,
        setSuccessMessage,
        isTableChanged,
        isMergeChanged,
        total,
        totalQuantity,
        orderNote,
        guestCount: useAppSelector(state => state.order.guestCount),
        undoSplitData,
        setUndoSplitData
    };
};
