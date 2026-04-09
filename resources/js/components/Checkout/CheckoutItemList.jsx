import React from 'react';
import ProductItem from '../ProductItem';

const CheckoutItemList = ({ 
    selectedItems, 
    handleUpdateQuantity, 
    handleUpdateNote 
}) => {
    return (
        <main className="px-2 pt-4 max-w-2xl mx-auto space-y-4">
            <div className="list-products bg-white rounded-md shadow-sm py-5 px-4 mb-4">
                {selectedItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">Chưa có món nào được chọn</p>
                ) : (
                    selectedItems.map((item) => (
                        <ProductItem
                            key={item.id}
                            item={item}
                            onUpdateQuantity={handleUpdateQuantity}
                            onUpdateNote={handleUpdateNote}
                            showNoteButton={true}
                        />
                    ))
                )}
            </div>
        </main>
    );
};

export default React.memo(CheckoutItemList);
