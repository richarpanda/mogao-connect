import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Agente, Cita, Propiedad } from '../types/database';

export type SolicitudAbierta = Cita & {
    propiedades: Pick<Propiedad, 'id' | 'titulo' | 'direccion' | 'ciudad' | 'latitud' | 'longitud'> | null;
    contactos: { nombre: string } | null;
    distancia_km?: number;
};

export type CitaAsesor = Cita & {
    propiedades: Pick<Propiedad, 'id' | 'titulo' | 'direccion' | 'ciudad'> | null;
    contactos: { nombre: string; telefono: string | null } | null;
};

type TomarCitaResult =
    | { success: true }
    | { success: false; error: 'ya_tomada' | 'no_autorizado' | 'error' };

type UseBandejaResult = {
    agente: Agente | null;
    solicitudes: SolicitudAbierta[];
    misCitas: CitaAsesor[];
    loading: boolean;
    refetch: () => void;
    tomarCita: (citaId: string) => Promise<TomarCitaResult>;
};

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useBandejaAsesor(): UseBandejaResult {
    const [agente, setAgente] = useState<Agente | null>(null);
    const [solicitudes, setSolicitudes] = useState<SolicitudAbierta[]>([]);
    const [misCitas, setMisCitas] = useState<CitaAsesor[]>([]);
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

                const { data: aData, error: aErr } = await supabase
                    .from('agentes')
                    .select('*')
                    .eq('usuario_id', user.id)
                    .maybeSingle();

                if (aErr) throw aErr;
                if (cancelled) return;
                setAgente(aData ?? null);
                if (!aData) return;

                const [solicitudesRes, misCitasRes] = await Promise.all([
                    supabase
                        .from('citas')
                        .select(
                            '*, propiedades(id, titulo, direccion, ciudad, latitud, longitud), contactos(nombre)',
                        )
                        .is('agente_id', null)
                        .order('fecha_hora', { ascending: true }),
                    supabase
                        .from('citas')
                        .select(
                            '*, propiedades(id, titulo, direccion, ciudad), contactos(nombre, telefono)',
                        )
                        .eq('agente_id', aData.id)
                        .order('fecha_hora', { ascending: false }),
                ]);

                if (solicitudesRes.error) throw solicitudesRes.error;
                if (misCitasRes.error) throw misCitasRes.error;
                if (cancelled) return;

                // Filtrar por radio si el asesor tiene coordenadas configuradas
                let filtradas = (solicitudesRes.data ?? []) as SolicitudAbierta[];
                if (aData.radio_lat != null && aData.radio_lng != null && aData.radio_km != null) {
                    filtradas = filtradas
                        .map((s) => {
                            const lat = s.propiedades?.latitud;
                            const lng = s.propiedades?.longitud;
                            if (lat == null || lng == null) return null;
                            const dist = distanciaKm(aData.radio_lat!, aData.radio_lng!, lat, lng);
                            if (dist > aData.radio_km!) return null;
                            return { ...s, distancia_km: Math.round(dist * 10) / 10 };
                        })
                        .filter((s): s is SolicitudAbierta => s !== null);
                }

                setSolicitudes(filtradas);
                setMisCitas((misCitasRes.data ?? []) as CitaAsesor[]);
            } catch (err) {
                console.error('[useBandejaAsesor]', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [tick]);

    const tomarCita = useCallback(async (citaId: string): Promise<TomarCitaResult> => {
        try {
            const { data, error } = await supabase.rpc('tomar_cita', { p_cita_id: citaId });
            if (error) {
                console.error('[tomarCita] RPC error:', error.message);
                return { success: false, error: 'error' };
            }
            const result = data as { success: boolean; error?: string };
            if (!result.success) {
                if (result.error === 'ya_tomada') return { success: false, error: 'ya_tomada' };
                return { success: false, error: 'no_autorizado' };
            }
            setTick((t) => t + 1);
            return { success: true };
        } catch (err) {
            console.error('[tomarCita] catch:', err);
            return { success: false, error: 'error' };
        }
    }, []);

    return {
        agente,
        solicitudes,
        misCitas,
        loading,
        refetch: () => setTick((t) => t + 1),
        tomarCita,
    };
}
