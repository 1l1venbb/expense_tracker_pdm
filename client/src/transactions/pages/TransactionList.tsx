import { useLocation } from 'react-router-dom';
import {
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner,
    IonTitle,
    IonToolbar,
    IonBadge,
    IonButton,
    IonButtons,
    IonSearchbar,
    IonSegment,
    IonSegmentButton
} from '@ionic/react';

import { useTransactions, type TypeFilter } from '../TransactionProvider';
import { useAuth } from '../../auth/AuthProvider';

const TransactionList: React.FC = () => {
    const {
        transactions, pendingTransactions, loading, error, online, wsConnected,
        page, totalPages, search, typeFilter, setPage, setSearch, setTypeFilter
    } = useTransactions();
    const { user, logout } = useAuth();
    const location = useLocation();
    const offlineSaved = Boolean((location.state as { offlineSaved?: boolean } | null)?.offlineSaved);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Expense Tracker</IonTitle>
                    <IonButtons slot="end">
                        <IonBadge color={online ? 'success' : 'danger'} className="ion-margin-end">
                            {online ? 'Online' : 'Offline'}
                        </IonBadge>
                        <IonBadge color={wsConnected ? 'success' : 'medium'} className="ion-margin-end">
                            {wsConnected ? 'Live' : 'Not live'}
                        </IonBadge>
                        <IonButton onClick={logout}>Logout</IonButton>
                    </IonButtons>
                </IonToolbar>
                <IonToolbar>
                    <IonSearchbar
                        value={search}
                        debounce={300}
                        placeholder="Search title, category, description…"
                        onIonInput={event => setSearch(event.detail.value ?? '')}
                    />
                </IonToolbar>
                <IonToolbar>
                    <IonSegment
                        value={typeFilter}
                        onIonChange={event => setTypeFilter((event.detail.value as TypeFilter) ?? 'all')}
                    >
                        <IonSegmentButton value="all">
                            <IonLabel>All</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="expense">
                            <IonLabel>Expenses</IonLabel>
                        </IonSegmentButton>
                        <IonSegmentButton value="income">
                            <IonLabel>Income</IonLabel>
                        </IonSegmentButton>
                    </IonSegment>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                <div className="ion-padding">
                    <IonButton routerLink="/transactions/new" routerDirection="forward">
                        Add expense
                    </IonButton>
                    {user && <p>Logged in as {user.email}</p>}
                    {offlineSaved && (
                        <p role="status">Could not reach the server — your expense was saved locally and will sync automatically once you're back online.</p>
                    )}
                    {pendingTransactions.length > 0 && (
                        <p role="status">
                            <IonBadge color="warning">
                                {pendingTransactions.length} not sent to the server yet
                            </IonBadge>
                        </p>
                    )}
                </div>

                {error && <p className="ion-padding">{error}</p>}

                {loading ? (
                    <div className="ion-text-center ion-padding">
                        <IonSpinner />
                    </div>
                ) : transactions.length === 0 && pendingTransactions.length === 0 ? (
                    <p className="ion-padding">No transactions found.</p>
                ) : (
                    <IonList>
                        {pendingTransactions.map(transaction => (
                            <IonItem key={transaction.id}>
                                <IonLabel>
                                    <h2>{transaction.title}</h2>
                                    <p>{transaction.category} · {transaction.date}</p>
                                </IonLabel>
                                <IonBadge slot="end" color="warning" className="ion-margin-end">
                                    Pending
                                </IonBadge>
                                <IonLabel slot="end" className="ion-text-end">
                                    {transaction.type === 'expense' ? '-' : '+'}
                                    {transaction.amount.toFixed(2)} RON
                                </IonLabel>
                            </IonItem>
                        ))}

                        {transactions.map(transaction => (
                            <IonItem
                                key={transaction.id}
                                button
                                routerLink={`/transactions/${transaction.id}`}
                                routerDirection="forward"
                            >
                                <IonLabel>
                                    <h2>{transaction.title}</h2>
                                    <p>
                                        {transaction.category} · {transaction.date}
                                    </p>
                                </IonLabel>

                                <IonLabel slot="end" className="ion-text-end">
                                    {transaction.type === 'expense' ? '-' : '+'}
                                    {transaction.amount.toFixed(2)} RON
                                </IonLabel>
                            </IonItem>
                        ))}
                    </IonList>
                )}

                <div className="ion-padding ion-text-center">
                    <IonButton disabled={page <= 1} onClick={() => setPage(page - 1)}>
                        Previous
                    </IonButton>
                    <span className="ion-padding-start ion-padding-end">
                        Page {page} of {totalPages}
                    </span>
                    <IonButton disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                        Next
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default TransactionList;
