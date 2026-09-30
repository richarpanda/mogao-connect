import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { CitaConPropiedad, ProcesoConDetalle } from '../../lib/types/database';
import {
    useBandejaAsesor,
    SolicitudAbierta,
    CitaAsesor,
} from '../../lib/hooks/use-bandeja-asesor';
import { useMisPropiedades, PropiedadVendedor } from '../../lib/hooks/use-mis-propiedades';
import { useAuth } from '../../lib/context/auth-context';
import { formatFechaHora, formatPrecio } from '../../lib/utils/format';

export default function Solicitudes() {
    const { modoActivo } = useAuth();
    if (modoActivo === 'asesor') return <BandejaAsesorView />;
    if (modoActivo === 'vendedor') return <VendedorView />;
    return <CompradorView />;
}

// ─── Vista del asesor ────────────────────────────────────────────────────────

function BandejaAsesorView() {
    const [tab, setTab] = useState<'disponibles' | 'mis-citas'>('disponibles');
    const { agente, solicitudes, misCitas, loading, refetch, tomarCita } = useBandejaAsesor();

    const estaAutorizado = agente?.estatus_autorizacion === 'autorizado';

    const handleTomarCita = useCallback(
        async (citaId: string) => {
            const result = await tomarCita(citaId);
            if (result.success) {
                Alert.alert('¡Listo!', 'Cita tomada. Aparece en "Mis citas".');
            } else if (result.error === 'ya_tomada') {
                Alert.alert('No disponible', 'Otro asesor ya tomó esta cita.');
                refetch();
            } else if (result.error === 'no_autorizado') {
                Alert.alert('Sin autorización', 'Tu cuenta no está autorizada para tomar citas.');
            } else {
                Alert.alert('Error', 'Ocurrió un error. Intenta de nuevo.');
            }
        },
        [tomarCita, refetch],
    );

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            <View className="px-5 pt-4 pb-3">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Bandeja</Text>

                {/* Aviso de cuenta bloqueada */}
                {agente && !estaAutorizado && (
                    <View
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex-row gap-3"
                        style={{ alignItems: 'flex-start' }}
                    >
                        <Ionicons name="lock-closed" size={20} color="#B45309" style={{ marginTop: 1 }} />
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-amber-800">
                                Bandeja bloqueada
                            </Text>
                            <Text className="text-xs text-amber-700 mt-1">
                                Podrás ver y tomar solicitudes una vez que tu cuenta sea autorizada
                                por el equipo de Mogao.
                            </Text>
                        </View>
                    </View>
                )}

                {/* Tabs */}
                <View className="flex-row bg-gray-100 rounded-xl p-1">
                    {(['disponibles', 'mis-citas'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-white' : ''}`}
                        >
                            <Text
                                className={`text-sm font-semibold ${tab === t ? 'text-gray-900' : 'text-gray-500'}`}
                            >
                                {t === 'disponibles' ? 'Disponibles' : 'Mis citas'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0E3B36" />
                </View>
            ) : tab === 'disponibles' ? (
                <FlatList
                    data={solicitudes}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-gray-400 text-base text-center px-6">
                                {estaAutorizado
                                    ? 'No hay solicitudes disponibles en tu radio de servicio'
                                    : 'Las solicitudes aparecerán aquí cuando tu cuenta sea autorizada'}
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <SolicitudCard
                            solicitud={item}
                            puedeTomarCita={estaAutorizado}
                            onTomar={() => handleTomarCita(item.id)}
                        />
                    )}
                />
            ) : (
                <FlatList
                    data={misCitas}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-gray-400 text-base">No has tomado citas aún</Text>
                        </View>
                    }
                    renderItem={({ item }) => <MiCitaCard cita={item} />}
                />
            )}
        </SafeAreaView>
    );
}

