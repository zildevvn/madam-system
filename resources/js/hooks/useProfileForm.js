import { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateUserInStore } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import imageCompression from 'browser-image-compression';
import { updateUserApi } from '../services/userService';
import { formatToLocalDateStr } from '../shared/utils/dateUtils';

// [WHY] Decoupled state and handler hook for updating user profile form details, avatars, and documents.
export const useProfileForm = (user, fetchProfileAndLeaves, registrationMode, flexibleShifts) => {
    const dispatch = useAppDispatch();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [password, setPassword] = useState('');
    const [workShift, setWorkShift] = useState('');
    
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const fileInputRef = useRef(null);

    const [idCardFile, setIdCardFile] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState('');
    const [removeIdCard, setRemoveIdCard] = useState(false);

    const [contractFile, setContractFile] = useState(null);
    const [contractPreview, setContractPreview] = useState('');
    const [removeContract, setRemoveContract] = useState(false);

    const [submittingProfile, setSubmittingProfile] = useState(false);

    // [WHY] Sync form states whenever user data changes.
    useEffect(() => {
        if (!user) return;
        setName(user.name || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddress(user.address || '');
        setDateOfBirth(formatToLocalDateStr(user.date_of_birth));
        setWorkShift(user.work_shift || 'Ca sáng');

        if (user.photo) {
            setAvatarPreview(`/storage/${user.photo}`);
        } else {
            setAvatarPreview('');
        }

        setIdCardPreview(user.id_card_image ? `/storage/${user.id_card_image}` : '');
        setIdCardFile(null);
        setRemoveIdCard(false);

        setContractPreview(user.contract_image ? `/storage/${user.contract_image}` : '');
        setContractFile(null);
        setRemoveContract(false);
    }, [user]);

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            if (avatarPreview && avatarPreview.startsWith('blob:')) {
                URL.revokeObjectURL(avatarPreview);
            }
            if (idCardPreview && idCardPreview.startsWith('blob:')) {
                URL.revokeObjectURL(idCardPreview);
            }
            if (contractPreview && contractPreview.startsWith('blob:')) {
                URL.revokeObjectURL(contractPreview);
            }
        };
    }, [avatarPreview, idCardPreview, contractPreview]);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh hợp lệ (.JPG, .PNG)');
            return;
        }

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true
        };

        let processedFile = file;
        const toastId = toast.loading('Đang nén ảnh...');
        try {
            processedFile = await imageCompression(file, options);
        } catch (error) {
            console.error('Image compression failed:', error);
        } finally {
            toast.dismiss(toastId);
        }

        if (avatarPreview && avatarPreview.startsWith('blob:')) {
            URL.revokeObjectURL(avatarPreview);
        }

        setAvatarFile(processedFile);
        const url = URL.createObjectURL(processedFile);
        setAvatarPreview(url);

        e.target.value = '';
    };

    const handleIdCardFileChange = (file) => {
        if (idCardPreview && idCardPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idCardPreview);
        }
        setIdCardFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setIdCardPreview(url);
            setRemoveIdCard(false);
        } else {
            setIdCardPreview('');
        }
    };

    const handleContractFileChange = (file) => {
        if (contractPreview && contractPreview.startsWith('blob:')) {
            URL.revokeObjectURL(contractPreview);
        }
        setContractFile(file);
        if (file) {
            const url = URL.createObjectURL(file);
            setContractPreview(url);
            setRemoveContract(false);
        } else {
            setContractPreview('');
        }
    };

    const handleRemoveIdCard = () => {
        if (idCardPreview && idCardPreview.startsWith('blob:')) {
            URL.revokeObjectURL(idCardPreview);
        }
        setIdCardFile(null);
        setIdCardPreview('');
        setRemoveIdCard(true);
    };

    const handleRemoveContract = () => {
        if (contractPreview && contractPreview.startsWith('blob:')) {
            URL.revokeObjectURL(contractPreview);
        }
        setContractFile(null);
        setContractPreview('');
        setRemoveContract(true);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();

        if (!name || !email) {
            toast.error('Họ tên và email là bắt buộc');
            return;
        }

        setSubmittingProfile(true);
        try {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('address', address);
            formData.append('date_of_birth', dateOfBirth);
            formData.append('work_shift', workShift);

            if (registrationMode === 'fixed') {
                formData.append('flexible_shifts', JSON.stringify({}));
            } else {
                formData.append('flexible_shifts', JSON.stringify(flexibleShifts));
            }

            if (password) {
                formData.append('password', password);
            }
            if (avatarFile) {
                formData.append('photo', avatarFile);
            }

            if (idCardFile) {
                formData.append('id_card_image', idCardFile);
            }
            if (removeIdCard) {
                formData.append('remove_id_card_image', '1');
            }

            if (contractFile) {
                formData.append('contract_image', contractFile);
            }
            if (removeContract) {
                formData.append('remove_contract_image', '1');
            }

            const response = await updateUserApi(user.id, formData);
            const updatedUser = response.data;
            toast.success('Cập nhật trang cá nhân thành công!');

            dispatch(updateUserInStore(updatedUser));
            setPassword('');
            fetchProfileAndLeaves();
        } catch (err) {
            console.error('Failed to update profile:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật';
            toast.error(msg);
        } finally {
            setSubmittingProfile(false);
        }
    };

    return {
        name, setName,
        email, setEmail,
        phone, setPhone,
        address, setAddress,
        dateOfBirth, setDateOfBirth,
        password, setPassword,
        workShift, setWorkShift,
        avatarPreview,
        fileInputRef,
        idCardPreview,
        contractPreview,
        submittingProfile,
        handleAvatarChange,
        handleIdCardFileChange,
        handleContractFileChange,
        handleRemoveIdCard,
        handleRemoveContract,
        handleUpdateProfile
    };
};
