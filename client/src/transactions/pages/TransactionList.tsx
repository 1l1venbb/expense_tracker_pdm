import { useEffect, useState } from "react";

import {
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonSpinner,
    IonTitle,
    IonToolbar
} from '@ionic/react';

import type { Transaction } from '../model/Transaction';
import { getTransactions } from '../services/transactionAPI';


const TransactionList: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const fetchTransactions = async () => {
            try{
                const data = await getTransactions();

                if(active){
                    setTransactions(data);
                }
            }catch(error){
                if(active){
                    setError("Failed to fetch transactions.");
                    console.log(error);
                }
            }finally{
                if(active){
                    setLoading(false);
                }
            }
        };

        fetchTransactions();

        return () => {
            active = false;
        }
    }, []);

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Expense Tracker</IonTitle>
                </IonToolbar>
            </IonHeader>


            <IonContent>

                {loading ? (
                    <div className="ion-text-center ion-padding">
                        <IonSpinner />
                    </div>
                ) : error ? (<p className="ion-padding">{error}</p>) :
                    (
                     <IonList>
                         {
                             transactions.map(transaction => (
                                 <IonItem key={transaction.id} button routerLink={`/transactions/${transaction.id}`} routerDirection="forward">
                                     <IonLabel>
                                         <h2>{transaction.title}</h2>
                                         <p>{transaction.category} · {transaction.date}</p>
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