function SolicitudCard({
    solicitud,
    puedeTomarCita,
    onTomar,
}: {
    solicitud: SolicitudAbierta;
    puedeTomarCita: boolean;
    onTomar: () => void;
}) {
    return (
        <View
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <View className="flex-row items-start justify-between mb-1">
                <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {solicitud.propiedades?.titulo ?? 'Propiedad'}
                </Text>
                {solicitud.distancia_km != null && (
                    <Text className="text-xs text-mogao-teal font-medium">
                        {solicitud.distancia_km} km
                    </Text>
                )}
            </View>

            {solicitud.propiedades?.ciudad && (
                <Text className="text-sm text-gray-500 mb-1">
                    📍 {solicitud.propiedades.ciudad}
                </Text>
            )}
            <Text className="text-sm text-gray-600 mb-1">🗓 {formatFechaHora(solicitud.fecha_hora)}</Text>
            {solicitud.contactos?.nombre && (
                <Text className="text-sm text-gray-500 mb-3">
                    👤 {solicitud.contactos.nombre}
                </Text>
            )}
            {solicitud.notas && (
                <Text className="text-xs text-gray-400 mb-3" numberOfLines={2}>
                    {solicitud.notas}
                </Text>
            )}

            <TouchableOpacity
                onPress={onTomar}
                disabled={!puedeTomarCita}
                className={`py-3 rounded-xl items-center ${puedeTomarCita ? 'bg-mogao-teal' : 'bg-gray-200'}`}
            >
                <Text
                    className={`text-sm font-semibold ${puedeTomarCita ? 'text-white' : 'text-gray-400'}`}
                >
                    {puedeTomarCita ? 'Tomar cita' : 'Cuenta pendiente de autorización'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const ESTATUS_COLOR_ASESOR: Record<string, string> = {
    programada: 'bg-yellow-100 text-yellow-700',
    confirmada: 'bg-green-100 text-green-700',
    cancelada: 'bg-red-100 text-red-700',
    realizada: 'bg-gray-100 text-gray-600',
};

const ESTATUS_LABEL_ASESOR: Record<string, string> = {
    programada: 'Programada',
    confirmada: 'Confirmada',
    cancelada: 'Cancelada',
    realizada: 'Realizada',
};

function MiCitaCard({ cita }: { cita: CitaAsesor }) {
    const router = useRouter();
    const colorClass = ESTATUS_COLOR_ASESOR[cita.estatus] ?? 'bg-gray-100 text-gray-600';
    const [bg, fg] = colorClass.split(' ');
    return (
        <View
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <View className="flex-row items-start justify-between mb-1">
                <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {cita.propiedades?.titulo ?? 'Propiedad'}
                </Text>
                <View className={`px-2.5 py-1 rounded-full ${bg}`}>
                    <Text className={`text-xs font-medium ${fg}`}>
                        {ESTATUS_LABEL_ASESOR[cita.estatus] ?? cita.estatus}
                    </Text>
                </View>
            </View>

            {cita.propiedades?.ciudad && (
                <Text className="text-sm text-gray-500 mb-1">📍 {cita.propiedades.ciudad}</Text>
            )}
            <Text className="text-sm text-gray-600 mb-1">🗓 {formatFechaHora(cita.fecha_hora)}</Text>
            {cita.contactos?.nombre && (
                <Text className="text-sm text-gray-500">👤 {cita.contactos.nombre}</Text>
            )}
            {cita.contactos?.telefono && (
                <Text className="text-sm text-gray-400">📞 {cita.contactos.telefono}</Text>
            )}
            {cita.notas && (
                <Text className="text-xs text-gray-400 mt-2" numberOfLines={2}>
                    {cita.notas}
                </Text>
            )}

            {cita.proceso_id && (
                <TouchableOpacity
                    onPress={() => router.push(`/proceso/${cita.proceso_id}`)}
                    className="mt-3 border border-mogao-teal rounded-xl py-2.5 items-center"
                >
                    <Text className="text-sm font-semibold text-mogao-teal">Ver proceso</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// ─── Vista del vendedor ──────────────────────────────────────────────────────

const ESTATUS_PROPIEDAD_COLOR: Record<string, string> = {
    pendiente_verificacion: 'bg-yellow-100 text-yellow-700',
    disponible: 'bg-green-100 text-green-700',
    apartada: 'bg-blue-100 text-blue-700',
    en_proceso: 'bg-purple-100 text-purple-700',
    vendida: 'bg-gray-100 text-gray-500',
    rechazada: 'bg-red-100 text-red-700',
};

const ESTATUS_PROPIEDAD_LABEL: Record<string, string> = {
    pendiente_verificacion: 'Pendiente de verificación',
    disponible: 'Disponible',
    apartada: 'Apartada',
    en_proceso: 'En proceso',
    vendida: 'Vendida',
    rechazada: 'Rechazada',
};

function VendedorView() {
    const router = useRouter();
    const { vendedorCuenta, propiedades, loading, refetch } = useMisPropiedades();

    const estaAutorizado = vendedorCuenta?.estatus_autorizacion === 'autorizado';

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Mis propiedades</Text>
                {estaAutorizado && (
                    <TouchableOpacity
                        onPress={() => router.push('/alta-propiedad' as any)}
                        className="bg-mogao-teal px-4 py-2 rounded-xl flex-row items-center gap-1.5"
                        activeOpacity={0.8}
                    >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text className="text-white text-sm font-semibold">Publicar</Text>
                    </TouchableOpacity>
                )}
            </View>

            {vendedorCuenta && !estaAutorizado && (
                <View className="mx-5 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row gap-3">
                    <Ionicons name="lock-closed" size={20} color="#B45309" style={{ marginTop: 1 }} />
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-amber-800">Cuenta pendiente</Text>
                        <Text className="text-xs text-amber-700 mt-1">
                            Podrás publicar propiedades una vez que tu cuenta sea verificada por Mogao.
                        </Text>
                    </View>
                </View>
            )}

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0E3B36" />
                </View>
            ) : (
                <FlatList
                    data={propiedades}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20 px-6">
                            <Ionicons name="home-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-400 text-base text-center mt-4">
                                {estaAutorizado
                                    ? 'Aún no tienes propiedades publicadas'
                                    : 'Tus propiedades aparecerán aquí cuando tu cuenta sea verificada'}
                            </Text>
                            {estaAutorizado && (
                                <TouchableOpacity
                                    onPress={() => router.push('/alta-propiedad' as any)}
                                    className="mt-5 bg-mogao-teal px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-semibold">Publicar primera propiedad</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => <PropiedadVendedorCard propiedad={item} />}
                />
            )}
        </SafeAreaView>
    );
}

function PropiedadVendedorCard({ propiedad }: { propiedad: PropiedadVendedor }) {
    const colorClass =
        ESTATUS_PROPIEDAD_COLOR[propiedad.estatus] ?? 'bg-gray-100 text-gray-500';
    const [bg, fg] = colorClass.split(' ');

    return (
        <View
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <View className="flex-row items-start justify-between mb-1">
                <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {propiedad.titulo}
                </Text>
                <View className={`px-2.5 py-1 rounded-full ${bg}`}>
                    <Text className={`text-xs font-medium ${fg}`}>
                        {ESTATUS_PROPIEDAD_LABEL[propiedad.estatus] ?? propiedad.estatus}
                    </Text>
                </View>
            </View>

            {propiedad.ciudad && (
                <Text className="text-sm text-gray-500 mb-1">📍 {propiedad.ciudad}</Text>
            )}
            <Text className="text-sm font-semibold text-mogao-teal mb-3">
                {formatPrecio(propiedad.precio)}
            </Text>

            <View className="flex-row items-center gap-1">
                <Ionicons name="eye-outline" size={14} color="#6B7280" />
                <Text className="text-xs text-gray-500">
                    {propiedad.visitas_count}{' '}
                    {propiedad.visitas_count === 1 ? 'visita solicitada' : 'visitas solicitadas'}
                </Text>
            </View>

            {propiedad.estatus === 'rechazada' && propiedad.motivo_rechazo && (
                <View className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3 flex-row gap-2">
                    <Ionicons name="alert-circle-outline" size={14} color="#DC2626" style={{ marginTop: 1 }} />
                    <Text className="text-xs text-red-700 flex-1">{propiedad.motivo_rechazo}</Text>
                </View>
            )}
        </View>
    );
}

// ─── Vista del comprador ─────────────────────────────────────────────────────

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

function CompradorView() {
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
            console.error('[CompradorView]', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            <View className="px-5 pt-4 pb-3">
                <Text className="text-2xl font-bold text-gray-900 mb-4">Mis solicitudes</Text>

                <View className="flex-row bg-gray-100 rounded-xl p-1">
                    {(['citas', 'procesos'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-white' : ''}`}
                        >
                            <Text
                                className={`text-sm font-semibold ${tab === t ? 'text-gray-900' : 'text-gray-500'}`}
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
                        <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20">
                            <Text className="text-gray-400 text-base">
                                No tienes visitas solicitadas
                            </Text>
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
                        <RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#0E3B36" />
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
    const [bg, fg] = colorClass.split(' ');
    return (
        <View
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <View className="flex-row items-start justify-between mb-2">
                <Text className="text-base font-semibold text-gray-900 flex-1 mr-2" numberOfLines={1}>
                    {cita.propiedades?.titulo ?? 'Propiedad'}
                </Text>
                <View className={`px-2.5 py-1 rounded-full ${bg}`}>
                    <Text className={`text-xs font-medium ${fg}`}>
                        {ESTATUS_LABEL[cita.estatus] ?? cita.estatus}
                    </Text>
                </View>
            </View>
            {cita.propiedades?.ciudad && (
                <Text className="text-sm text-gray-500 mb-1">📍 {cita.propiedades.ciudad}</Text>
            )}
            <Text className="text-sm text-gray-600">🗓 {formatFechaHora(cita.fecha_hora)}</Text>
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
    const stepIndex = PROCESO_STEPS.indexOf(proceso.estatus as (typeof PROCESO_STEPS)[number]);
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
                <Text className="text-sm text-gray-500 mb-3">📍 {proceso.propiedades.ciudad}</Text>
            )}
            <View className="bg-gray-100 rounded-full h-2 mb-2">
                <View
                    className="bg-mogao-gold rounded-full h-2"
                    style={{ width: `${progress}%` }}
                />
            </View>
            <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500 capitalize">
                    {proceso.estatus.replace(/_/g, ' ')}
                </Text>
                <Text className="text-xs text-gray-400">
                    {stepIndex + 1} / {PROCESO_STEPS.length}
                </Text>
            </View>
        </TouchableOpacity>
    );
}
