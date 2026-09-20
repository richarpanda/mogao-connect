import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { CaracteristicasPropiedad, Propiedad, PropiedadFoto, TipoPropiedad } from '../types/database';

export type PropiedadConFotos = Propiedad & {
    propiedad_fotos: Pick<PropiedadFoto, 'url' | 'orden'>[];
    tipos_propiedad: Pick<TipoPropiedad, 'nombre'> | null;
};

export function usePropiedades(
    ciudad?: string,
    recamaras?: number,
    tipo_id?: string,
    precio_min?: number,
    precio_max?: number,
) {
    const [propiedades, setPropiedades] = useState<PropiedadConFotos[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('propiedades')
                .select('*, propiedad_fotos(url, orden), tipos_propiedad(nombre)')
                .eq('estatus', 'disponible')
                .order('created_at', { ascending: false })
                .limit(30);

            if (ciudad) query = query.ilike('ciudad', `%${ciudad}%`);
            if (tipo_id) query = query.eq('tipo_id', tipo_id);
            if (precio_min != null) query = query.gte('precio', precio_min);
            if (precio_max != null) query = query.lte('precio', precio_max);

            const { data, error: err } = await query;
            if (err) throw err;

            let result = (data ?? []).map((p) => ({
                ...p,
                propiedad_fotos: [...p.propiedad_fotos].sort((a, b) => a.orden - b.orden),
            })) as PropiedadConFotos[];

            // recamaras is in the caracteristicas jsonb — filter client-side
            if (recamaras) {
                result = result.filter(
                    (p) => ((p.caracteristicas as CaracteristicasPropiedad)?.recamaras ?? 0) >= recamaras,
                );
            }

            setPropiedades(result);
        } catch (err: any) {
            console.error('[usePropiedades]', err);
            setError(err.message ?? 'Error al cargar propiedades');
        } finally {
            setLoading(false);
        }
    }, [ciudad, recamaras, tipo_id, precio_min, precio_max]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    return { propiedades, loading, error, refetch: fetch };
}
