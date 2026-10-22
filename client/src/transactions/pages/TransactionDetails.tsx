import { useParams } from 'react-router-dom';
import {
    IonBackButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonPage,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner
} from '@ionic/react';
import { useEffect, useState } from 'react';
import type { Transaction } from '../model/Transaction';
import { getTransaction } from '../services/transactionAPI';

const TransactionDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransaction = async () => {
            try {
                const data = await getTransaction(Number(id));
                setTransaction(data);
            } catch (error) {
                console.error('Failed to fetch transaction:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransaction();
    }, [id]);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonBackButton defaultHref="/transactions" />
                    </IonButtons>
                    <IonTitle>Transaction Details</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent>
                {loading ? (
                    <IonSpinner />
                ) : transaction ? (
                    <IonList>
                        <IonItem><IonLabel>Title: {transaction.title}</IonLabel></IonItem>
                        <IonItem><IonLabel>Amount: {transaction.amount} RON</IonLabel></IonItem>
                        <IonItem><IonLabel>Category: {transaction.category}</IonLabel></IonItem>
                        <IonItem><IonLabel>Date: {transaction.date}</IonLabel></IonItem>
                        <IonItem><IonLabel>Description: {transaction.description}</IonLabel></IonItem>
                        <IonItem><IonLabel>Recurring: {transaction.isRecurring ? 'Yes' : 'No'}</IonLabel></IonItem>
                        <IonItem><IonLabel>Type: {transaction.type}</IonLabel></IonItem>
                    </IonList>
                ) : (
                    <p className="ion-padding">Transaction not found.</p>
                )}
            </IonContent>
        </IonPage>
    );
};

export default TransactionDetails;