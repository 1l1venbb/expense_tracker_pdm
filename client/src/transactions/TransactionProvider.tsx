import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useState,
    type ReactNode
} from 'react';

import type { Transaction } from './model/Transaction';
import { getTransactions } from './services/transactionAPI';

type Action =
    | { type: 'FETCH_SUCCESS'; transactions: Transaction[] }
    | { type: 'CREATED'; transaction: Transaction }
    | { type: 'UPDATED'; transaction: Transaction }
    | { type: 'DELETED'; id: number };

interface TransactionContextValue {
    transactions: Transaction[];
    loading: boolean;
    error: string | null;
    connected: boolean;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(
    undefined
);

function transactionReducer(
    state: Transaction[],
    action: Action
): Transaction[] {
    switch (action.type) {
        case 'FETCH_SUCCESS':
            return action.transactions;

        case 'CREATED':
            if (state.some(t => t.id === action.transaction.id)) {
                return state.map(t =>
                    t.id === action.transaction.id ? action.transaction : t
                );
            }
            return [...state, action.transaction];

        case 'UPDATED':
            return state.map(t =>
                t.id === action.transaction.id ? action.transaction : t
            );

        case 'DELETED':
            return state.filter(t => t.id !== action.id);

        default:
            return state;
    }
}

export function TransactionProvider({ children }: { children: ReactNode }) {
    const [transactions, dispatch] = useReducer(transactionReducer, []);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        let active = true;
        let initialLoadFinished = false;

        // Events arriving during the initial REST request are queued.
        const pendingEvents: Action[] = [];

        const applyEvent = (action: Action) => {
            if (!initialLoadFinished) {
                pendingEvents.push(action);
            } else {
                dispatch(action);
            }
        };

        const socket = new WebSocket('ws://localhost:3000');

        socket.onopen = () => {
            if (active) setConnected(true);
        };

        socket.onclose = () => {
            if (active) setConnected(false);
        };

        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                switch (message.event) {
                    case 'transaction_created':
                        applyEvent({
                            type: 'CREATED',
                            transaction: message.transaction
                        });
                        break;

                    case 'transaction_updated':
                        applyEvent({
                            type: 'UPDATED',
                            transaction: message.transaction
                        });
                        break;

                    case 'transaction_deleted':
                        applyEvent({
                            type: 'DELETED',
                            id: message.transaction.id
                        });
                        break;
                }
            } catch (err) {
                console.error('Invalid WebSocket message:', err);
            }
        };

        const loadTransactions = async () => {
            try {
                const data = await getTransactions();

                if (active) {
                    dispatch({ type: 'FETCH_SUCCESS', transactions: data });
                }
            } catch (err) {
                if (active) {
                    setError('Failed to load transactions.');
                    console.error(err);
                }
            } finally {
                if (active) {
                    initialLoadFinished = true;
                    pendingEvents.forEach(dispatch);
                    setLoading(false);
                }
            }
        };

        // Wait until WebSocket is connected before loading the snapshot.
        socket.addEventListener('open', loadTransactions, { once: true });

        return () => {
            active = false;
            socket.close();
        };
    }, []);

    return (
        <TransactionContext.Provider
            value={{ transactions, loading, error, connected }}
        >
            {children}
        </TransactionContext.Provider>
    );
}

export function useTransactions() {
    const context = useContext(TransactionContext);

    if (!context) {
        throw new Error('useTransactions must be used inside TransactionProvider');
    }

    return context;
}