import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/slices/authSlice";

import TeamImg from '../../images/image-madam.jpg';
import LogoImg from '../../images/logo.png';

export default function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useAppDispatch();
    const { user, status, error: reduxError } = useAppSelector(state => state.auth);
    const [localError, setLocalError] = useState("");
    const navigate = useNavigate();

    const loading = status === 'loading';
    const error = reduxError || localError;

    useEffect(() => {
        if (user) {
            const role = user.role?.toLowerCase();
            if (role === 'admin') {
                navigate("/admin");
            } else if (role === 'kitchen') {
                navigate("/kitchen");
            } else if (role === 'accountant' || role === 'cashier') {
                navigate("/cashier");
            } else {
                navigate("/staff-order");
            }
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalError("");

        if (!username || !password) {
            setLocalError("Please enter both username and password.");
            return;
        }

        dispatch(login({ username, password }));
    };

    return (
        <div
            className="md-home-main min-h-screen flex flex-col justify-center py-12 px-[20px] bg-cover bg-center bg-no-repeat"
        >
            <div className="md-home__login bg-white bg-opacity-80 backdrop-filter backdrop-blur-md rounded-2xl shadow-2xl  p-8 max-w-4xl w-full space-y-8 md:space-y-0 md:space-x-8 mx-auto">
                <div className="w-full flex justify-center mb-8">
                    <img src={LogoImg} alt="VM Travel Logo" className="max-w-[100px] w-full h-auto" />
                </div>

                <div className="w-full flex flex-col md:flex-row items-center justify-center space-y-8 md:space-y-0 md:space-x-8 mx-auto">
                    <div className="hidden lg:flex w-full md:w-1/2 items-center justify-center">
                        <img src={TeamImg} alt="VM Travel Team" className="rounded-xl shadow-lg w-full h-auto" />
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col items-center">
                        <form id="loginForm" className="w-full max-w-sm" onSubmit={handleLogin}>
                            <div className="mb-4">
                                <label htmlFor="username" className="block text-gray-700 text-sm font-semibold mb-2">Username:</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Username"
                                />
                            </div>
                            <div className="mb-6 relative">
                                <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Password"
                                />
                                <button type="button" id="togglePassword" className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500" onClick={() => {
                                    const input = document.getElementById('password');
                                    input.type = input.type === 'password' ? 'text' : 'password';
                                    document.getElementById('eye-open').classList.toggle('hidden');
                                    document.getElementById('eye-closed').classList.toggle('hidden');
                                }}>
                                    <svg id="eye-open" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                    </svg>
                                    <svg id="eye-closed" className="h-5 w-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.25V19.75M10.125 18.25V19.75M13.875 14.25a3.125 3.125 0 01-3.125-3.125h0c0-1.72 1.405-3.125 3.125-3.125a3.125 3.125 0 013.125 3.125h0"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c-1.857 2.455-4.52 4.125-7.5 4.125-2.98 0-5.643-1.67-7.5-4.125M21 12a.75.75 0 00-.75-.75h0a.75.75 0 00-.75.75"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className="mb-6 flex items-center justify-between">
                                <div className="flex items-center">
                                    <input type="checkbox" id="remember" name="remember" className="h-4 w-4 text-blue-600 rounded" />
                                    <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Remember Me</label>
                                </div>
                            </div>

                            {error && (
                                <div id="message" className="text-red-500 text-center mb-4 text-sm font-semibold">{error} </div>
                            )}

                            <div className="flex items-center justify-between space-x-4">
                                <button type="submit" disabled={loading} className={`mdt-btn${loading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {loading ? 'Logging in...' : 'Log In'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
