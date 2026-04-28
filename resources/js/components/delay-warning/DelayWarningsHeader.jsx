import React from 'react';

/**
 * Header for the DelayWarnings sidebar.
 */
const DelayWarningsHeader = React.memo(({ title }) => {
    return (
        <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
            <h5 className="m-0 tracking-widest">{title}</h5>
        </div>
    );
});

export default DelayWarningsHeader;
