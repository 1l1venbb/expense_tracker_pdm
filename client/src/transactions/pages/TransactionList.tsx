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
    IonBadge
} from '@ionic/react';

import { useTransactions } from '../TransactionProvider';

const TransactionList: React.FC = () => {
    const { transactions, loading, error, connected } = useTransactions();

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Expense Tracker</IonTitle>
                    <IonBadge
                        slot="end"
                        color={connected ? 'success' : 'danger'}
                        className="ion-margin-end"
                    >
                        {connected ? 'Live' : 'Disconnected'}
                    </IonBadge>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {loading ? (
                    <div className="ion-text-center ion-padding">
                        <IonSpinner />
                    </div>
                ) : error ? (
                    <p className="ion-padding">{error}</p>
                ) : transactions.length === 0 ? (
                    <p className="ion-padding">No transactions found.</p>
                ) : (
                    <IonList>
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
            </IonContent>
        </IonPage>
    );
};

export default TransactionList;