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

setupIonicReact();

const App: React.FC = () => (
    <IonApp>
        <IonReactRouter>
            <TransactionProvider>
                <IonRouterOutlet>
                    <Route path="/transactions/new" element={<AddExpense />} />
                    <Route
                        path="/transactions/:id"
                        element={<TransactionDetails />}
                    />

                    <Route
                        path="/transactions"
                        element={<TransactionList />}
                    />

                    <Route
                        path="/"
                        element={<Navigate to="/transactions" replace />}
                    />
                </IonRouterOutlet>
            </TransactionProvider>
        </IonReactRouter>
    </IonApp>
);

export default App;
