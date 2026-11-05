import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode
} from 'react';

import type { Transaction, PendingTransaction } from './model/Transaction';
import { createTransaction, getTransactions } from './services/transactionAPI';
import { useAuth } from '../auth/AuthProvider';
import { useNetworkStatus } from '../shared/useNetworkStatus';

const PAGE_SIZE = 5;
const CACHE_KEY = 'expense_tracker_cache';
const PENDING_KEY = 'expense_tracker_pending';

export type TypeFilter = 'all' | 'income' | 'expense';

function readJSON<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

// Keeps a local copy of every transaction we've ever fetched from the
// server, so the app has something to show when it's offline.
function updateCache(fresh: Transaction[]): Transaction[] {
    const cached = readJSON<Transaction[]>(CACHE_KEY, []);
    const merged = [...fresh, ...cached.filter(c => !fresh.some(f => f.id === c.id))];
    localStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    return merged;
}

function filterLocally(transactions: Transaction[], search: string, type: TypeFilter): Transaction[] {
    return transactions.filter(t => {
        const matchesType = type === 'all' || t.type === type;
        const text = search.trim().toLowerCase();
        const matchesSearch = !text ||
            t.title.toLowerCase().includes(text) ||
            t.category.toLowerCase().includes(text) ||
            t.description.toLowerCase().includes(text);
        return matchesType && matchesSearch;
    });
}

// Tries to send every locally-queued transaction to the server. Returns
// only the ones that still failed (e.g. still offline).
async function syncPending(pending: PendingTransaction[]): Promise<PendingTransaction[]> {
    const stillPending: PendingTransaction[] = [];

    for (const { id, pending: isPending, ...payload } of pending) {
        try {
            await createTransaction(payload);
        } catch {
            stillPending.push({ id, pending: isPending, ...payload });
        }
    }

    return stillPending;
}

interface TransactionContextValue {
    transactions: Transaction[];
    pendingTransactions: PendingTransaction[];
    loading: boolean;
    error: string | null;
    online: boolean;
    wsConnected: boolean;
    page: number;
    totalPages: number;
    search: string;
    typeFilter: TypeFilter;
    setPage: (page: number) => void;
    setSearch: (search: string) => void;
    setTypeFilter: (type: TypeFilter) => void;
    addExpense: (expense: Omit<Transaction, 'id' | 'type'>) => Promise<{ synced: boolean }>;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth();
    const online = useNetworkStatus();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>(
        () => readJSON<PendingTransaction[]>(PENDING_KEY, [])
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wsConnected, setWsConnected] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

    // Always holds the latest pending queue, updated synchronously (not via
    // a useEffect) so concurrent async callbacks never read a stale value.
    const pendingRef = useRef(pendingTransactions);

    // Guards against flushing the same queue twice concurrently (e.g. the
    // initial fetch and a WebSocket notification landing at the same time).
    const syncingRef = useRef(false);

    const savePending = (items: PendingTransaction[]) => {
        pendingRef.current = items;
        setPendingTransactions(items);
        localStorage.setItem(PENDING_KEY, JSON.stringify(items));
    };

    const flushPending = async () => {
        if (syncingRef.current || pendingRef.current.length === 0) return;

        syncingRef.current = true;
        try {
            const before = pendingRef.current.length;
            const remaining = await syncPending(pendingRef.current);
            if (remaining.length !== before) {
                savePending(remaining);
                fetchPage(); // refresh the list with the now-synced item(s)
            }
        } finally {
            syncingRef.current = false;
        }
    };

    const fetchPage = async () => {
        if (!token) return;

        setLoading(true);
        setError(null);
        try {
            const data = await getTransactions({
                page,
                limit: PAGE_SIZE,
                search: search.trim() || undefined,
                type: typeFilter === 'all' ? undefined : typeFilter
            });
            setTransactions(data.transactions);
            setTotalPages(data.totalPages);
            updateCache(data.transactions);

            // The server is reachable: this is also a good moment to flush
            // anything that only made it into the local pending queue.
            flushPending();
        } catch {
            // Server unreachable (or we're offline): fall back to the local cache.
            const cached = filterLocally(readJSON<Transaction[]>(CACHE_KEY, []), search, typeFilter);
            const start = (page - 1) * PAGE_SIZE;
            setTransactions(cached.slice(start, start + PAGE_SIZE));
            setTotalPages(Math.max(1, Math.ceil(cached.length / PAGE_SIZE)));
            setError('Could not reach the server — showing locally saved data.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch whenever auth, pagination or the search/filter changes, and
    // open a (per-user) WebSocket that just re-fetches on any notification.
    useEffect(() => {
        if (!token) {
            setTransactions([]);
            setLoading(false);
            setWsConnected(false);
            return;
        }

        fetchPage();

        const socket = new WebSocket(`ws://localhost:3000?token=${token}`);
        socket.onopen = () => setWsConnected(true);
        socket.onclose = () => setWsConnected(false);
        socket.onmessage = () => fetchPage();

        return () => socket.close();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, page, search, typeFilter]);

    // Reset back to page 1 whenever the search/filter changes.
    useEffect(() => {
        setPage(1);
    }, [search, typeFilter]);

    // As soon as the browser regains connectivity, try to flush anything
    // that was only stored locally while offline. (The same flush also runs
    // after every successful fetch, which covers the server recovering
    // while the browser was online the whole time.)
    useEffect(() => {
        if (online && token) flushPending();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [online, token]);

    const addExpense = async (expense: Omit<Transaction, 'id' | 'type'>) => {
        const payload = { ...expense, type: 'expense' as const };

        if (online) {
            try {
                await createTransaction(payload);
                await fetchPage();
                return { synced: true };
            } catch {
                // REST call failed even though we appear to be online: fall through
                // and store it locally, same as the offline path below.
            }
        }

        const pendingItem: PendingTransaction = {
            ...payload,
            id: `local-${Date.now()}`,
            pending: true
        };
        savePending([...pendingRef.current, pendingItem]);
        return { synced: false };
    };

    return (
        <TransactionContext.Provider
            value={{
                transactions, pendingTransactions, loading, error, online, wsConnected,
                page, totalPages, search, typeFilter,
                setPage, setSearch, setTypeFilter, addExpense
            }}
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
