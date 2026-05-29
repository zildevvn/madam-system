import { useAppSelector } from '../store/hooks';

/**
 * useCurrentUser Custom Hook
 * [WHY] Centralizes current authenticated user retrieval with safe fallback to localStorage.
 */
export const useCurrentUser = () => {
    const { user } = useAppSelector(state => state.auth);

    if (user) {
        return user;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        try {
            return JSON.parse(storedUser);
        } catch (e) {
            console.warn('Invalid user data in localStorage, clearing...', e);
            localStorage.removeItem('user');
        }
    }

    return null;
};
