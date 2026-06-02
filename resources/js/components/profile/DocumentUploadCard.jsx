import React, { useRef } from 'react';
import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';
import Icon from '../shared/Icon';

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
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all border-none cursor-pointer flex items-center justify-center"
                                    title="Phóng to"
                                >
                                    <Icon name="eye" className="w-5 h-5" size={20} strokeWidth={2.5} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-lg backdrop-blur-sm transition-all border-none cursor-pointer flex items-center justify-center"
                                    title="Thay đổi"
                                >
                                    <Icon name="refresh" className="w-5 h-5" size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>

                        {/* Remove Action Button */}
                        <button
                            type="button"
                            onClick={onRemove}
                            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-600 active:scale-95 transition-all border-none bg-transparent cursor-pointer flex items-center gap-1"
                        >
                            <Icon name="trash" className="w-3.5 h-3.5" size={14} strokeWidth={2.5} />
                            Gỡ bỏ tài liệu
                        </button>
                    </div>
                ) : (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full py-6 select-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-colors">
                            <Icon name="image" className="w-6 h-6" size={24} strokeWidth={2.5} />
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
