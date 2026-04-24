import React from 'react';
import ProductItem from '../ProductItem';

const CheckoutItemList = ({
    selectedItems,
    handleUpdateQuantity,
    handleUpdateNote,
    guestCount,
    onUpdateGuestCount
}) => {
    return (
        <main className="px-2 pt-4 max-w-2xl mx-auto space-y-4">
            <div className="list-products bg-white rounded-md shadow-sm py-5 px-4 mb-4">
                {selectedItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Chưa có món nào được chọn</p>
                ) : (
                    <>

                        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-4">
                            <label className='flex-shrink-0 font-bold text-gray-700'>Số lượng khách:</label>
                            <input 
                                className='w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500' 
                                type="number" 
                                min="1"
                                placeholder="Số lượng khách" 
                                value={guestCount}
                                onChange={(e) => onUpdateGuestCount(e.target.value)}
                            />
                        </div>

                        {selectedItems.map((item) => (
                            <ProductItem
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onUpdateNote={handleUpdateNote}
                                showNoteButton={true}
                            />
                        ))}
                    </>
                )}
            </div>
        </main>
    );
};

export default React.memo(CheckoutItemList);
