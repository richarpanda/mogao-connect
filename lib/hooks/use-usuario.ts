import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Agente, Usuario } from '../types/database';

type UsuarioCompleto = {
    usuario: Usuario | null;
    agente: Agente | null;
    loading: boolean;
};

export function useUsuario(): UsuarioCompleto {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [agente, setAgente] = useState<Agente | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;

                const { data: u, error: uErr } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (uErr) throw uErr;
                setUsuario(u);

                if (u.rol === 'agente') {
                    const { data: a } = await supabase
                        .from('agentes')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .maybeSingle();
                    setAgente(a ?? null);
                }
            } catch (err) {
                console.error('[useUsuario]', err);
            } finally {
                setLoading(false);
            }
        }

        fetch();
    }, []);

    return { usuario, agente, loading };
}
