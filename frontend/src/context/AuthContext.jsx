import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/apiClient';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ar_user') || 'null'));
    const [token, setToken] = useState(() => localStorage.getItem('ar_token') || null);
    const [loading, setLoading] = useState(false);

    const persist = (tok, usr) => {
        setToken(tok); setUser(usr);
        localStorage.setItem('ar_token', tok);
        localStorage.setItem('ar_user', JSON.stringify(usr));
    };

    const login = async (creds) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', creds);
            persist(data.access_token, data.user);
            return data;
        } finally { setLoading(false); }
    };

    const signup = async (creds) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/signup', creds);
            persist(data.access_token, data.user);
            return data;
        } finally { setLoading(false); }
    };

    const logout = () => {
        setToken(null); setUser(null);
        localStorage.removeItem('ar_token');
        localStorage.removeItem('ar_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
