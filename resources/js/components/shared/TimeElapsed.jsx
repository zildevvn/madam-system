import React, { useState, useEffect } from 'react';
import { getElapsedString } from '../../shared/utils/formatTime';

/**
 * TimeElapsed: A granular component that manages its own timer 
 * to display elapsed time from a given timestamp.
 * [WHY] Prevents parent components (like StaffOrder) from re-rendering 
 * the entire UI every time the clock ticks.
 */
const TimeElapsed = ({ timestamp, intervalMs = 30000 }) => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, intervalMs);
        return () => clearInterval(timer);
    }, [intervalMs]);

    return (
        <span className="time-elapsed text-[14px]">
            {getElapsedString(timestamp, now)}
        </span>
    );
};

export default React.memo(TimeElapsed);
