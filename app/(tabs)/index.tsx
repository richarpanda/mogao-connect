import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePropiedades } from '../../lib/hooks/use-propiedades';
import { useTiposPropiedad } from '../../lib/hooks/use-tipos-propiedad';
import { PropiedadCard } from '../../lib/components/propiedad-card';
import { CatalogoMapa } from '../../lib/components/catalogo-mapa';
import { FiltrosModal, FiltrosExtra } from '../../lib/components/filtros-modal';

const RECAMARA_CHIPS = [
    { label: 'Todos', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
    { label: '4+', value: 4 },
];

const FILTROS_VACIOS: FiltrosExtra = {
    banos: undefined,
    tipoId: undefined,
    precioMin: undefined,
    precioMax: undefined,
};

export default function Catalogo() {
    const router = useRouter();
    const [vista, setVista] = useState<'lista' | 'mapa'>('lista');
    const [busqueda, setBusqueda] = useState('');
    const [ciudad, setCiudad] = useState<string | undefined>();
    const [recamaras, setRecamaras] = useState<number | undefined>();
    const [filtrosExtra, setFiltrosExtra] = useState<FiltrosExtra>(FILTROS_VACIOS);
    const [filtrosVisible, setFiltrosVisible] = useState(false);

    const { propiedades, loading, error, refetch } = usePropiedades(
        ciudad,
        recamaras,
        filtrosExtra.tipoId,
        filtrosExtra.precioMin,
        filtrosExtra.precioMax,
        filtrosExtra.banos,
    );
    const { tipos } = useTiposPropiedad();

    const filtrosActivosCount = [
        filtrosExtra.banos,
        filtrosExtra.tipoId,
        filtrosExtra.precioMin,
        filtrosExtra.precioMax,
    ].filter((v) => v != null).length;

    function handleBuscar() {
        setCiudad(busqueda.trim() || undefined);
    }

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            {/* Header */}
            <View className="px-4 pt-4 pb-2">
                <Text className="text-2xl font-bold text-gray-900 mb-3">Propiedades</Text>

                {/* Búsqueda + botón de filtros */}
                <View className="flex-row gap-2 mb-3">
                    <TextInput
                        className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-base text-gray-900 bg-white"
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
                    {/* Filtros extra */}
                    <TouchableOpacity
                        onPress={() => setFiltrosVisible(true)}
                        className={`rounded-xl w-12 items-center justify-center border ${
                            filtrosActivosCount > 0
                                ? 'bg-mogao-gold border-mogao-gold'
                                : 'bg-white border-gray-300'
                        }`}
                    >
                        {filtrosActivosCount > 0 ? (
                            <Text className="text-white text-xs font-bold">{filtrosActivosCount}</Text>
                        ) : (
                            <Ionicons name="options-outline" size={20} color="#374151" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Chips de recámaras */}
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

            {/* Cuerpo: lista o mapa */}
            {error ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-red-500 text-center mb-4">{error}</Text>
                    <TouchableOpacity onPress={refetch} className="bg-mogao-teal px-6 py-3 rounded-xl">
                        <Text className="text-white font-semibold">Reintentar</Text>
                    </TouchableOpacity>
                </View>
            ) : vista === 'lista' ? (
                <FlatList
                    data={propiedades}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={refetch}
                            tintColor="#0E3B36"
                        />
                    }
                    ListEmptyComponent={
                        loading ? (
                            <View className="py-20 items-center">
                                <ActivityIndicator size="large" color="#0E3B36" />
                            </View>
                        ) : (
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
            ) : (
                <CatalogoMapa propiedades={propiedades} />
            )}

            {/* Toggle mapa / lista (botón flotante) */}
            <TouchableOpacity
                onPress={() => setVista((v) => (v === 'lista' ? 'mapa' : 'lista'))}
                className="absolute bottom-6 self-center bg-mogao-teal rounded-full px-5 py-3 flex-row items-center gap-2"
                style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
            >
                <Ionicons
                    name={vista === 'lista' ? 'map-outline' : 'list-outline'}
                    size={18}
                    color="#fff"
                />
                <Text className="text-white font-semibold text-sm">
                    {vista === 'lista' ? 'Ver mapa' : 'Ver lista'}
                </Text>
            </TouchableOpacity>

            {/* Modal de filtros */}
            <FiltrosModal
                visible={filtrosVisible}
                filtros={filtrosExtra}
                tipos={tipos}
                onAplicar={setFiltrosExtra}
                onCerrar={() => setFiltrosVisible(false)}
            />
        </SafeAreaView>
    );
}
