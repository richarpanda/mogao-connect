import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Agente, Usuario, VendedorCuenta } from '../types/database';

type UsuarioCompleto = {
    usuario: Usuario | null;
    agente: Agente | null;
    vendedorCuenta: VendedorCuenta | null;
    loading: boolean;
    refetch: () => void;
};

export function useUsuario(): UsuarioCompleto {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [agente, setAgente] = useState<Agente | null>(null);
    const [vendedorCuenta, setVendedorCuenta] = useState<VendedorCuenta | null>(null);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function fetch() {
            setLoading(true);
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const { data: u, error: uErr } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (uErr) throw uErr;
                if (cancelled) return;
                setUsuario(u);

                if (u.rol === 'agente') {
                    const { data: a } = await supabase
                        .from('agentes')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .maybeSingle();
                    if (!cancelled) setAgente(a ?? null);
                } else if (u.rol === 'vendedor') {
                    const { data: v } = await supabase
                        .from('vendedores_cuenta')
                        .select('*')
                        .eq('usuario_id', user.id)
                        .maybeSingle();
                    if (!cancelled) setVendedorCuenta(v ?? null);
                }
            } catch (err) {
                console.error('[useUsuario]', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        fetch();
        return () => { cancelled = true; };
    }, [tick]);

    return { usuario, agente, vendedorCuenta, loading, refetch: () => setTick((t) => t + 1) };
}
