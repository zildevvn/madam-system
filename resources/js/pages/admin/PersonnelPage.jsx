import React from 'react';
import UserManagement from '../../components/admin/UserManagement';
import { useAppSelector } from '../../store/hooks';

/**
 * PersonnelPage Component
 * [WHY] Provides a dedicated route for user and role management.
 * [RULE] Wraps UserManagement and injects the currentUser from Redux store 
 * to maintain functionality identical to the previous tab-based view.
 */
const PersonnelPage = () => {
    // Get currentUser from Redux to pass to UserManagement
    const { user: currentUser } = useAppSelector(state => state.auth);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <UserManagement currentUser={currentUser} />
        </div>
    );
};

export default PersonnelPage;
