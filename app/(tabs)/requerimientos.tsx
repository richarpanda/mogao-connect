import { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    useRequerimientos,
    RequerimientoConDetalle,
    CrearRequerimientoInput,
} from '../../lib/hooks/use-requerimientos';
import { TipoPropiedad, TipoOperacion } from '../../lib/types/database';
import { formatPrecio } from '../../lib/utils/format';

const TIPO_OPERACION_LABEL: Record<TipoOperacion, string> = {
    compra: 'Compra',
    renta: 'Renta',
};

const TIPO_OPERACION_COLOR: Record<TipoOperacion, string> = {
    compra: 'bg-blue-100 text-blue-700',
    renta: 'bg-purple-100 text-purple-700',
};

const FORM_EMPTY: CrearRequerimientoInput = {
    tipo_operacion: 'compra',
    tipo_propiedad_id: null,
    precio_min: null,
    precio_max: null,
    zona: null,
    notas: null,
};

export default function Requerimientos() {
    const [tab, setTab] = useState<'todos' | 'mios'>('todos');
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState<RequerimientoConDetalle | null>(null);
    const { requerimientos, tiposPropiedad, agenteId, loading, refetch, crear, editar, desactivar } =
        useRequerimientos();

    const lista = tab === 'todos' ? requerimientos : requerimientos.filter((r) => r.es_propio);

    function openCrear() {
        setEditando(null);
        setModalVisible(true);
    }

    function openEditar(req: RequerimientoConDetalle) {
        setEditando(req);
        setModalVisible(true);
    }

    async function handleDesactivar(req: RequerimientoConDetalle) {
        Alert.alert('Retirar requerimiento', '¿Deseas retirar este requerimiento del tablero?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Retirar',
                style: 'destructive',
                onPress: async () => {
                    const result = await desactivar(req.id);
                    if (!result.success)
                        Alert.alert('Error', 'No se pudo retirar el requerimiento.');
                },
            },
        ]);
    }

    async function handleGuardar(input: CrearRequerimientoInput) {
        const result = editando
            ? await editar(editando.id, input)
            : await crear(input);

        if (result.success) {
            setModalVisible(false);
        } else {
            Alert.alert('Error', 'No se pudo guardar el requerimiento. Intenta de nuevo.');
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top']}>
            {/* Header */}
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
                <Text className="text-2xl font-bold text-gray-900">Requerimientos</Text>
                <TouchableOpacity
                    onPress={openCrear}
                    className="bg-mogao-teal px-4 py-2 rounded-xl flex-row items-center gap-1.5"
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Publicar</Text>
                </TouchableOpacity>
            </View>

            {/* Sub-tabs */}
            <View className="mx-5 mb-3 flex-row bg-gray-100 rounded-xl p-1">
                {(['todos', 'mios'] as const).map((t) => (
                    <TouchableOpacity
                        key={t}
                        onPress={() => setTab(t)}
                        className={`flex-1 py-2 rounded-lg items-center ${tab === t ? 'bg-white' : ''}`}
                    >
                        <Text
                            className={`text-sm font-semibold ${tab === t ? 'text-gray-900' : 'text-gray-500'}`}
                        >
                            {t === 'todos' ? 'Todos' : 'Mis publicaciones'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0E3B36" />
                </View>
            ) : (
                <FlatList
                    data={lista}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    refreshControl={
                        <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0E3B36" />
                    }
                    ListEmptyComponent={
                        <View className="items-center py-20 px-6">
                            <Ionicons name="list-outline" size={48} color="#D1D5DB" />
                            <Text className="text-gray-400 text-base text-center mt-4">
                                {tab === 'todos'
                                    ? 'No hay requerimientos activos en la red'
                                    : 'Aún no has publicado ningún requerimiento'}
                            </Text>
                            {tab === 'mios' && (
                                <TouchableOpacity
                                    onPress={openCrear}
                                    className="mt-5 bg-mogao-teal px-6 py-3 rounded-xl"
                                >
                                    <Text className="text-white font-semibold">Publicar primero</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    renderItem={({ item }) => (
                        <RequerimientoCard
                            req={item}
                            onEditar={openEditar}
                            onDesactivar={handleDesactivar}
                        />
                    )}
                />
            )}

            <RequerimientoModal
                visible={modalVisible}
                editando={editando}
                tiposPropiedad={tiposPropiedad}
                onClose={() => setModalVisible(false)}
                onGuardar={handleGuardar}
            />
        </SafeAreaView>
    );
}

// ─── Card ────────────────────────────────────────────────────────────────────

function RequerimientoCard({
    req,
    onEditar,
    onDesactivar,
}: {
    req: RequerimientoConDetalle;
    onEditar: (r: RequerimientoConDetalle) => void;
    onDesactivar: (r: RequerimientoConDetalle) => void;
}) {
    const opColor = TIPO_OPERACION_COLOR[req.tipo_operacion] ?? 'bg-gray-100 text-gray-600';
    const [bg, fg] = opColor.split(' ');

    return (
        <View
            className="bg-white border border-gray-100 rounded-2xl p-4"
            style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
        >
            <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center gap-2 flex-1 flex-wrap">
                    <View className={`px-2.5 py-1 rounded-full ${bg}`}>
                        <Text className={`text-xs font-semibold ${fg}`}>
                            {TIPO_OPERACION_LABEL[req.tipo_operacion]}
                        </Text>
                    </View>
                    {req.tipos_propiedad && (
                        <View className="bg-gray-100 px-2.5 py-1 rounded-full">
                            <Text className="text-xs font-medium text-gray-600">
                                {req.tipos_propiedad.nombre}
                            </Text>
                        </View>
                    )}
                </View>

                {req.es_propio && (
                    <View className="flex-row gap-1">
                        <TouchableOpacity
                            onPress={() => onEditar(req)}
                            className="w-8 h-8 rounded-full bg-gray-50 items-center justify-center"
                        >
                            <Ionicons name="pencil-outline" size={14} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onDesactivar(req)}
                            className="w-8 h-8 rounded-full bg-red-50 items-center justify-center"
                        >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {req.zona && (
                <Text className="text-sm text-gray-700 mb-1">
                    📍 <Text className="font-medium">{req.zona}</Text>
                </Text>
            )}

            {(req.precio_min != null || req.precio_max != null) && (
                <Text className="text-sm text-gray-600 mb-1">
                    💰{' '}
                    {req.precio_min != null && req.precio_max != null
                        ? `${formatPrecio(req.precio_min)} – ${formatPrecio(req.precio_max)}`
                        : req.precio_min != null
                        ? `Desde ${formatPrecio(req.precio_min)}`
                        : `Hasta ${formatPrecio(req.precio_max!)}`}
                </Text>
            )}

            {req.notas && (
                <Text className="text-xs text-gray-400 mt-1 mb-2" numberOfLines={2}>
                    {req.notas}
                </Text>
            )}

            <View className="mt-2 flex-row items-center gap-1.5">
                <Ionicons name="home-outline" size={13} color="#0E3B36" />
                <Text className="text-xs text-mogao-teal font-semibold">
                    {req.coincidencias}{' '}
                    {req.coincidencias === 1 ? 'propiedad coincide' : 'propiedades coinciden'}
                </Text>
            </View>
        </View>
    );
}

// ─── Modal de crear / editar ──────────────────────────────────────────────────

function RequerimientoModal({
    visible,
    editando,
    tiposPropiedad,
    onClose,
    onGuardar,
}: {
    visible: boolean;
    editando: RequerimientoConDetalle | null;
    tiposPropiedad: TipoPropiedad[];
    onClose: () => void;
    onGuardar: (input: CrearRequerimientoInput) => Promise<void>;
}) {
    const [form, setForm] = useState<CrearRequerimientoInput>(FORM_EMPTY);
    const [tipoPickerVisible, setTipoPickerVisible] = useState(false);
    const [saving, setSaving] = useState(false);

    // Re-inicializar el form cada vez que el modal se abre
    const [lastVisible, setLastVisible] = useState(false);
    if (visible && !lastVisible) {
        setLastVisible(true);
        setForm(
            editando
                ? {
                      tipo_operacion: editando.tipo_operacion,
                      tipo_propiedad_id: editando.tipo_propiedad_id,
                      precio_min: editando.precio_min,
                      precio_max: editando.precio_max,
                      zona: editando.zona,
                      notas: editando.notas,
                  }
                : FORM_EMPTY,
        );
    }
    if (!visible && lastVisible) {
        setLastVisible(false);
    }

    const selectedTipo = tiposPropiedad.find((t) => t.id === form.tipo_propiedad_id);

    async function handleGuardar() {
        if (!form.zona?.trim() && form.precio_min == null && form.precio_max == null && !form.tipo_propiedad_id) {
            Alert.alert('Faltan datos', 'Agrega al menos una zona, rango de precio o tipo de propiedad.');
            return;
        }
        setSaving(true);
        try {
            await onGuardar({
                ...form,
                zona: form.zona?.trim() || null,
                notas: form.notas?.trim() || null,
            });
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={onClose} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View className="bg-white rounded-t-3xl px-5 pt-5 pb-8">
                    <View className="flex-row items-center justify-between mb-5">
                        <Text className="text-base font-bold text-gray-900">
                            {editando ? 'Editar requerimiento' : 'Nuevo requerimiento'}
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                        {/* Tipo de operación */}
                        <Text className="text-xs font-medium text-gray-600 mb-2">Tipo de operación</Text>
                        <View className="flex-row gap-3 mb-4">
                            {(['compra', 'renta'] as TipoOperacion[]).map((op) => (
                                <TouchableOpacity
                                    key={op}
                                    onPress={() => setForm((f) => ({ ...f, tipo_operacion: op }))}
                                    className={`flex-1 py-2.5 rounded-xl items-center border ${
                                        form.tipo_operacion === op
                                            ? 'bg-mogao-teal border-mogao-teal'
                                            : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <Text
                                        className={`text-sm font-semibold ${
                                            form.tipo_operacion === op ? 'text-white' : 'text-gray-600'
                                        }`}
                                    >
                                        {TIPO_OPERACION_LABEL[op]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Tipo de propiedad */}
                        <Text className="text-xs font-medium text-gray-600 mb-2">Tipo de propiedad</Text>
                        <TouchableOpacity
                            onPress={() => setTipoPickerVisible(true)}
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
                        >
                            <Text
                                className={`text-sm ${selectedTipo ? 'text-gray-900' : 'text-gray-400'}`}
                            >
                                {selectedTipo?.nombre ?? 'Cualquier tipo'}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Zona */}
                        <Text className="text-xs font-medium text-gray-600 mb-2">Zona / Ciudad</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                            placeholder="Ej. Roma Norte, CDMX"
                            placeholderTextColor="#9CA3AF"
                            value={form.zona ?? ''}
                            onChangeText={(v) => setForm((f) => ({ ...f, zona: v || null }))}
                        />

                        {/* Rango de precio */}
                        <Text className="text-xs font-medium text-gray-600 mb-2">Rango de precio (MXN)</Text>
                        <View className="flex-row gap-3 mb-4">
                            <View className="flex-1">
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                                    placeholder="Mínimo"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.precio_min != null ? String(form.precio_min) : ''}
                                    onChangeText={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            precio_min: v ? parseFloat(v) : null,
                                        }))
                                    }
                                    keyboardType="numeric"
                                />
                            </View>
                            <View className="flex-1">
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                                    placeholder="Máximo"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.precio_max != null ? String(form.precio_max) : ''}
                                    onChangeText={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            precio_max: v ? parseFloat(v) : null,
                                        }))
                                    }
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Notas */}
                        <Text className="text-xs font-medium text-gray-600 mb-2">Notas adicionales</Text>
                        <TextInput
                            className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-6"
                            placeholder="Ej. cerca de escuela, planta baja..."
                            placeholderTextColor="#9CA3AF"
                            value={form.notas ?? ''}
                            onChangeText={(v) => setForm((f) => ({ ...f, notas: v || null }))}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{ minHeight: 72 }}
                        />

                        <TouchableOpacity
                            onPress={handleGuardar}
                            disabled={saving}
                            className={`py-4 rounded-2xl items-center ${saving ? 'bg-gray-300' : 'bg-mogao-teal'}`}
                            activeOpacity={0.8}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text className="text-white font-bold text-base">
                                    {editando ? 'Guardar cambios' : 'Publicar requerimiento'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Picker de tipo de propiedad */}
                    <Modal
                        visible={tipoPickerVisible}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setTipoPickerVisible(false)}
                    >
                        <TouchableOpacity
                            className="flex-1 bg-black/40"
                            activeOpacity={1}
                            onPress={() => setTipoPickerVisible(false)}
                        />
                        <View className="bg-white rounded-t-3xl px-5 pt-4 pb-8" style={{ maxHeight: '50%' }}>
                            <View className="flex-row items-center justify-between mb-4">
                                <Text className="text-base font-bold text-gray-900">Tipo de propiedad</Text>
                                <TouchableOpacity onPress={() => setTipoPickerVisible(false)}>
                                    <Ionicons name="close" size={22} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                            {/* Opción "Cualquier tipo" */}
                            <TouchableOpacity
                                className="py-3.5 px-2 border-b border-gray-50 flex-row items-center justify-between"
                                onPress={() => {
                                    setForm((f) => ({ ...f, tipo_propiedad_id: null }));
                                    setTipoPickerVisible(false);
                                }}
                            >
                                <Text className="text-sm text-gray-500 italic">Cualquier tipo</Text>
                                {form.tipo_propiedad_id === null && (
                                    <Ionicons name="checkmark" size={18} color="#0E3B36" />
                                )}
                            </TouchableOpacity>
                            <FlatList
                                data={tiposPropiedad}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        className="py-3.5 px-2 border-b border-gray-50 flex-row items-center justify-between"
                                        onPress={() => {
                                            setForm((f) => ({ ...f, tipo_propiedad_id: item.id }));
                                            setTipoPickerVisible(false);
                                        }}
                                    >
                                        <Text className="text-sm text-gray-800">{item.nombre}</Text>
                                        {form.tipo_propiedad_id === item.id && (
                                            <Ionicons name="checkmark" size={18} color="#0E3B36" />
                                        )}
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </Modal>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}
