import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { TipoPropiedad } from '../types/database';

export function useTiposPropiedad() {
    const [tipos, setTipos] = useState<TipoPropiedad[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            try {
                const { data, error } = await supabase
                    .from('tipos_propiedad')
                    .select('id, nombre, orden, created_at')
                    .order('orden', { ascending: true });
                if (error) throw error;
                setTipos(data ?? []);
            } catch (err) {
                console.error('[useTiposPropiedad]', err);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, []);

    return { tipos, loading };
}
