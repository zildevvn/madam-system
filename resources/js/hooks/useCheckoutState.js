import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
    selectSelectedItems,
    selectOriginalItems
} from '../store/slices/orderSlice';
import { selectTables, selectTableIdToGroupKey } from '../store/selectors/tableSelectors';

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
    const isConfirmed = orderStatus && orderStatus !== 'draft';
    const selectedItems = useAppSelector(selectSelectedItems);
    const allTables = useAppSelector(selectTables);
    const tableIdToGroupKey = useAppSelector(selectTableIdToGroupKey);
    const originalItems = useAppSelector(selectOriginalItems);

    // Local UI state 
    const [selectedTableId, setSelectedTableId] = useState(tableId);
    const [mergedTableIds, setMergedTableIds] = useState([]);
    const [showMergeDropdown, setShowMergeDropdown] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showWarningPopup, setShowWarningPopup] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('Đơn hàng đã được lưu thành công.');

    const isTableChanged = useMemo(() => selectedTableId !== tableId, [selectedTableId, tableId]);

    const total = useMemo(() =>
        selectedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        , [selectedItems]);

    const totalQuantity = useMemo(() =>
        selectedItems.reduce((acc, item) => acc + item.quantity, 0)
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
        warningMessage,
        setWarningMessage,
        successMessage,
        setSuccessMessage,
        isTableChanged,
        total,
        totalQuantity
    };
};
