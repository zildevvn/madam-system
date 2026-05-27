import React, { useState } from 'react';
import UserManagement from '../../components/admin/UserManagement';
import DayOffManager from '../../components/admin/DayOffManager';
import { useAppSelector } from '../../store/hooks';

/**
 * PersonnelPage Component
 * Provides a unified dashboard for employee records and day off registries.
 */
const PersonnelPage = () => {
    const { user: currentUser } = useAppSelector(state => state.auth);
    const [activeTab, setActiveTab] = useState('employees'); // employees, leaves

    return (
        <div className="space-y-6">
            
            {/* Elegant Tab Switcher */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                    onClick={() => setActiveTab('employees')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                        activeTab === 'employees' 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    Danh sách nhân viên
                </button>
                <button
                    onClick={() => setActiveTab('leaves')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border-none cursor-pointer ${
                        activeTab === 'leaves' 
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                >
                    Yêu cầu nghỉ phép
                </button>
            </div>

            {/* Tab Contents */}
            <div className="animate-in fade-in duration-300">
                {activeTab === 'employees' ? (
                    <UserManagement currentUser={currentUser} />
                ) : (
                    <DayOffManager currentUser={currentUser} />
                )}
            </div>

        </div>
    );
};

export default PersonnelPage;
