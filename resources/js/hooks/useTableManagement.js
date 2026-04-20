import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import tableService from '../services/tableService';

export const useTableManagement = () => {
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    const fetchTables = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await tableService.getAllTables();
            setTables(response.data || []);
        } catch (err) {
            console.error('Failed to fetch tables:', err);
            setError('Không thể tải danh sách bàn. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    const addTable = async (data) => {
        setProcessing(true);
        try {
            await tableService.createTable(data);
            await fetchTables();
            toast.success('Thêm bàn mới thành công');
            return true;
        } catch (err) {
            console.error('Failed to add table:', err);
            const msg = 'Không thể thêm bàn mới.';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const updateTable = async (id, data) => {
        setProcessing(true);
        try {
            await tableService.updateTable(id, data);
            await fetchTables();
            toast.success('Cập nhật thông tin bàn thành công');
            return true;
        } catch (err) {
            console.error('Failed to update table:', err);
            const msg = 'Không thể cập nhật thông tin bàn.';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    const deleteTable = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bàn này?')) return;
        
        setProcessing(true);
        try {
            await tableService.deleteTable(id);
            await fetchTables();
            toast.success('Xóa bàn thành công');
            return true;
        } catch (err) {
            console.error('Failed to delete table:', err);
            const msg = 'Không thể xóa bàn. Vui lòng kiểm tra xem bàn có đang phục vụ không.';
            setError(msg);
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        fetchTables();
    }, [fetchTables]);

    return {
        tables,
        loading,
        error,
        processing,
        addTable,
        updateTable,
        deleteTable,
        refresh: fetchTables
    };
};
