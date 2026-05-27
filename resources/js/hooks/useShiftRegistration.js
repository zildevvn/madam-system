import { useState, useEffect } from 'react';
import { isPastDate } from '../shared/utils/dateUtils';

// [WHY] Decoupled hook for managing fixed vs flexible work shift registration states and reactive day updates.
export const useShiftRegistration = (user) => {
    const [registrationMode, setRegistrationMode] = useState('fixed'); // fixed, flexible
    const [flexibleShifts, setFlexibleShifts] = useState({});
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date());

    useEffect(() => {
        if (!user) return;
        const flexShifts = user.flexible_shifts || {};
        setFlexibleShifts(flexShifts);
        setRegistrationMode(flexShifts && Object.keys(flexShifts).length > 0 ? 'flexible' : 'fixed');
    }, [user]);

    // [WHY] Add or remove custom shifts in the flexibleShifts mapping state reactively.
    const handleSelectDayShift = (dateStr, shift) => {
        if (isPastDate(dateStr)) return; // Safety guard: ignore past dates editing
        setFlexibleShifts(prev => {
            const next = { ...prev };
            if (shift) {
                next[dateStr] = shift;
            } else {
                delete next[dateStr];
            }
            return next;
        });
    };

    return {
        registrationMode, setRegistrationMode,
        flexibleShifts, setFlexibleShifts,
        selectedCalendarDate, setSelectedCalendarDate,
        handleSelectDayShift
    };
};
