import React, { useRef } from 'react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

// [WHY] Reusable card component for handling administrative/personal document image uploads, previews, and compression.
const DocumentUploadCard = ({
    label,
    placeholderLabel,
    preview,
    onFileChange,
    onRemove,
    onZoom
}) => {
    const fileInputRef = useRef(null);

    // [WHY] Handle the document selection, compress it with worker threads, and pass it back.
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file hình ảnh hợp lệ (.JPG, .PNG)');
            e.target.value = '';
            return;
        }

        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true
        };

        const toastId = toast.loading(`Đang nén ảnh ${placeholderLabel}...`);
        try {
            const compressed = await imageCompression(file, options);
            onFileChange(compressed);
        } catch (error) {
            console.error('Image compression failed:', error);
            toast.error('Có lỗi xảy ra khi nén ảnh.');
        } finally {
            toast.dismiss(toastId);
            // Reset input so that selecting the same file again triggers the onChange event
            e.target.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {label}
            </label>

            <div className="border-2 border-dashed border-slate-100 rounded-[20px] p-4 bg-slate-50/50 flex flex-col items-center justify-center min-h-[160px] relative transition-colors hover:border-slate-200">
                {preview ? (
                    <div className="w-full flex flex-col items-center gap-3">
                        {/* Image Preview Container */}
                        <div className="relative w-full aspect-[4/3] max-h-[150px] rounded-xl overflow-hidden border border-slate-100 group shadow-sm bg-white">
                            <img
                                src={preview}
                                alt={label}
                                className="w-full h-full object-cover"
                            />
                            {/* Hover Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => onZoom && onZoom(preview)}
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all border-none cursor-pointer"
                                    title="Phóng to"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all border-none cursor-pointer"
                                    title="Thay đổi"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 6H16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Remove Action Button */}
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-3v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Gỡ bỏ tài liệu
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-6 select-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-xs font-black text-slate-400 tracking-wider uppercase">Tải lên {placeholderLabel}</span>
                        <span className="text-[9px] text-slate-300 font-medium">Chấp nhận định dạng hình ảnh</span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default DocumentUploadCard;
