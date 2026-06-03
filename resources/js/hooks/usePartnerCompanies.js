import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import partnerCompanyService from '../services/partnerCompanyService';

export const usePartnerCompanies = (autoFetch = true) => {
    const [companies, setCompanies] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 15
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchCompanies = useCallback(async (page = 1, search = searchQuery, fetchAll = false) => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page,
                search
            };
            if (fetchAll) {
                params.all = true;
            }
            const response = await partnerCompanyService.getAllPartnerCompanies(params);
            if (fetchAll) {
                setCompanies(response || []);
            } else {
                setCompanies(response.data || []);
                setPagination({
                    current_page: response.current_page || 1,
                    last_page: response.last_page || 1,
                    total: response.total || 0,
                    per_page: response.per_page || 15
                });
            }
        } catch (err) {
            console.error('Failed to fetch partner companies:', err);
            setError('Không thể tải danh sách đối tác. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    const addCompany = useCallback(async (data) => {
        setProcessing(true);
        try {
            await partnerCompanyService.createPartnerCompany(data);
            await fetchCompanies(1);
            toast.success('Thêm đối tác thành công');
            return true;
        } catch (err) {
            console.error('Failed to add partner company:', err);
            const msg = err.response?.data?.message || 'Không thể thêm đối tác mới.';
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    }, [fetchCompanies]);

    const updateCompany = useCallback(async (id, data) => {
        setProcessing(true);
        try {
            await partnerCompanyService.updatePartnerCompany(id, data);
            await fetchCompanies(pagination.current_page);
            toast.success('Cập nhật thông tin đối tác thành công');
            return true;
        } catch (err) {
            console.error('Failed to update partner company:', err);
            const msg = err.response?.data?.message || 'Không thể cập nhật thông tin đối tác.';
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    }, [fetchCompanies, pagination.current_page]);

    const deleteCompany = useCallback(async (id) => {
        setProcessing(true);
        try {
            await partnerCompanyService.deletePartnerCompany(id);
            await fetchCompanies(1);
            toast.success('Xóa đối tác thành công');
            return true;
        } catch (err) {
            console.error('Failed to delete partner company:', err);
            const msg = 'Không thể xóa đối tác.';
            toast.error(msg);
            return false;
        } finally {
            setProcessing(false);
        }
    }, [fetchCompanies]);

    useEffect(() => {
        if (autoFetch) {
            fetchCompanies(1);
        }
    }, [autoFetch, fetchCompanies]);

    return {
        companies,
        pagination,
        loading,
        error,
        processing,
        searchQuery,
        setSearchQuery,
        addCompany,
        updateCompany,
        deleteCompany,
        refresh: fetchCompanies
    };
};
