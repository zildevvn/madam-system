import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LogoImg from '../../images/Logo.png';

export default function HeaderOrder() {
    const navigate = useNavigate();
    const { tableId } = useParams();

    return (
        <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
            <div className="max-w-[1200px] mx-auto px-2 h-auto grid grid-cols-3 items-center">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/staff-order')}
                        className="mdt-btn-back p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer"
                    >
                        <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M21 12L3 12M3 12L11.5 3.5M3 12L11.5 20.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                    </button>

                </div>

                <div className="flex justify-center">
                    <img src={LogoImg} alt="logo" className="w-full max-w-[70px] md:max-w-[100px] h-auto" />
                </div>

                <div className="flex items-center justify-end gap-2 md:gap-4">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors border-none bg-transparent cursor-pointer text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
            </div>
        </header>
    );
}
