import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { PropiedadConFotos } from '../hooks/use-propiedades';
import { CaracteristicasPropiedad } from '../types/database';
import { formatPrecio } from '../utils/format';

const CARD_WIDTH = Dimensions.get('window').width - 32;

export function PropiedadCard({
    propiedad,
    onPress,
}: {
    propiedad: PropiedadConFotos;
    onPress: () => void;
}) {
    const foto = propiedad.propiedad_fotos[0];
    const c = propiedad.caracteristicas as CaracteristicasPropiedad;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        >
            {foto ? (
                <Image
                    source={{ uri: foto.url }}
                    style={{ width: CARD_WIDTH, height: 200 }}
                    resizeMode="cover"
                />
            ) : (
                <View
                    style={{ width: CARD_WIDTH, height: 200 }}
                    className="bg-gray-100 items-center justify-center"
                >
                    <Text className="text-gray-400 text-4xl">🏠</Text>
                </View>
            )}

            <View className="p-4">
                <Text className="text-xl font-bold text-mogao-gold mb-1">
                    {formatPrecio(propiedad.precio)}
                </Text>
                <Text className="text-base font-semibold text-gray-900 mb-1" numberOfLines={1}>
                    {propiedad.titulo}
                </Text>
                {propiedad.ciudad && (
                    <Text className="text-sm text-gray-500 mb-3" numberOfLines={1}>
                        📍 {propiedad.ciudad}
                        {propiedad.direccion ? ` · ${propiedad.direccion}` : ''}
                    </Text>
                )}

                <View className="flex-row gap-3">
                    {c?.recamaras != null && (
                        <Text className="text-sm text-gray-600">🛏 {c.recamaras} rec</Text>
                    )}
                    {c?.banos != null && (
                        <Text className="text-sm text-gray-600">🚿 {c.banos} baños</Text>
                    )}
                    {c?.m2 != null && (
                        <Text className="text-sm text-gray-600">📐 {c.m2} m²</Text>
                    )}
                </View>

                {propiedad.tipos_propiedad && (
                    <View className="mt-2">
                        <Text className="text-xs text-gray-400">
                            {propiedad.tipos_propiedad.nombre}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}
