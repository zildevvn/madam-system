import React, { useRef, useEffect } from 'react';
import imageCompression from 'browser-image-compression';

/**
 * Product Image Upload Component
 * WHY: Adheres to component granularity rules by isolating complex image processing logic.
 * Encapsulates client-side compression and preview functionality.
 */
const ProductImageInput = ({ preview, setPreview, setValue, imageError, setImageError, isCompressing, setIsCompressing }) => {
    const fileInputRef = useRef(null);

    // WHY: Dedicated effect to handle blob URL cleanup to prevent memory leaks (RULE: Image Processing)
    useEffect(() => {
        return () => {
            if (preview && typeof preview === 'string' && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const clearFileInput = () => {
        setValue('image', null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        setImageError(null);

        if (file) {
            // RULE: Validate file type before processing
            if (!file.type.startsWith('image/')) {
                setImageError('Vui lòng chọn tệp tin hình ảnh');
                clearFileInput();
                return;
            }

            setIsCompressing(true);
            try {
                // WHY: Automatic compression and resizing before upload to optimize bandwidth and memory
                // RULE: Dimensions max 1200x1200px, File Size < 1MB
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true
                };

                const compressedFile = await imageCompression(file, options);

                // WHY: Extra validation on dimensions to ensure strictly bounded images
                const img = new Image();
                const objectUrl = URL.createObjectURL(compressedFile);
                img.src = objectUrl;
                img.onload = () => {
                    const MAX_DIMENSION = 1200;
                    if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
                        setImageError(`Ảnh quá lớn (tối đa ${MAX_DIMENSION}x${MAX_DIMENSION}px). Hiện tại: ${img.width}x${img.height}px`);
                        URL.revokeObjectURL(objectUrl);
                        clearFileInput();
                        setIsCompressing(false);
                        return;
                    }

                    setValue('image', compressedFile);
                    setPreview(objectUrl);
                    setIsCompressing(false);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    setImageError('Không thể đọc tệp tin hình ảnh sau khi nén');
                    clearFileInput();
                    setIsCompressing(false);
                };
            } catch (error) {
                console.error('Image compression error:', error);
                setImageError('Lỗi khi nén ảnh. Vui lòng chọn ảnh khác.');
                setIsCompressing(false);
                clearFileInput();
            }
        }

        // WHY: Reset the input value so selecting the same file again triggers onChange (RULE: Input Reset)
        e.target.value = '';
    };

    return (
        <div className="flex flex-col items-center gap-4 py-2">
            <div
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group relative"
            >
                {preview ? (
                    <>
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Thay đổi</span>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[9px] font-black uppercase tracking-widest">Chọn ảnh</span>
                    </div>
                )}
            </div>
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
            />
            {imageError && (
                <div className="text-red-500 text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1 duration-300">
                    {imageError}
                </div>
            )}
        </div>
    );
};

export default ProductImageInput;
