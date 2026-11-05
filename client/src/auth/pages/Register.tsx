import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
    IonButton, IonContent, IonHeader, IonInput, IonItem,
    IonList, IonPage, IonTitle, IonToolbar
} from '@ionic/react';

import { useAuth } from '../AuthProvider';

const Register: React.FC = () => {
    const { token, register } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (token) {
        return <Navigate to="/transactions" replace />;
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (password.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            await register(email.trim(), password);
            navigate('/transactions', { replace: true });
        } catch {
            setError('Could not create an account with this email.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Create account</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={submit} aria-label="Register">
                    <IonList>
                        <IonItem>
                            <IonInput label="Email" labelPlacement="stacked" type="email" value={email}
                                required disabled={submitting}
                                onIonInput={event => setEmail(event.detail.value ?? '')} />
                        </IonItem>
                        <IonItem>
                            <IonInput label="Password" labelPlacement="stacked" type="password" value={password}
                                required disabled={submitting}
                                onIonInput={event => setPassword(event.detail.value ?? '')} />
                        </IonItem>
                    </IonList>
                    {error && <p role="alert">{error}</p>}
                    <IonButton type="submit" expand="block" disabled={submitting}>
                        {submitting ? 'Creating account…' : 'Register'}
                    </IonButton>
                </form>
                <p className="ion-padding-top ion-text-center">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </IonContent>
        </IonPage>
    );
};

export default Register;
