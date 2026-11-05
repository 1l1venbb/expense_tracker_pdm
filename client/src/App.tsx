import { Route, Navigate } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import TransactionList from "./transactions/pages/TransactionList";
import TransactionDetails from './transactions/pages/TransactionDetails';
import AddExpense from './transactions/pages/AddExpense';
import { TransactionProvider } from "./transactions/TransactionProvider";
import { AuthProvider } from './auth/AuthProvider';
import RequireAuth from './auth/RequireAuth';
import Login from './auth/pages/Login';
import Register from './auth/pages/Register';

setupIonicReact();

const App: React.FC = () => (
    <IonApp>
        <AuthProvider>
            <TransactionProvider>
                <IonReactRouter>
                    <IonRouterOutlet>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/transactions/new" element={
                            <RequireAuth><AddExpense /></RequireAuth>
                        } />
                        <Route path="/transactions/:id" element={
                            <RequireAuth><TransactionDetails /></RequireAuth>
                        } />
                        <Route path="/transactions" element={
                            <RequireAuth><TransactionList /></RequireAuth>
                        } />

                        <Route path="/" element={<Navigate to="/transactions" replace />} />
                    </IonRouterOutlet>
                </IonReactRouter>
            </TransactionProvider>
        </AuthProvider>
    </IonApp>
);

export default App;
