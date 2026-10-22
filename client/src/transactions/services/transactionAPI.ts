import axios from 'axios';
import type {Transaction} from "../model/Transaction";

const api = axios.create({
    baseURL: 'http://localhost:3000'
});

export const getTransactions = async () => {
    const response = await api.get<Transaction[]>('/transactions');
    return response.data;
}

export const getTransaction = async (id: number): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/transactions/${id}`);
    return response.data;
};