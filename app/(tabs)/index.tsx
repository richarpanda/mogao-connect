import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropiedades, PropiedadConFotos } from '../../lib/hooks/use-propiedades';
import { formatPrecio } from '../../lib/utils/format';

const RECAMARA_CHIPS = [
    { label: 'Todos', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
];

const CARD_WIDTH = Dimensions.get('window').width - 32;

export default function Catalogo() {
    const router = useRouter();
    const [busqueda, setBusqueda] = useState('');
    const [ciudad, setCiudad] = useState<string | undefined>();
    const [recamaras, setRecamaras] = useState<number | undefined>();

    const { propiedades, loading, error, refetch } = usePropiedades(ciudad, recamaras);

    function handleBuscar() {
        setCiudad(busqueda.trim() || undefined);
    }

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            {/* Header */}
            <View className="px-4 pt-4 pb-2">
                <Text className="text-2xl font-bold text-gray-900 mb-3">Propiedades</Text>

                {/* Búsqueda por ciudad */}
                <View className="flex-row gap-2 mb-3">
                    <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-base text-gray-900"
                        placeholder="Buscar por ciudad..."
                        value={busqueda}
                        onChangeText={setBusqueda}
                        onSubmitEditing={handleBuscar}
                        returnKeyType="search"
                    />
                    <TouchableOpacity
                        className="bg-mogao-teal rounded-xl px-4 items-center justify-center"
                        onPress={handleBuscar}
                    >
                        <Text className="text-white font-semibold">Buscar</Text>
                    </TouchableOpacity>
                </View>

                {/* Filtro recámaras */}
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={RECAMARA_CHIPS}
                    keyExtractor={(item) => String(item.label)}
                    renderItem={({ item }) => {
                        const active = recamaras === item.value;
                        return (
                            <TouchableOpacity
                                onPress={() => setRecamaras(item.value)}
                                className={`mr-2 px-4 py-1.5 rounded-full border ${
                                    active
                                        ? 'bg-mogao-gold border-mogao-gold'
                                        : 'bg-white border-gray-300'
                                }`}
                            >
                                <Text
                                    className={`text-sm font-medium ${
                                        active ? 'text-white' : 'text-gray-600'
                                    }`}
                                >
                                    {item.label} {item.value ? '🛏' : ''}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Lista */}
            {error ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                    <TouchableOpacity onPress={refetch} className="bg-mogao-teal px-6 py-3 rounded-xl">
                        <Text className="text-white font-semibold">Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={propiedades}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        loading ? null : (
                            <View className="items-center py-20">
                                <Text className="text-gray-400 text-base">
                                    No hay propiedades disponibles
                                </Text>
                            </View>
                        )
                    }
                    renderItem={({ item }) => (
                        <PropiedadCard
                            propiedad={item}
                            onPress={() => router.push(`/propiedad/${item.id}`)}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

function PropiedadCard({
    propiedad,
    onPress,
}: {
    propiedad: PropiedadConFotos;
    onPress: () => void;
}) {
    const foto = propiedad.propiedad_fotos[0];
    const c = propiedad.caracteristicas;

    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100"
            style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}
        >
            {/* Foto */}
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

            {/* Info */}
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

                {/* Características */}
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
