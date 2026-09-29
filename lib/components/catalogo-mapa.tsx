import { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { PropiedadConFotos } from '../hooks/use-propiedades';
import { formatPrecio, formatPrecioCompacto } from '../utils/format';

const MEXICO_REGION = {
    latitude: 23.6345,
    longitude: -102.5528,
    latitudeDelta: 10,
    longitudeDelta: 10,
};

export function CatalogoMapa({ propiedades }: { propiedades: PropiedadConFotos[] }) {
    const router = useRouter();
    const [seleccionada, setSeleccionada] = useState<PropiedadConFotos | null>(null);

    const conCoordenadas = propiedades.filter(
        (p) => p.latitud != null && p.longitud != null,
    );

    return (
        <View className="flex-1">
            <MapView
                style={{ flex: 1 }}
                initialRegion={MEXICO_REGION}
                onPress={() => setSeleccionada(null)}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {conCoordenadas.map((p) => (
                    <Marker
                        key={p.id}
                        coordinate={{ latitude: p.latitud!, longitude: p.longitud! }}
                        onPress={() => setSeleccionada(p)}
                    >
                        <View
                            style={{
                                backgroundColor: seleccionada?.id === p.id ? '#C9A227' : '#0E3B36',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 20,
                                shadowColor: '#000',
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 3,
                            }}
                        >
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                {formatPrecioCompacto(p.precio)}
                            </Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Card flotante al seleccionar un pin */}
            {seleccionada && (
                <View
                    className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl overflow-hidden"
                    style={{ shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}
                >
                    <TouchableOpacity
                        onPress={() => router.push(`/propiedad/${seleccionada.id}`)}
                        className="flex-row"
                        activeOpacity={0.85}
                    >
                        {seleccionada.propiedad_fotos[0] ? (
                            <Image
                                source={{ uri: seleccionada.propiedad_fotos[0].url }}
                                style={{ width: 100, height: 96 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={{ width: 100, height: 96 }}
                                className="bg-gray-100 items-center justify-center"
                            >
                                <Text className="text-2xl">🏠</Text>
                            </View>
                        )}
                        <View className="flex-1 px-4 py-3 justify-center">
                            <Text className="text-base font-bold text-mogao-gold mb-0.5">
                                {formatPrecio(seleccionada.precio)}
                            </Text>
                            <Text
                                className="text-sm font-semibold text-gray-900 mb-0.5"
                                numberOfLines={1}
                            >
                                {seleccionada.titulo}
                            </Text>
                            {seleccionada.ciudad && (
                                <Text className="text-xs text-gray-500" numberOfLines={1}>
                                    📍 {seleccionada.ciudad}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setSeleccionada(null)}
                        className="absolute top-2 right-2 bg-gray-100 rounded-full w-6 h-6 items-center justify-center"
                    >
                        <Text className="text-gray-500 text-xs font-bold">✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {conCoordenadas.length === 0 && (
                <View className="absolute top-4 left-0 right-0 items-center">
                    <View className="bg-white/90 px-4 py-2 rounded-full">
                        <Text className="text-sm text-gray-500">
                            Ninguna propiedad tiene ubicación registrada
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );
}
