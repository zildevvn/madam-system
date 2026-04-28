import React from 'react';
import { useStaffOrderController } from '../hooks/useStaffOrderController';
import StaffOrderView from '../components/StaffOrder/StaffOrderView';

const Spinner = () => (
    <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
);

const ErrorView = ({ error }) => (
    <div className="p-6 text-red-600 text-sm">{error}</div>
);

export default function StaffOrder() {
    const { data, ui, actions } = useStaffOrderController();

    // ✅ Boundary handling tại Page
    if (ui.isLoading && data.tables.length === 0) {
        return <Spinner />;
    }

    if (ui.error) {
        return <ErrorView error={ui.error} />;
    }

    return (
        <StaffOrderView
            data={data}
            ui={ui}
            actions={actions}
        />
    );
}