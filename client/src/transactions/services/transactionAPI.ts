import axios from 'axios';
import type { Transaction } from "../model/Transaction";

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

// Attach the JWT (if any) to every request.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// If the token is rejected (expired/invalid), log the user out.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new Event('auth:logout'));
        }
        return Promise.reject(error);
    }
);

export interface TransactionPage {
    transactions: Transaction[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface TransactionQuery {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'income' | 'expense';
}

export const createTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const response = await api.post<Transaction>('/transactions', transaction);
    return response.data;
};

export const getTransactions = async (query: TransactionQuery = {}): Promise<TransactionPage> => {
    const response = await api.get<TransactionPage>('/transactions', { params: query });
    return response.data;
};

export const getTransaction = async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
};
