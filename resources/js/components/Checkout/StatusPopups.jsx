import React from 'react';
import Icon from '../shared/Icon';

const StatusPopups = ({ 
    showSuccessPopup, 
    successMessage, 
    showWarningPopup, 
    warningMessage, 
    warningTitle = "Lỗi in Bill Bar!",
    setShowWarningPopup,
    onRetry,
    isRetrying = false,
    retryLabel = "Thử in lại",
    onDismiss
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
                        <h5 className="text-[20px] mb-2 font-bold text-gray-900">Thành công!</h5>
                        <p className="!text-[13px] text-gray-600">{successMessage}</p>
                    </div>
                </div>
            )}

            {showWarningPopup && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center py-4 px-2 no-print">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"></div>
                    <div className="bg-white rounded-[20px] p-8 max-w-[340px] w-full shadow-[0_10px_40px_rgba(0,0,0,0.15)] flex flex-col items-center text-center relative z-10 animate-[in_0.2s_ease-out]">
                        <div className="w-[48px] h-[48px] bg-amber-100 rounded-full flex items-center justify-center mb-4">
                            <Icon name="alert" className="w-6 h-6 text-amber-600" size={24} />
                        </div>
                        <h5 className="text-[18px] mb-2 font-bold text-gray-900">{warningTitle}</h5>
                        <p className="!text-[14px] text-gray-600 mb-6 whitespace-pre-line leading-relaxed">{warningMessage}</p>

                        <div className="w-full flex flex-col gap-2.5">
                            {onRetry && (
                                <button 
                                    onClick={onRetry}
                                    disabled={isRetrying}
                                    className="w-full py-3 bg-[#03b879] hover:bg-[#029e67] disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {isRetrying ? (
                                        <>
                                            <span className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                                            <span>Đang thử in lại...</span>
                                        </>
                                    ) : (
                                        <span>{retryLabel}</span>
                                    )}
                                </button>
                            )}
                            <button 
                                onClick={() => {
                                    setShowWarningPopup(false);
                                    if (onDismiss) onDismiss();
                                }}
                                className={`w-full py-3 rounded-xl font-semibold transition-colors ${
                                    onRetry 
                                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700" 
                                        : "bg-red-600 hover:bg-red-700 text-white font-bold"
                                }`}
                            >
                                {onRetry ? "Đóng / Về bàn" : "Đã hiểu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default React.memo(StatusPopups);
