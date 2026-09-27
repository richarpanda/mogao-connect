import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Agente, Contacto, Usuario, VendedorCuenta } from '../types/database';

type UsuarioCompleto = {
    usuario: Usuario | null;
    agente: Agente | null;
    contacto: Contacto | null;
    vendedorCuenta: VendedorCuenta | null;
    tieneAmbosRoles: boolean;
    loading: boolean;
    refetch: () => void;
};

export function useUsuario(): UsuarioCompleto {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [agente, setAgente] = useState<Agente | null>(null);
    const [contacto, setContacto] = useState<Contacto | null>(null);
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

                // Siempre consultar ambas tablas para soporte de toggle multi-rol.
                // RLS devuelve null si el usuario no tiene fila en esa tabla.
                const [{ data: aData }, { data: cData }] = await Promise.all([
                    supabase.from('agentes').select('*').eq('usuario_id', user.id).maybeSingle(),
                    supabase.from('contactos').select('*').eq('usuario_id', user.id).maybeSingle(),
                ]);
                if (cancelled) return;
                setAgente(aData ?? null);
                setContacto(cData ?? null);

                if (u.rol === 'vendedor') {
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
        return () => {
            cancelled = true;
        };
    }, [tick]);

    return {
        usuario,
        agente,
        contacto,
        vendedorCuenta,
        tieneAmbosRoles: !!agente && !!contacto,
        loading,
        refetch: () => setTick((t) => t + 1),
    };
}
