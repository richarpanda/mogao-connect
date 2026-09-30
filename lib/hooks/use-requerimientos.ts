import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Requerimiento, TipoOperacion, TipoPropiedad } from '../types/database';

export type RequerimientoConDetalle = Requerimiento & {
    tipos_propiedad: Pick<TipoPropiedad, 'id' | 'nombre'> | null;
    es_propio: boolean;
    coincidencias: number;
};

export type CrearRequerimientoInput = {
    tipo_operacion: TipoOperacion;
    tipo_propiedad_id: string | null;
    precio_min: number | null;
    precio_max: number | null;
    zona: string | null;
    notas: string | null;
};

type OpResult = { success: boolean; error?: string };

type UseRequerimientosResult = {
    requerimientos: RequerimientoConDetalle[];
    tiposPropiedad: TipoPropiedad[];
    agenteId: string | null;
    loading: boolean;
    refetch: () => void;
    crear: (input: CrearRequerimientoInput) => Promise<OpResult>;
    editar: (id: string, input: Partial<CrearRequerimientoInput>) => Promise<OpResult>;
    desactivar: (id: string) => Promise<OpResult>;
};

export function useRequerimientos(): UseRequerimientosResult {
    const [requerimientos, setRequerimientos] = useState<RequerimientoConDetalle[]>([]);
    const [tiposPropiedad, setTiposPropiedad] = useState<TipoPropiedad[]>([]);
    const [agenteId, setAgenteId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user || cancelled) return;

                const [agenteRes, reqRes, tiposRes, propsRes] = await Promise.all([
                    supabase.from('agentes').select('id').eq('usuario_id', user.id).maybeSingle(),
                    supabase
                        .from('requerimientos')
                        .select('*, tipos_propiedad(id, nombre)')
                        .order('created_at', { ascending: false }),
                    supabase.from('tipos_propiedad').select('*').order('orden'),
                    supabase
                        .from('propiedades')
                        .select('id, precio, tipo_id, ciudad')
                        .eq('estatus', 'disponible'),
                ]);

                if (cancelled) return;

                const myAgenteId = agenteRes.data?.id ?? null;
                setAgenteId(myAgenteId);

                if (tiposRes.data) setTiposPropiedad(tiposRes.data);

                const propsDisponibles = propsRes.data ?? [];

                const enriched = (reqRes.data ?? []).map((req) => {
                    const coincidencias = propsDisponibles.filter((p) => {
                        if (req.tipo_propiedad_id && p.tipo_id !== req.tipo_propiedad_id) return false;
                        if (req.precio_min != null && p.precio < req.precio_min) return false;
                        if (req.precio_max != null && p.precio > req.precio_max) return false;
                        if (
                            req.zona &&
                            p.ciudad &&
                            !p.ciudad.toLowerCase().includes(req.zona.toLowerCase())
                        )
                            return false;
                        return true;
                    }).length;

                    return {
                        ...req,
                        tipos_propiedad: req.tipos_propiedad ?? null,
                        es_propio: req.asesor_id === myAgenteId,
                        coincidencias,
                    };
                }) as RequerimientoConDetalle[];

                setRequerimientos(enriched);
            } catch (err) {
                console.error('[useRequerimientos]', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [tick]);

    const crear = useCallback(async (input: CrearRequerimientoInput): Promise<OpResult> => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return { success: false, error: 'no_sesion' };

            const { data: agente } = await supabase
                .from('agentes')
                .select('id')
                .eq('usuario_id', user.id)
                .maybeSingle();
            if (!agente) return { success: false, error: 'no_agente' };

            const { error } = await supabase
                .from('requerimientos')
                .insert({ ...input, asesor_id: agente.id });
            if (error) throw error;

            setTick((t) => t + 1);
            return { success: true };
        } catch (err) {
            console.error('[crear requerimiento]', err);
            return { success: false, error: 'error' };
        }
    }, []);

    const editar = useCallback(
        async (id: string, input: Partial<CrearRequerimientoInput>): Promise<OpResult> => {
            try {
                const { error } = await supabase
                    .from('requerimientos')
                    .update({ ...input, updated_at: new Date().toISOString() })
                    .eq('id', id);
                if (error) throw error;
                setTick((t) => t + 1);
                return { success: true };
            } catch (err) {
                console.error('[editar requerimiento]', err);
                return { success: false, error: 'error' };
            }
        },
        [],
    );

    const desactivar = useCallback(async (id: string): Promise<OpResult> => {
        try {
            const { error } = await supabase
                .from('requerimientos')
                .update({ activo: false, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            setTick((t) => t + 1);
            return { success: true };
        } catch (err) {
            console.error('[desactivar requerimiento]', err);
            return { success: false, error: 'error' };
        }
    }, []);

    return {
        requerimientos,
        tiposPropiedad,
        agenteId,
        loading,
        refetch: () => setTick((t) => t + 1),
        crear,
        editar,
        desactivar,
    };
}
