import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

export interface AuthUser {
    id: number;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export const register = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    return response.data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
};
