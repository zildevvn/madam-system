import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import toast from 'react-hot-toast';
import { getUserByIdApi } from '../services/userService';
import { getLeaveRequestsApi } from '../services/leaveService';
import { 
    isPastDate, 
    formatDateToVietnamese 
} from '../shared/utils/dateUtils';
import { useProfileForm } from './useProfileForm';
import { useShiftRegistration } from './useShiftRegistration';
import { useLeaveRequests } from './useLeaveRequests';

// [WHY] Custom hook that orchestrates single-responsibility sub-hooks for form details, shift registrations, and leave requests.
export const useUserProfile = () => {
    const { user: currentUser } = useAppSelector(state => state.auth);

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [leaves, setLeaves] = useState([]);

    // Lightbox for Document Previews
    const [lightboxImage, setLightboxImage] = useState(null);

    const roles = [
        { value: 'admin', label: 'Quản trị viên (Admin)' },
        { value: 'manager', label: 'Quản lý (Manager)' },
        { value: 'order_staff', label: 'Nhân viên Order' },
        { value: 'kitchen', label: 'Bếp (Kitchen)' },
        { value: 'bar', label: 'Bar' },
        { value: 'cashier', label: 'Thu ngân (Cashier)' },
        { value: 'bill', label: 'Nhân viên đọc Bill' },
        { value: 'seller', label: 'Bán hàng (Seller)' }
    ];

    // Format currency to VND
    const formatCurrency = (val) => {
        if (!val && val !== 0) return 'Chưa cập nhật';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    // Get Role Label
    const getRoleLabel = (roleVal) => {
        const found = roles.find(r => r.value === roleVal);
        return found ? found.label : roleVal;
    };

    const fetchProfileAndLeaves = async () => {
        if (!currentUser) return;
        try {
            const [userRes, leaveRes] = await Promise.all([
                getUserByIdApi(currentUser.id),
                getLeaveRequestsApi(currentUser.id)
            ]);
            setUser(userRes.data);
            setLeaves(leaveRes.data);
        } catch (err) {
            console.error('Failed to load profile details:', err);
            toast.error('Không thể tải thông tin trang cá nhân');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileAndLeaves();
    }, [currentUser]);

    // delegate sub-hook states
    const shiftReg = useShiftRegistration(user);
    
    const profileForm = useProfileForm(
        user, 
        fetchProfileAndLeaves, 
        shiftReg.registrationMode, 
        shiftReg.flexibleShifts
    );

    const leaveRequests = useLeaveRequests(
        user, 
        leaves, 
        fetchProfileAndLeaves
    );

    return {
        // Data & Loading states
        currentUser,
        loading,
        user,
        leaves,
        roles,

        // Lightbox
        lightboxImage, setLightboxImage,

        // Formatters & helpers
        formatCurrency,
        formatDate: formatDateToVietnamese,
        getRoleLabel,
        isDateInPast: isPastDate,

        // Delegated Shift states & handlers
        ...shiftReg,

        // Delegated Profile states & handlers
        ...profileForm,

        // Delegated Leave states & handlers
        ...leaveRequests
    };
};
