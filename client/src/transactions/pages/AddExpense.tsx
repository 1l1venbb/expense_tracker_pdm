import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    IonButton, IonButtons, IonContent, IonHeader, IonInput, IonItem,
    IonList, IonPage, IonTextarea, IonTitle, IonToggle, IonToolbar
} from '@ionic/react';
import { useTransactions } from '../TransactionProvider';

const today = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const AddExpense: React.FC = () => {
    const { addExpense } = useTransactions();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(today);
    const [description, setDescription] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const submitting = useRef(false);

    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (submitting.current) return;
        const numericAmount = Number(amount);
        if (!title.trim() || !category.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
            !Number.isFinite(numericAmount) || numericAmount <= 0) {
            setError('Enter a title, category, date, and an amount greater than zero.');
            return;
        }

        submitting.current = true;
        setSaving(true);
        setError(null);
        try {
            await addExpense({
                title: title.trim(), amount: numericAmount, category: category.trim(),
                date, description: description.trim(), isRecurring
            });
            navigate('/transactions', { replace: true });
        } catch {
            setError('Could not save the expense. Please try again.');
        } finally {
            submitting.current = false;
            setSaving(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonButtons slot="start">
                        <IonButton disabled={saving} onClick={() => navigate('/transactions', { replace: true })}>
                            Cancel
                        </IonButton>
                    </IonButtons>
                    <IonTitle>Add expense</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={save} aria-label="Add expense">
                    <IonList>
                        <IonItem>
                            <IonInput label="Title" labelPlacement="stacked" value={title} required
                                disabled={saving} onIonInput={event => setTitle(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonInput label="Amount (RON)" labelPlacement="stacked" type="number"
                                inputmode="decimal" min="0.01" step="0.01" value={amount} required
                                disabled={saving} onIonInput={event => setAmount(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonInput label="Category" labelPlacement="stacked" value={category} required
                                disabled={saving} onIonInput={event => setCategory(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonInput label="Date" labelPlacement="stacked" type="date" value={date} required
                                disabled={saving} onIonInput={event => setDate(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonTextarea label="Description (optional)" labelPlacement="stacked" value={description}
                                disabled={saving} onIonInput={event => setDescription(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonToggle checked={isRecurring} disabled={saving}
                                onIonChange={event => setIsRecurring(event.detail.checked)}>
                                Recurring expense
                            </IonToggle>
                        </IonItem>
                    </IonList>
                    {error && <p role="alert">{error}</p>}
                    <IonButton type="submit" expand="block" disabled={saving}>
                        {saving ? 'Saving…' : 'Save expense'}
                    </IonButton>
                </form>
            </IonContent>
        </IonPage>
    );
};

export default AddExpense;
