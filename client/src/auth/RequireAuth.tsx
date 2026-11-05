import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { useAuth } from './AuthProvider';

// Wrap a page element with this to redirect to /login when there is no
// authenticated user. Used instead of opening the login page unconditionally.
const RequireAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { token } = useAuth();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default RequireAuth;
