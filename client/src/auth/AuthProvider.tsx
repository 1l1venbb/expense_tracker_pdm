import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode
} from 'react';

import {
    login as loginRequest,
    register as registerRequest,
    type AuthUser
} from './services/authAPI';

interface AuthContextValue {
    token: string | null;
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem('authUser');
    return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
    const [user, setUser] = useState<AuthUser | null>(readStoredUser);

    const persist = (token: string, user: AuthUser) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authUser', JSON.stringify(user));
        setToken(token);
        setUser(user);
    };

    const login = async (email: string, password: string) => {
        const data = await loginRequest(email, password);
        persist(data.token, data.user);
    };

    const register = async (email: string, password: string) => {
        const data = await registerRequest(email, password);
        persist(data.token, data.user);
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        setToken(null);
        setUser(null);
    };

    // The API client dispatches this event when a request comes back 401
    // (expired/invalid token), so an expired session logs itself out.
    useEffect(() => {
        window.addEventListener('auth:logout', logout);
        return () => window.removeEventListener('auth:logout', logout);
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}
