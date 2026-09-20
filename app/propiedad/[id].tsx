import { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { PropiedadConFotos } from '../../lib/hooks/use-propiedades';
import { formatPrecio } from '../../lib/utils/format';
import { useUsuario } from '../../lib/hooks/use-usuario';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropiedadDetalle() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { usuario } = useUsuario();
    const [propiedad, setPropiedad] = useState<PropiedadConFotos | null>(null);
    const [loading, setLoading] = useState(true);
    const [fotoActual, setFotoActual] = useState(0);

    useEffect(() => {
        async function fetchPropiedad() {
            try {
                const { data, error } = await supabase
                    .from('propiedades')
                    .select('*, propiedad_fotos(url, orden), tipos_propiedad(nombre)')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                setPropiedad({
                    ...data,
                    propiedad_fotos: [...data.propiedad_fotos].sort((a, b) => a.orden - b.orden),
                } as PropiedadConFotos);
            } catch (err: any) {
                console.error('[PropiedadDetalle]', err);
                Alert.alert('Error', 'No se pudo cargar la propiedad.');
                router.back();
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchPropiedad();
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-mogao-cream">
                <ActivityIndicator size="large" color="#0E3B36" />
            </View>
        );
    }

    if (!propiedad) return null;

    const c = propiedad.caracteristicas;
    const fotos = propiedad.propiedad_fotos;

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['bottom']}>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Galería de fotos */}
                <View style={{ height: 280, backgroundColor: '#F3F4F6' }}>
                    {fotos.length > 0 ? (
                        <>
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(
                                        e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                                    );
                                    setFotoActual(index);
                                }}
                            >
                                {fotos.map((foto, i) => (
                                    <Image
                                        key={i}
                                        source={{ uri: foto.url }}
                                        style={{ width: SCREEN_WIDTH, height: 280 }}
                                        resizeMode="cover"
                                    />
                                ))}
                            </ScrollView>
                            {fotos.length > 1 && (
                                <View className="absolute bottom-3 self-center flex-row gap-1.5">
                                    {fotos.map((_, i) => (
                                        <View
                                            key={i}
                                            className={`rounded-full ${
                                                i === fotoActual
                                                    ? 'w-2.5 h-2.5 bg-white'
                                                    : 'w-2 h-2 bg-white/50'
                                            }`}
                                        />
                                    ))}
                                </View>
                            )}
                        </>
                    ) : (
                        <View className="flex-1 items-center justify-center">
                            <Text className="text-gray-400 text-5xl">🏠</Text>
                        </View>
                    )}
                </View>

                {/* Botón volver */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-4 bg-white/90 rounded-full p-2"
                >
                    <Ionicons name="arrow-back" size={22} color="#111827" />
                </TouchableOpacity>

                {/* Contenido */}
                <View className="px-5 pt-5 pb-8">
                    {/* Precio y tipo */}
                    <View className="flex-row items-start justify-between mb-1">
                        <Text className="text-2xl font-bold text-mogao-gold">
                            {formatPrecio(propiedad.precio)}
                        </Text>
                        {propiedad.tipos_propiedad && (
                            <View className="bg-mogao-cream px-3 py-1 rounded-full">
                                <Text className="text-xs text-mogao-teal font-medium">
                                    {propiedad.tipos_propiedad.nombre}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Título */}
                    <Text className="text-xl font-bold text-gray-900 mb-1">{propiedad.titulo}</Text>

                    {/* Ubicación */}
                    {(propiedad.ciudad || propiedad.direccion) && (
                        <Text className="text-sm text-gray-500 mb-4">
                            📍{' '}
                            {[propiedad.direccion, propiedad.ciudad].filter(Boolean).join(', ')}
                        </Text>
                    )}

                    {/* Características */}
                    {(c?.recamaras != null || c?.banos != null || c?.m2 != null) && (
                        <View className="flex-row gap-4 bg-gray-50 rounded-2xl p-4 mb-5">
                            {c?.recamaras != null && (
                                <View className="items-center flex-1">
                                    <Text className="text-2xl">🛏</Text>
                                    <Text className="text-base font-bold text-gray-900">
                                        {c.recamaras}
                                    </Text>
                                    <Text className="text-xs text-gray-500">Recámaras</Text>
                                </View>
                            )}
                            {c?.banos != null && (
                                <View className="items-center flex-1">
                                    <Text className="text-2xl">🚿</Text>
                                    <Text className="text-base font-bold text-gray-900">
                                        {c.banos}
                                    </Text>
                                    <Text className="text-xs text-gray-500">Baños</Text>
                                </View>
                            )}
                            {c?.m2 != null && (
                                <View className="items-center flex-1">
                                    <Text className="text-2xl">📐</Text>
                                    <Text className="text-base font-bold text-gray-900">
                                        {c.m2}
                                    </Text>
                                    <Text className="text-xs text-gray-500">m²</Text>
                                </View>
                            )}
                            {c?.estacionamientos != null && (
                                <View className="items-center flex-1">
                                    <Text className="text-2xl">🚗</Text>
                                    <Text className="text-base font-bold text-gray-900">
                                        {c.estacionamientos}
                                    </Text>
                                    <Text className="text-xs text-gray-500">Cajones</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Descripción */}
                    {propiedad.descripcion && (
                        <>
                            <Text className="text-base font-semibold text-gray-900 mb-2">
                                Descripción
                            </Text>
                            <Text className="text-sm text-gray-600 leading-6 mb-5">
                                {propiedad.descripcion}
                            </Text>
                        </>
                    )}

                    {/* Coordenadas (placeholder — mapa real en Fase 2 con API key confirmada) */}
                    {propiedad.latitud != null && propiedad.longitud != null && (
                        <View className="bg-gray-50 rounded-2xl p-4 mb-5">
                            <Text className="text-sm font-semibold text-gray-700 mb-1">
                                Ubicación aproximada
                            </Text>
                            <Text className="text-xs text-gray-400">
                                {propiedad.latitud.toFixed(6)}, {propiedad.longitud.toFixed(6)}
                            </Text>
                            <Text className="text-xs text-gray-400 mt-1">
                                Mapa interactivo disponible próximamente
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* CTA — Solicitar visita (solo compradores, no admins) */}
            {usuario && usuario.rol !== 'admin' && (
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                    <TouchableOpacity
                        className="bg-mogao-teal rounded-2xl py-4 items-center"
                        onPress={() =>
                            router.push({
                                pathname: '/solicitar-visita',
                                params: {
                                    propiedad_id: propiedad.id,
                                    titulo: propiedad.titulo,
                                },
                            })
                        }
                    >
                        <Text className="text-white font-bold text-base">Solicitar visita</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}
