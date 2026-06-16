import React from 'react';
import { useOrderLogic } from '../hooks/useOrderLogic';
import DefaultProductImg from '../../images/default-product.png';
import { getIcon } from '../shared/constants/categoryIcons';
import { useAppDispatch } from '../store/hooks';
import { addCustomToCart } from '../store/slices/orderSlice';
import { formatPrice } from '../shared/utils/formatCurrency';
import Icon from '../components/shared/Icon';

const Order = () => {
    const {
        categories,
        filteredCategories,
        filteredProducts,
        activeCategoryId,
        animatingItems,
        scrollContainerRef,
        sidebarRef,
        setCategoryRef,
        handleCategoryClick,
        handleAddToCart,
    } = useOrderLogic();

    const dispatch = useAppDispatch();

    // Custom item states
    const [showCustomModal, setShowCustomModal] = React.useState(false);
    const [customName, setCustomName] = React.useState('');
    const [customPrice, setCustomPrice] = React.useState(0);
    const [customQty, setCustomQty] = React.useState(1);
    const [customType, setCustomType] = React.useState('food');
    const [customNote, setCustomNote] = React.useState('');

    const handleCustomSubmit = (e) => {
        e.preventDefault();
        if (!customName.trim()) {
            alert('Vui lòng nhập tên món');
            return;
        }
        if (customPrice < 0) {
            alert('Giá tiền không hợp lệ');
            return;
        }

        const customItem = {
            id: `custom-${Date.now()}`,
            product_id: null,
            name: customName.trim(),
            price: Number(customPrice),
            quantity: Number(customQty),
            type: customType,
            note: customNote.trim(),
            isCustom: true
        };

        dispatch(addCustomToCart(customItem));

        // Reset and close
        setShowCustomModal(false);
        setCustomName('');
        setCustomPrice(0);
        setCustomQty(1);
        setCustomType('food');
        setCustomNote('');
    };

    const resetCustomForm = () => {
        setCustomName('');
        setCustomPrice(0);
        setCustomQty(1);
        setCustomType('food');
        setCustomNote('');
    };

    return (
        <div className="flex flex-col w-full h-[calc(100vh-134px)]">
            <div className="mdt-order-page w-full max-w-[1200px] mx-auto px-2 flex flex-1 overflow-hidden gap-2 pt-0">
                <aside
                    ref={sidebarRef}
                    className="mdt-order-page__sidebar bg-white w-1/4 min-w-[100px] max-w-[100px] md:min-w-[150px] md:max-w-[200px] border-r border-gray-200 overflow-y-auto hide-scrollbar"
                >
                    <div className="flex flex-col">
                        {/* Custom Item Button */}
                        <button
                            onClick={() => setShowCustomModal(true)}
                            className="item-category flex flex-col items-center justify-center text-center py-[12px] px-[4px] md:px-4 md:py-6 cursor-pointer border-none bg-gradient-to-br from-orange-50 to-orange-100/50 hover:from-orange-100 hover:to-orange-200/50 border-b border-orange-100 transition-all duration-300 group"
                        >
                            <div className="category-icon mb-1 md:mb-2 text-orange-500 bg-orange-100 p-2 rounded-xl group-hover:scale-110 group-hover:bg-orange-200 transition-all duration-300">
                                <Icon name="plus" size={20} strokeWidth={2.5} />
                            </div>
                            <span className="category-name text-[10px] md:text-[11px] font-black uppercase tracking-wider text-orange-600">Món Thêm</span>
                        </button>

                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`item-category flex flex-col items-center justify-center text-center py-[10px] px-[4px] md:px-4 md:py-6 border-none cursor-pointer ${activeCategoryId === category.id
                                    ? 'is-active'
                                    : ''
                                    }`}
                            >
                                <div className="category-icon mb-1 md:mb-2 text-slate-600">
                                    {getIcon(category.icon, { width: 24, height: 24 })}
                                </div>
                                <span className="category-name text-[10px] md:text-[12px] font-bold text-slate-800">{category.name}</span>
                            </button>
                        ))}
                    </div>
                </aside>

                <main
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto  scroll-smooth"
                >
                    <div className="w-full">
                        {filteredCategories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center sm:min-h-[400px]">
                                <Icon name="search" size={64} className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1} />
                                <p className="text-gray-500 font-medium">Không tìm thấy món ăn, thức uống nào</p>
                            </div>
                        ) : (
                            filteredCategories.map((category) => {
                                const categoryProducts = filteredProducts.filter(p => p.category_id === category.id);
                                return (
                                    <section
                                        key={category.id}
                                        ref={setCategoryRef(category.id)}
                                        data-category-id={category.id}
                                        className="product-category-section mb-4 scroll-mt-6"
                                    >
                                        <div className="product-category-section__header flex items-center justify-between mb-3 sticky top-0 mdt-bg-light py-2 z-10">
                                            <h2 className="h5">{category.name}</h2>
                                        </div>

                                        <div className="list-products grid grid-cols-2 lg:grid-cols-3 gap-2">
                                            {categoryProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    className='relative product-item cursor-pointer rounded-[0px_10px_0px_10px] bg-white transition-all duration-300 select-none group'
                                                    onClick={() => handleAddToCart(product)}
                                                >
                                                    <div className="relative overflow-hidden w-full aspect-square bg-gray-50 rounded-tr-[10px]">
                                                        <img
                                                            src={product.image ? (product.image.startsWith('http') ? product.image : `/storage/${product.image}`) : DefaultProductImg}
                                                            onError={(e) => { e.target.src = DefaultProductImg; }}
                                                            alt={product.name}
                                                            className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${animatingItems[product.id] ? 'scale-110 blur-[1px]' : 'group-hover:scale-105 group-active:scale-95'}`}
                                                        />

                                                        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${animatingItems[product.id] ? 'opacity-100 bg-black/20 backdrop-blur-[2px]' : 'opacity-0 bg-transparent pointer-events-none'}`}>
                                                            <div className={`flex flex-col items-center justify-center transition-all duration-500 transform ${animatingItems[product.id] ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-50 opacity-0'}`}>
                                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-[#03b879] rounded-full flex items-center justify-center shadow-lg shadow-[#03b879]/40 mb-1">
                                                                    <Icon name="check" size={20} className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={3} />
                                                                </div>
                                                                <span className="text-white font-bold text-[11px] md:text-[13px] drop-shadow-md tracking-wide">
                                                                    +1 {category.type === 'drink' ? 'Ly' : 'Phần'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative z-8 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] rounded-[0px_10px_0px_10px]  transition-transform duration-300 group-active:translate-y-1">
                                                        <p className='-mt-[10px] z-[9] relative text-center text-[12px] md:text-[14px] bg-white rounded-[0px_10px_0px_10px] p-2'>
                                                            {new Intl.NumberFormat('vi-VN').format(product.price)}đ
                                                        </p>
                                                        <h3 className='mb-0 pt-1 pb-1 text-center px-2 text-[12px] md:text-[14px] font-medium text-gray-700 leading-snug min-h-[40px] flex items-center justify-center'>
                                                            <span className="line-clamp-2">
                                                                {product.name}
                                                                {product.name_vi && ` - ${product.name_vi}`}
                                                            </span>
                                                        </h3>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            {/* Custom Item Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-[24px] sm:rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                                    <Icon name="plus" size={18} className="text-orange-500" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <p className="m-0 text-[9px] font-black uppercase tracking-widest text-gray-600 leading-none mb-0.5">Gọi món tự do</p>
                                    <h6 className="m-0 leading-tight">
                                        Thêm Món Ngoài
                                    </h6>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCustomModal(false);
                                    resetCustomForm();
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors border-none cursor-pointer text-gray-500 active:scale-95"
                            >
                                <Icon name="close" size={15} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={handleCustomSubmit} className="p-5 overflow-y-auto space-y-4">
                            {/* Product Type Toggle */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest">Loại Món</label>
                                <div className="grid grid-cols-3 gap-1.5 bg-gray-50 p-1.5 rounded-xl border border-gray-100/80">
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('food')}
                                        className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border-none transition-all cursor-pointer ${customType === 'food' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/15' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        🍔 Food
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('drink')}
                                        className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border-none transition-all cursor-pointer ${customType === 'drink' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/15' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Drink
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCustomType('packaged_drink')}
                                        className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider border-none transition-all cursor-pointer ${customType === 'packaged_drink' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/15' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Packaged Drink
                                    </button>
                                </div>
                            </div>

                            {/* Item Name */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest">Tên Món</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-md px-3.5 py-2.5 text-[16px] focus:outline-none  transition-all text-gray-800 placeholder-gray-800"
                                    placeholder="Ví dụ: Hàu nướng mỡ hành..."
                                    value={customName}
                                    onChange={(e) => setCustomName(e.target.value)}
                                />
                            </div>

                            {/* Price & Quantity Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Price */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest">Đơn Giá (VNĐ)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-md px-3.5 py-2.5 text-[16px] focus:outline-none  transition-all font-black"
                                        placeholder="Mức giá..."
                                        value={customPrice === 0 ? '' : formatPrice(customPrice)}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/\D/g, "");
                                            setCustomPrice(rawValue ? parseInt(rawValue, 10) : 0);
                                        }}
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest">Số Lượng</label>
                                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl p-1 justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setCustomQty(Math.max(1, customQty - 1))}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-150 hover:bg-gray-100 text-gray-600 active:scale-95 transition-all cursor-pointer"
                                        >
                                            <Icon name="minus" size={14} strokeWidth={3} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="w-12 text-center bg-transparent border-none py-1 focus:outline-none font-black text-sm text-gray-800"
                                            value={customQty}
                                            onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCustomQty(customQty + 1)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 hover:bg-orange-600 text-white active:scale-95 transition-all cursor-pointer shadow-sm shadow-orange-500/20"
                                        >
                                            <Icon name="plus" size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Note */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ghi Chú</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-100 rounded-md px-3.5 py-2 text-[16px] focus:outline-none focus:bg-white transition-all text-gray-800 placeholder-gray-400 resize-none h-16"
                                    placeholder="Ví dụ: Ít cay, không đá..."
                                    value={customNote}
                                    onChange={(e) => setCustomNote(e.target.value)}
                                />
                            </div>

                            {/* Footer Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-50 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCustomModal(false);
                                        resetCustomForm();
                                    }}
                                    className="flex-1 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold rounded-xl border border-gray-100 active:scale-98 transition-all cursor-pointer text-xs uppercase tracking-wider"
                                >
                                    Hủy Bỏ
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl border-none active:scale-98 transition-all cursor-pointer text-xs uppercase tracking-wider shadow-lg shadow-orange-500/15"
                                >
                                    Thêm Vào Đơn
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Order;
