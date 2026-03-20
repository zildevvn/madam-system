export default function FooterStaffOrder() {
    return (
        <footer className="footer-staff-order bg-white w-full border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <div className="w-full max-w-[1200px] mx-auto px-[20px] py-2">
                <div className="flex justify-between items-center">
                    <button className="footer-item flex flex-col items-center gap-1 text-orange-500 font-semibold border-none bg-transparent cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        <span className="text-[10px] uppercase tracking-wider">Đơn hàng</span>
                    </button>

                    <button className="footer-item flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors duration-200 border-none bg-transparent cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                        <span className="text-[10px] uppercase tracking-wider">Chọn bàn</span>
                    </button>

                    <button className="footer-item flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors duration-200 border-none bg-transparent cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        <span className="text-[10px] uppercase tracking-wider">Thanh toán</span>
                    </button>

                    <button className="footer-item flex flex-col items-center gap-1 text-gray-400 hover:text-orange-500 transition-colors duration-200 border-none bg-transparent cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                        <span className="text-[10px] uppercase tracking-wider">QR Order</span>
                    </button>
                </div>
            </div>
        </footer>
    );
}