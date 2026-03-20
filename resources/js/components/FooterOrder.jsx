import React from 'react';

export default function FooterOrder() {
    return (
        <footer className="footer-order fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40">
            <div className="max-w-[1200px] mx-auto px-2 h-20 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-md text-gray-600 font-medium leading-none">Thành tiền: 500Đ</span>
                    <span className="text-sm ">Mặt hàng: 4</span>
                </div>

                <div className="flex items-center gap-3">
                    <button className="mdt-btn">
                        Tiếp
                        <svg width="24px" height="24px" stroke-width="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M9 6L15 12L9 18" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>
                </div>
            </div>
        </footer>
    );
}
