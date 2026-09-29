import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { TipoPropiedad } from '../types/database';

const BANOS_CHIPS = [
    { label: 'Todos', value: undefined },
    { label: '1+', value: 1 },
    { label: '2+', value: 2 },
    { label: '3+', value: 3 },
];

export type FiltrosExtra = {
    banos: number | undefined;
    tipoId: string | undefined;
    precioMin: number | undefined;
    precioMax: number | undefined;
};

export function FiltrosModal({
    visible,
    filtros,
    tipos,
    onAplicar,
    onCerrar,
}: {
    visible: boolean;
    filtros: FiltrosExtra;
    tipos: TipoPropiedad[];
    onAplicar: (f: FiltrosExtra) => void;
    onCerrar: () => void;
}) {
    const [banos, setBanos] = useState(filtros.banos);
    const [tipoId, setTipoId] = useState(filtros.tipoId);
    const [precioMinStr, setPrecioMinStr] = useState(
        filtros.precioMin != null ? String(filtros.precioMin) : '',
    );
    const [precioMaxStr, setPrecioMaxStr] = useState(
        filtros.precioMax != null ? String(filtros.precioMax) : '',
    );

    // Sync cuando se abre el modal con filtros ya activos
    useEffect(() => {
        if (visible) {
            setBanos(filtros.banos);
            setTipoId(filtros.tipoId);
            setPrecioMinStr(filtros.precioMin != null ? String(filtros.precioMin) : '');
            setPrecioMaxStr(filtros.precioMax != null ? String(filtros.precioMax) : '');
        }
    }, [visible]);

    function handleAplicar() {
        onAplicar({
            banos,
            tipoId,
            precioMin: precioMinStr ? Number(precioMinStr) : undefined,
            precioMax: precioMaxStr ? Number(precioMaxStr) : undefined,
        });
        onCerrar();
    }

    function handleLimpiar() {
        setBanos(undefined);
        setTipoId(undefined);
        setPrecioMinStr('');
        setPrecioMaxStr('');
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onCerrar}>
            <Pressable className="flex-1 bg-black/40" onPress={onCerrar} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="bg-white rounded-t-3xl"
            >
                {/* Handle */}
                <View className="items-center pt-3 pb-1">
                    <View className="w-10 h-1 bg-gray-300 rounded-full" />
                </View>

                {/* Header */}
                <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
                    <Text className="text-lg font-bold text-gray-900">Filtros</Text>
                    <TouchableOpacity onPress={handleLimpiar}>
                        <Text className="text-sm text-mogao-teal font-medium">Limpiar todo</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="px-5"
                    contentContainerStyle={{ paddingBottom: 24, paddingTop: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Baños */}
                    <Text className="text-sm font-semibold text-gray-700 mb-3">Baños</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {BANOS_CHIPS.map((chip) => {
                            const active = banos === chip.value;
                            return (
                                <TouchableOpacity
                                    key={chip.label}
                                    onPress={() => setBanos(chip.value)}
                                    className={`px-4 py-2 rounded-full border ${
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
                                        {chip.label} {chip.value ? '🚿' : ''}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Tipo de propiedad */}
                    {tipos.length > 0 && (
                        <>
                            <Text className="text-sm font-semibold text-gray-700 mb-3">
                                Tipo de propiedad
                            </Text>
                            <View className="flex-row flex-wrap gap-2 mb-6">
                                <TouchableOpacity
                                    onPress={() => setTipoId(undefined)}
                                    className={`px-4 py-2 rounded-full border ${
                                        tipoId === undefined
                                            ? 'bg-mogao-gold border-mogao-gold'
                                            : 'bg-white border-gray-300'
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-medium ${
                                            tipoId === undefined ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        Todos
                                    </Text>
                                </TouchableOpacity>
                                {tipos.map((tipo) => {
                                    const active = tipoId === tipo.id;
                                    return (
                                        <TouchableOpacity
                                            key={tipo.id}
                                            onPress={() => setTipoId(tipo.id)}
                                            className={`px-4 py-2 rounded-full border ${
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
                                                {tipo.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* Precio */}
                    <Text className="text-sm font-semibold text-gray-700 mb-3">
                        Rango de precio (MXN)
                    </Text>
                    <View className="flex-row gap-3 mb-2">
                        <View className="flex-1">
                            <Text className="text-xs text-gray-500 mb-1">Mínimo</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900"
                                placeholder="$0"
                                value={precioMinStr}
                                onChangeText={setPrecioMinStr}
                                keyboardType="numeric"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs text-gray-500 mb-1">Máximo</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2.5 text-base text-gray-900"
                                placeholder="Sin límite"
                                value={precioMaxStr}
                                onChangeText={setPrecioMaxStr}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </ScrollView>

                {/* CTA */}
                <View className="px-5 pt-3 pb-8 border-t border-gray-100">
                    <TouchableOpacity
                        onPress={handleAplicar}
                        className="bg-mogao-teal rounded-2xl py-4 items-center"
                    >
                        <Text className="text-white font-bold text-base">Aplicar filtros</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
