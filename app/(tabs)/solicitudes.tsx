import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CitaConPropiedad, ProcesoConDetalle } from '../../lib/types/database';
import { formatFechaHora } from '../../lib/utils/format';

const ESTATUS_LABEL: Record<string, string> = {
    programada: 'Programada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    realizada: 'Realizada',
};

const ESTATUS_COLOR: Record<string, string> = {
    programada: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    realizada: 'bg-gray-100 text-gray-600',
};

export default function Solicitudes() {
    const router = useRouter();
    const [tab, setTab] = useState<'citas' | 'procesos'>('citas');
    const [citas, setCitas] = useState<CitaConPropiedad[]>([]);
    const [procesos, setProcesos] = useState<ProcesoConDetalle[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return;

            // Buscar contacto del usuario actual
            const { data: contacto } = await supabase
                .from('contactos')
                .select('id')
                .eq('usuario_id', user.id)
                .maybeSingle();

            if (!contacto) {
                setCitas([]);
                setProcesos([]);
                return;
            }

            const [citasRes, procesosRes] = await Promise.all([
                supabase
                    .from('citas')
                    .select('*, propiedades(id, titulo, direccion, ciudad)')
                    .eq('contacto_id', contacto.id)
                    .order('fecha_hora', { ascending: false }),
                supabase
                    .from('procesos_compra')
                    .select(
                        '*, propiedades(id, titulo, direccion, ciudad), proceso_historial(*)',
                    )
                    .eq('contacto_id', contacto.id)
                    .order('created_at', { ascending: false }),
            ]);

            if (citasRes.error) throw citasRes.error;
            if (procesosRes.error) throw procesosRes.error;

            setCitas((citasRes.data ?? []) as CitaConPropiedad[]);
            setProcesos((procesosRes.data ?? []) as ProcesoConDetalle[]);
        } catch (err) {
            console.error('[Solicitudes]', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            {/* Encabezado */}
            <View className="px-5 pt-4 pb-3">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Mis solicitudes</Text>

                {/* Tabs */}
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                    {(['citas', 'procesos'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg items-center ${
                                tab === t ? 'bg-white' : ''
                            }`}
                        >
                            <Text
                                className={`text-sm font-semibold ${
                                    tab === t ? 'text-gray-900' : 'text-gray-500'
                                }`}
                            >
                                {t === 'citas' ? 'Visitas' : 'Procesos'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0E3B36" />
                </View>
            ) : tab === 'citas' ? (
                <FlatList
                    data={citas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchData}
                            tintColor="#0E3B36"
                        />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-gray-400 text-base">No tienes visitas solicitadas</Text>
                            <TouchableOpacity
                                className="mt-4 bg-mogao-teal px-6 py-3 rounded-xl"
                                onPress={() => router.push('/(tabs)')}
                            >
                                <Text className="text-white font-semibold">Ver catálogo</Text>
                            </TouchableOpacity>
                        </View>
                    }
                    renderItem={({ item }) => <CitaCard cita={item} />}
                />
            ) : (
                <FlatList
                    data={procesos}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={fetchData}
                            tintColor="#0E3B36"
                        />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-gray-400 text-base">Sin procesos activos</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <ProcesoCard
                            proceso={item}
                            onPress={() => router.push(`/proceso/${item.id}`)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function CitaCard({ cita }: { cita: CitaConPropiedad }) {
    const colorClass = ESTATUS_COLOR[cita.estatus] ?? 'bg-gray-100 text-gray-600';
    return (
        <View className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}>
            <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {cita.propiedades?.titulo ?? 'Propiedad'}
                </Text>
                <View className={`px-2.5 py-1 rounded-full ${colorClass.split(' ')[0]}`}>
                    <Text className={`text-xs font-medium ${colorClass.split(' ')[1]}`}>
                        {ESTATUS_LABEL[cita.estatus] ?? cita.estatus}
                    </Text>
                </View>
            </View>
            {cita.propiedades?.ciudad && (
                <Text className="text-sm text-gray-500 mb-1">
                    📍 {cita.propiedades.ciudad}
                </Text>
            )}
            <Text className="text-sm text-gray-600">
                🗓 {formatFechaHora(cita.fecha_hora)}
            </Text>
            {cita.notas && (
                <Text className="text-xs text-gray-400 mt-2" numberOfLines={2}>
                    {cita.notas}
                </Text>
            )}
        </View>
    );
}

const PROCESO_STEPS = [
    'interesado', 'apartado', 'en_tramite', 'documentacion', 'firma',
    'cerrado', 'firma_cv', 'integracion', 'firma_notaria', 'entregado',
] as const;

function ProcesoCard({
    proceso,
    onPress,
}: {
    proceso: ProcesoConDetalle;
    onPress: () => void;
}) {
    const stepIndex = PROCESO_STEPS.indexOf(proceso.estatus as any);
    const progress = stepIndex >= 0 ? ((stepIndex + 1) / PROCESO_STEPS.length) * 100 : 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={1}>
                {proceso.propiedades?.titulo ?? 'Propiedad'}
            </Text>
            {proceso.propiedades?.ciudad && (
                <Text className="text-sm text-gray-500 mb-3">
                    📍 {proceso.propiedades.ciudad}
                </Text>
            )}

            {/* Barra de progreso */}
            <View className="bg-gray-100 rounded-full h-2 mb-2">
                <View
                    className="bg-mogao-gold rounded-full h-2"
                    style={{ width: `${progress}%` }}
                />
            </View>
            <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500 capitalize">{proceso.estatus.replace('_', ' ')}</Text>
                <Text className="text-xs text-gray-400">
                    {stepIndex + 1} / {PROCESO_STEPS.length}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
