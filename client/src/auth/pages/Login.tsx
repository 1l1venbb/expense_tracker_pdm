import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import {
    IonButton, IonContent, IonHeader, IonInput, IonItem,
    IonList, IonPage, IonTitle, IonToolbar
} from '@ionic/react';

import { useAuth } from '../AuthProvider';

const Login: React.FC = () => {
    const { token, login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Already authenticated: don't show the login page again.
    if (token) {
        return <Navigate to="/transactions" replace />;
    }

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            await login(email.trim(), password);
            navigate('/transactions', { replace: true });
        } catch {
            setError('Invalid email or password.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle>Log in</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
                <form onSubmit={submit} aria-label="Login">
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
                        {submitting ? 'Logging in…' : 'Log in'}
                    </IonButton>
                </form>
                <p className="ion-padding-top ion-text-center">
                    No account yet? <Link to="/register">Register</Link>
                </p>
            </IonContent>
        </IonPage>
    );
};

export default Login;
