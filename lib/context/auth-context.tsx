import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export type Modo = 'asesor' | 'comprador' | 'vendedor';

type AuthContextValue = {
    session: Session | null;
    loading: boolean;
    userRol: string | null;
    rolLoading: boolean;
    modoActivo: Modo;
    setModoActivo: (modo: Modo) => void;
};

const AuthContext = createContext<AuthContextValue>({
    session: null,
    loading: true,
    userRol: null,
    rolLoading: false,
    modoActivo: 'comprador',
    setModoActivo: () => {},
});

function rolToModo(rol: string | null): Modo {
    if (rol === 'agente') return 'asesor';
    if (rol === 'vendedor') return 'vendedor';
    return 'comprador';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRol, setUserRol] = useState<string | null>(null);
    const [rolLoading, setRolLoading] = useState(false);
    const [modoActivo, setModoActivoState] = useState<Modo>('comprador');

    async function fetchRol(userId: string) {
        setRolLoading(true);
        try {
            const { data } = await supabase
                .from('usuarios')
                .select('rol')
                .eq('id', userId)
                .single();
            const rol = data?.rol ?? null;
            setUserRol(rol);

            const stored = await AsyncStorage.getItem(`modoActivo_${userId}`);
            if (stored === 'asesor' || stored === 'comprador') {
                setModoActivoState(stored);
            } else {
                setModoActivoState(rolToModo(rol));
            }
        } catch {
            setUserRol(null);
        } finally {
            setRolLoading(false);
        }
    }

    function setModoActivo(modo: Modo) {
        setModoActivoState(modo);
        if (session?.user.id) {
            AsyncStorage.setItem(`modoActivo_${session.user.id}`, modo);
        }
    }

    useEffect(() => {
        supabase.auth
            .getSession()
            .then(({ data, error }) => {
                if (error) console.error('[AuthProvider] getSession:', error.message);
                setSession(data.session);
                if (data.session) fetchRol(data.session.user.id);
                setLoading(false);
            })
            .catch((err) => {
                console.error('[AuthProvider] getSession catch:', err);
                setLoading(false);
            });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession) {
                fetchRol(newSession.user.id);
            } else {
                setUserRol(null);
                setModoActivoState('comprador');
            }
        });

        return () => listener.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading, userRol, rolLoading, modoActivo, setModoActivo }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
