import React from 'react';
import Icon from '../shared/Icon';

const StatusPopups = ({ 
    showSuccessPopup, 
    successMessage, 
    showWarningPopup, 
    warningMessage, 
    warningTitle = "Lỗi in Bill Bar!",
    setShowWarningPopup 
}) => {
    return (
        <>
            {showSuccessPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center py-4 px-2 no-print">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300"></div>
                    <div className="bg-white rounded-[20px] p-8 max-w-[280px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] flex flex-col items-center text-center relative z-10 transition-all duration-300 animate-[pulse_0.3s_ease-out]">
                        <div className="w-[40px] h-[40px] bg-[#03b879]/10 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Icon name="check" className="w-5 h-5 text-[#03b879]" size={20} />
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
                            <Icon name="alert" className="w-6 h-6 text-red-600" size={24} />
                        </div>
                        <h5 className="text-[18px] mb-2 font-bold text-red-700">{warningTitle}</h5>
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
