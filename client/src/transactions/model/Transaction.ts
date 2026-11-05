export interface Transaction {
    id: number;
    userId?: number;
    title: string;
    amount: number;
    category: string;
    date: string;
    description: string;
    isRecurring: boolean;
    type: 'income' | 'expense';
}

// A transaction created while offline (or while the server was unreachable),
// kept only in local storage until it can be sent to the server.
export interface PendingTransaction extends Omit<Transaction, 'id'> {
    id: string;
    pending: true;
}
