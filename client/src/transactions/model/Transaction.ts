export interface Transaction {
    id: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    description: string;
    isRecurring: boolean;
    type: 'income' | 'expense';
}