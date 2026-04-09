import React from 'react';

const StatusPopups = ({ 
    showSuccessPopup, 
    successMessage, 
    showWarningPopup, 
    warningMessage, 
    setShowWarningPopup 
}) => {
    return (
        <>
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4 px-2 no-print">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"></div>
                    <div className="bg-white rounded-[20px] p-8 max-w-[280px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative z-10 transition-all duration-300 animate-[pulse_0.3s_ease-out]">
                        <div className="w-[40px] h-[40px] bg-[#03b879]/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <svg className="w-5 h-5 text-[#03b879]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h5 className="text-[20px] mb-2">Thành công!</h5>
                        <p className="!text-[13px]">{successMessage}</p>
                    </div>
                </div>
            )}

            {showWarningPopup && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center py-4 px-2 no-print">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"></div>
                    <div className="bg-white rounded-[20px] p-8 max-w-[320px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col items-center text-center relative z-10 animate-[in_0.2s_ease-out]">
                        <div className="w-[48px] h-[48px] bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h5 className="text-[18px] mb-2 font-bold text-red-700">Lỗi in Bill Bar!</h5>
                        <p className="!text-[14px] text-gray-600 mb-6">{warningMessage}</p>
                        <button 
                            onClick={() => setShowWarningPopup(false)}
                            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                        >
                            Đã hiểu
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default React.memo(StatusPopups);
