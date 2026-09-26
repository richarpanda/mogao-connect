import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

type AuthContextValue = {
    session: Session | null;
    loading: boolean;
    userRol: string | null;
    rolLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
    session: null,
    loading: true,
    userRol: null,
    rolLoading: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRol, setUserRol] = useState<string | null>(null);
    const [rolLoading, setRolLoading] = useState(false);

    async function fetchRol(userId: string) {
        setRolLoading(true);
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('rol')
                .eq('id', userId)
                .single();
            setUserRol(data?.rol ?? null);
        } catch {
            setUserRol(null);
        } finally {
            setRolLoading(false);
        }
    }

    useEffect(() => {
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) console.error('[AuthProvider] getSession:', error.message);
            setSession(data.session);
            if (data.session) fetchRol(data.session.user.id);
            setLoading(false);
        }).catch((err) => {
            console.error('[AuthProvider] getSession catch:', err);
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                fetchRol(session.user.id);
            } else {
                setUserRol(null);
            }
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, userRol, rolLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
