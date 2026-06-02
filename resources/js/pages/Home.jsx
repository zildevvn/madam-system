import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { login } from "../store/slices/authSlice";
import Icon from "../components/shared/Icon";

import TeamImg from '../../images/image-madam.jpg';
import LogoImg from '../../images/logo.png';

export default function Home() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const dispatch = useAppDispatch();
    const { user, status, error: reduxError } = useAppSelector(state => state.auth);
    const [localError, setLocalError] = useState("");
    const navigate = useNavigate();

    const loading = status === 'loading';
    const error = reduxError || localError;

    useEffect(() => {
        if (user) {
            const role = user.role?.toLowerCase();
            switch (role) {
                case 'admin':
                    navigate("/admin");
                    break;
                case 'kitchen':
                    navigate("/kitchen");
                    break;
                case 'bar':
                    navigate("/bar");
                    break;
                case 'cashier':
                    navigate("/cashier");
                    break;
                case 'bill':
                    navigate("/bills");
                    break;
                case 'manager':
                case 'order_staff':
                case 'seller':
                    navigate("/staff-order");
                    break;
                default:
                    navigate("/");
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
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-2 pr-10 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    placeholder="Password"
                                />
                                <button type="button" id="togglePassword" className="absolute inset-y-0 right-0 top-6 flex items-center pr-3 text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <Icon name="eye" className="h-5 w-5" size={20} strokeWidth={2} />
                                    ) : (
                                        <Icon name="eyeOff" className="h-5 w-5" size={20} strokeWidth={2} />
                                    )}
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
