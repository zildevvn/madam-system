import React, { useState, useEffect } from 'react';
import UserManagement from '../../components/admin/UserManagement';
import DayOffManager from '../../components/admin/DayOffManager';
import { useAppSelector } from '../../store/hooks';
import { getLeaveRequestsApi } from '../../services/leaveService';

/**
 * PersonnelPage Component
 * Provides a unified dashboard for employee records and day off registries.
 */
const PersonnelPage = () => {
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('employees'); // employees, leaves
    const [requests, setRequests] = useState([]);

    // Fetch initial leave requests on mount to compute pending counts immediately
    useEffect(() => {
        const fetchInitialRequests = async () => {
            try {
                const res = await getLeaveRequestsApi();
                setRequests(res.data);
            } catch (err) {
                console.error('Failed to load initial leave requests:', err);
            }
        };
        fetchInitialRequests();
    }, []);

    // [WHY] Compute count of leave requests currently waiting for approval.
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="space-y-6">

            {/* Elegant Tab Switcher */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-b border-slate-100 pb-3">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`flex-1 sm:flex-none text-center justify-center px-2 sm:px-5 py-2.5 sm:py-2.5 rounded-md text-[9px] md:text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${activeTab === 'employees'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    Danh sách nhân viên
                </button>
                <button
                    onClick={() => setActiveTab('leaves')}
                    className={`flex-1 sm:flex-none text-center justify-center px-2 sm:px-5 py-2.5 sm:py-2.5 rounded-md text-[9px] md:text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-2 ${activeTab === 'leaves'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    <span>Yêu cầu nghỉ phép</span>
                    {pendingCount > 0 && (
                        <span className={`inline-flex items-center justify-center w-5 h-5 text-[10px] font-black rounded-full leading-none transition-all ${activeTab === 'leaves'
                            ? 'bg-white text-orange-500'
                            : 'bg-orange-500 text-white'
                            }`}>
                            {pendingCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'employees' ? (
                    <UserManagement currentUser={currentUser} />
                ) : (
                    <DayOffManager currentUser={currentUser} requests={requests} setRequests={setRequests} />
                )}
            </div>

        </div>
    );
};

export default PersonnelPage;
