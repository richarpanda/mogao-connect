import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabase';
import { Propiedad, PropiedadFoto, VendedorCuenta } from '../types/database';

export type PropiedadVendedor = Propiedad & {
    propiedad_fotos: Pick<PropiedadFoto, 'url' | 'orden'>[];
    visitas_count: number;
};

type UseMisPropiedadesResult = {
    vendedorCuenta: VendedorCuenta | null;
    propiedades: PropiedadVendedor[];
    loading: boolean;
    refetch: () => void;
};

export function useMisPropiedades(): UseMisPropiedadesResult {
    const [vendedorCuenta, setVendedorCuenta] = useState<VendedorCuenta | null>(null);
    const [propiedades, setPropiedades] = useState<PropiedadVendedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    // Guardamos vendedor_cuenta_id para filtrar el canal Realtime
    const vendedorIdRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const { data: vData } = await supabase
                    .from('vendedores_cuenta')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .maybeSingle();

                if (!vData || cancelled) {
                    setVendedorCuenta(null);
                    setPropiedades([]);
                    return;
                }
                setVendedorCuenta(vData);
                vendedorIdRef.current = vData.id;

                const { data: props, error } = await supabase
                    .from('propiedades')
                    .select('*, propiedad_fotos(url, orden)')
                    .eq('vendedor_cuenta_id', vData.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (cancelled) return;

                const ids = (props ?? []).map((p) => p.id);
                let visitasPorPropiedad: Record<string, number> = {};

                if (ids.length > 0) {
                    const { data: citas } = await supabase
                        .from('citas')
                        .select('propiedad_id')
                        .in('propiedad_id', ids)
                        .eq('tipo', 'visita');

                    for (const c of citas ?? []) {
                        if (c.propiedad_id) {
                            visitasPorPropiedad[c.propiedad_id] =
                                (visitasPorPropiedad[c.propiedad_id] ?? 0) + 1;
                        }
                    }
                }

                const enriched = (props ?? []).map((p) => ({
                    ...p,
                    visitas_count: visitasPorPropiedad[p.id] ?? 0,
                })) as PropiedadVendedor[];

                setPropiedades(enriched);
            } catch (err) {
                console.error('[useMisPropiedades]', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [tick]);

    // Canal Realtime: escucha UPDATE en propiedades del vendedor (estatus, motivo_rechazo)
    useEffect(() => {
        const channel = supabase
            .channel('mis-propiedades-vendedor')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'propiedades',
                },
                (payload) => {
                    const updated = payload.new as Propiedad;
                    // Solo aplicar si la propiedad pertenece a este vendedor
                    if (updated.vendedor_cuenta_id !== vendedorIdRef.current) return;

                    setPropiedades((prev) =>
                        prev.map((p) =>
                            p.id === updated.id
                                ? { ...p, estatus: updated.estatus, motivo_rechazo: updated.motivo_rechazo }
                                : p,
                        ),
                    );
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        vendedorCuenta,
        propiedades,
        loading,
        refetch: () => setTick((t) => t + 1),
    };
}
