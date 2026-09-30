import { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Modal,
    FlatList,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../lib/supabase';
import { TipoPropiedad } from '../lib/types/database';

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Caracteristicas = {
    recamaras: string;
    banos: string;
    m2: string;
    m2_terreno: string;
    estacionamientos: string;
};

type FormState = {
    titulo: string;
    descripcion: string;
    precio: string;
    ciudad: string;
    direccion: string;
    latitud: string;
    longitud: string;
    tipo_id: string | null;
    caracteristicas: Caracteristicas;
};

type FotoSeleccionada = {
    uri: string;
    fileName: string;
};

type DocumentoSeleccionado = {
    uri: string;
    nombre: string;
    mimeType: string;
};

type DocumentoPendiente = {
    uri: string;
    mimeType: string;
};

// ─── Constantes ──────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
    titulo: '',
    descripcion: '',
    precio: '',
    ciudad: '',
    direccion: '',
    latitud: '',
    longitud: '',
    tipo_id: null,
    caracteristicas: { recamaras: '', banos: '', m2: '', m2_terreno: '', estacionamientos: '' },
};

const MAX_FOTOS = 10;

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AltaPropiedad() {
    const router = useRouter();
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [tiposPropiedad, setTiposPropiedad] = useState<TipoPropiedad[]>([]);
    const [tipoPickerVisible, setTipoPickerVisible] = useState(false);
    const [fotos, setFotos] = useState<FotoSeleccionada[]>([]);
    const [documentos, setDocumentos] = useState<DocumentoSeleccionado[]>([]);
    const [docPendiente, setDocPendiente] = useState<DocumentoPendiente | null>(null);
    const [docNombre, setDocNombre] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [loadingTipos, setLoadingTipos] = useState(true);

    useEffect(() => {
        async function fetchTipos() {
            const { data } = await supabase.from('tipos_propiedad').select('*').order('orden');
            if (data) setTiposPropiedad(data);
            setLoadingTipos(false);
        }
        fetchTipos();
    }, []);

    const selectedTipo = tiposPropiedad.find((t) => t.id === form.tipo_id);

    const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    }, []);

    const setCaract = useCallback((key: keyof Caracteristicas, value: string) => {
        setForm((prev) => ({
            ...prev,
            caracteristicas: { ...prev.caracteristicas, [key]: value },
        }));
    }, []);

    // ─── Selección de fotos ───────────────────────────────────────────────────

    async function handlePickFotos() {
        if (fotos.length >= MAX_FOTOS) {
            Alert.alert('Límite alcanzado', `Puedes subir máximo ${MAX_FOTOS} fotos.`);
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permiso requerido',
                'Necesitamos acceso a tu galería para agregar fotos.',
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
            selectionLimit: MAX_FOTOS - fotos.length,
        });

        if (!result.canceled) {
            const nuevas: FotoSeleccionada[] = result.assets.map(
                (a: ImagePicker.ImagePickerAsset, i: number) => ({
                    uri: a.uri,
                    fileName: a.fileName ?? `foto-${Date.now()}-${i}.jpg`,
                }),
            );
            setFotos((prev) => [...prev, ...nuevas].slice(0, MAX_FOTOS));
        }
    }

    function handleQuitarFoto(uri: string) {
        setFotos((prev) => prev.filter((f) => f.uri !== uri));
    }

    // ─── Selección de documentos ──────────────────────────────────────────────

    async function handlePickDocumento() {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled) return;

        const asset = result.assets[0];
        setDocNombre('');
        setDocPendiente({ uri: asset.uri, mimeType: asset.mimeType ?? 'application/octet-stream' });
    }

    function handleConfirmarDocumento() {
        if (!docPendiente || !docNombre.trim()) return;
        setDocumentos((prev) => [
            ...prev,
            { uri: docPendiente.uri, nombre: docNombre.trim(), mimeType: docPendiente.mimeType },
        ]);
        setDocPendiente(null);
        setDocNombre('');
    }

    function handleQuitarDocumento(idx: number) {
        setDocumentos((prev) => prev.filter((_, i) => i !== idx));
    }

    // ─── Submit ───────────────────────────────────────────────────────────────

    async function handleSubmit() {
        if (!form.titulo.trim()) {
            Alert.alert('Campo requerido', 'Ingresa un título para la propiedad.');
            return;
        }
        const precio = parseFloat(form.precio.replace(/,/g, ''));
        if (!form.precio || isNaN(precio) || precio <= 0) {
            Alert.alert('Campo requerido', 'Ingresa un precio válido.');
            return;
        }

        setSubmitting(true);
        setUploadProgress('Guardando información…');

        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('sin sesión');

            const { data: vendedor } = await supabase
                .from('vendedores_cuenta')
                .select('id')
                .eq('usuario_id', user.id)
                .maybeSingle();
            if (!vendedor) throw new Error('sin perfil de vendedor');

            const caracteristicas: Record<string, number> = {};
            if (form.caracteristicas.recamaras)
                caracteristicas.recamaras = parseInt(form.caracteristicas.recamaras);
            if (form.caracteristicas.banos)
                caracteristicas.banos = parseFloat(form.caracteristicas.banos);
            if (form.caracteristicas.m2)
                caracteristicas.m2 = parseFloat(form.caracteristicas.m2);
            if (form.caracteristicas.m2_terreno)
                caracteristicas.m2_terreno = parseFloat(form.caracteristicas.m2_terreno);
            if (form.caracteristicas.estacionamientos)
                caracteristicas.estacionamientos = parseInt(form.caracteristicas.estacionamientos);

            // 1. Insertar la propiedad
            const { data: propCreada, error: propError } = await supabase
                .from('propiedades')
                .insert({
                    titulo: form.titulo.trim(),
                    descripcion: form.descripcion.trim() || null,
                    precio,
                    ciudad: form.ciudad.trim() || null,
                    direccion: form.direccion.trim() || null,
                    latitud: form.latitud ? parseFloat(form.latitud) : null,
                    longitud: form.longitud ? parseFloat(form.longitud) : null,
                    tipo_id: form.tipo_id,
                    caracteristicas,
                    estatus: 'pendiente_verificacion',
                    vendedor_cuenta_id: vendedor.id,
                })
                .select('id')
                .single();

            if (propError) throw propError;
            const propiedadId = propCreada.id;

            // 2. Subir fotos → bucket público property-photos
            if (fotos.length > 0) {
                setUploadProgress(`Subiendo fotos (0/${fotos.length})…`);
                const fotosInsert: { propiedad_id: string; url: string; orden: number }[] = [];

                for (let i = 0; i < fotos.length; i++) {
                    setUploadProgress(`Subiendo fotos (${i + 1}/${fotos.length})…`);
                    const foto = fotos[i];
                    const ext = foto.fileName.split('.').pop() ?? 'jpg';
                    const path = `${propiedadId}/${crypto.randomUUID()}-${foto.fileName}`;

                    const response = await fetch(foto.uri);
                    const blob = await response.blob();

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('property-photos')
                        .upload(path, blob, { contentType: `image/${ext}` });

                    if (uploadError) {
                        console.error('[upload foto]', uploadError.message);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('property-photos')
                        .getPublicUrl(uploadData.path);

                    fotosInsert.push({ propiedad_id: propiedadId, url: publicUrl, orden: i });
                }

                if (fotosInsert.length > 0) {
                    await supabase.from('propiedad_fotos').insert(fotosInsert);
                }
            }

            // 3. Subir documentos → bucket privado property-documents (guardar path relativo)
            if (documentos.length > 0) {
                setUploadProgress(`Subiendo documentos (0/${documentos.length})…`);
                const docsInsert: { propiedad_id: string; tipo: string; url: string }[] = [];

                for (let i = 0; i < documentos.length; i++) {
                    setUploadProgress(`Subiendo documentos (${i + 1}/${documentos.length})…`);
                    const doc = documentos[i];
                    const fileName = doc.uri.split('/').pop() ?? `doc-${i}`;
                    const path = `${propiedadId}/${crypto.randomUUID()}-${fileName}`;

                    const response = await fetch(doc.uri);
                    const blob = await response.blob();

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('property-documents')
                        .upload(path, blob, { contentType: doc.mimeType });

                    if (uploadError) {
                        console.error('[upload doc]', uploadError.message);
                        continue;
                    }

                    // Guardamos el path relativo; se genera signed URL al visualizar
                    docsInsert.push({
                        propiedad_id: propiedadId,
                        tipo: doc.nombre,
                        url: uploadData.path,
                    });
                }

                if (docsInsert.length > 0) {
                    await supabase.from('propiedad_documentos').insert(docsInsert);
                }
            }

            Alert.alert(
                '¡Propiedad publicada!',
                'Tu propiedad fue enviada y aparecerá en el catálogo una vez que Mogao la verifique.',
                [{ text: 'Entendido', onPress: () => router.back() }],
            );
        } catch (err) {
            console.error('[AltaPropiedad] submit:', err);
            Alert.alert('Error', 'No se pudo publicar la propiedad. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
            setUploadProgress('');
        }
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top', 'bottom']}>
            <View className="flex-row items-center px-5 pt-4 pb-3 gap-3">
                <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="arrow-back" size={24} color="#0E3B36" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 flex-1">Publicar propiedad</Text>
            </View>

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Información básica */}
                    <SectionHeader title="Información básica" />

                    <FieldLabel label="Título *" />
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                        placeholder="Ej. Casa en Col. Roma con jardín"
                        placeholderTextColor="#9CA3AF"
                        value={form.titulo}
                        onChangeText={(v) => setField('titulo', v)}
                        maxLength={120}
                    />

                    <FieldLabel label="Descripción" />
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                        placeholder="Describe los puntos clave de la propiedad..."
                        placeholderTextColor="#9CA3AF"
                        value={form.descripcion}
                        onChangeText={(v) => setField('descripcion', v)}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{ minHeight: 96 }}
                    />

                    <FieldLabel label="Precio (MXN) *" />
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                        placeholder="Ej. 2500000"
                        placeholderTextColor="#9CA3AF"
                        value={form.precio}
                        onChangeText={(v) => setField('precio', v)}
                        keyboardType="numeric"
                    />

                    <FieldLabel label="Tipo de propiedad" />
                    <TouchableOpacity
                        onPress={() => setTipoPickerVisible(true)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 flex-row items-center justify-between"
                    >
                        <Text className={`text-sm ${selectedTipo ? 'text-gray-900' : 'text-gray-400'}`}>
                            {loadingTipos ? 'Cargando...' : selectedTipo?.nombre ?? 'Seleccionar tipo'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    {/* Características */}
                    <SectionHeader title="Características" />

                    <View className="flex-row gap-3 mb-4">
                        {(['recamaras', 'banos', 'estacionamientos'] as const).map((k) => (
                            <View key={k} className="flex-1">
                                <FieldLabel
                                    label={
                                        k === 'recamaras'
                                            ? 'Recámaras'
                                            : k === 'banos'
                                            ? 'Baños'
                                            : 'Estac.'
                                    }
                                />
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.caracteristicas[k]}
                                    onChangeText={(v) => setCaract(k, v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        ))}
                    </View>

                    <View className="flex-row gap-3 mb-4">
                        {(['m2', 'm2_terreno'] as const).map((k) => (
                            <View key={k} className="flex-1">
                                <FieldLabel label={k === 'm2' ? 'm² construidos' : 'm² terreno'} />
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                                    placeholder="0"
                                    placeholderTextColor="#9CA3AF"
                                    value={form.caracteristicas[k]}
                                    onChangeText={(v) => setCaract(k, v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        ))}
                    </View>

                    {/* Ubicación */}
                    <SectionHeader title="Ubicación" />

                    <FieldLabel label="Ciudad" />
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                        placeholder="Ej. Ciudad de México"
                        placeholderTextColor="#9CA3AF"
                        value={form.ciudad}
                        onChangeText={(v) => setField('ciudad', v)}
                    />

                    <FieldLabel label="Dirección" />
                    <TextInput
                        className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                        placeholder="Calle, número, colonia"
                        placeholderTextColor="#9CA3AF"
                        value={form.direccion}
                        onChangeText={(v) => setField('direccion', v)}
                    />

                    <View className="flex-row gap-3 mb-4">
                        {(['latitud', 'longitud'] as const).map((k) => (
                            <View key={k} className="flex-1">
                                <FieldLabel label={k === 'latitud' ? 'Latitud' : 'Longitud'} />
                                <TextInput
                                    className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                                    placeholder={k === 'latitud' ? '19.4326' : '-99.1332'}
                                    placeholderTextColor="#9CA3AF"
                                    value={form[k]}
                                    onChangeText={(v) => setField(k, v)}
                                    keyboardType="numeric"
                                />
                            </View>
                        ))}
                    </View>

                    {/* Fotos */}
                    <SectionHeader title={`Fotos (${fotos.length}/${MAX_FOTOS})`} />

                    <View className="flex-row flex-wrap gap-2 mb-3">
                        {fotos.map((foto) => (
                            <View key={foto.uri} className="w-24 h-24 rounded-xl overflow-hidden">
                                <Image
                                    source={{ uri: foto.uri }}
                                    className="w-full h-full"
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    onPress={() => handleQuitarFoto(foto.uri)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 items-center justify-center"
                                >
                                    <Ionicons name="close" size={12} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {fotos.length < MAX_FOTOS && (
                            <TouchableOpacity
                                onPress={handlePickFotos}
                                className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
                            >
                                <Ionicons name="add" size={24} color="#9CA3AF" />
                                <Text className="text-xs text-gray-400 mt-1">Agregar</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Documentos */}
                    <SectionHeader title="Documentos" />
                    <Text className="text-xs text-gray-400 mb-3">
                        Escritura, predial, agua, planos, etc. El tipo lo defines tú al agregar cada archivo.
                    </Text>

                    {documentos.map((doc, idx) => (
                        <View
                            key={idx}
                            className="bg-white border border-gray-100 rounded-xl px-4 py-3 mb-2 flex-row items-center gap-3"
                        >
                            <Ionicons name="document-outline" size={18} color="#0E3B36" />
                            <Text className="flex-1 text-sm text-gray-800" numberOfLines={1}>
                                {doc.nombre}
                            </Text>
                            <TouchableOpacity onPress={() => handleQuitarDocumento(idx)}>
                                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={handlePickDocumento}
                        className="border border-dashed border-gray-300 rounded-xl px-4 py-3 mb-6 flex-row items-center gap-2"
                    >
                        <Ionicons name="attach-outline" size={18} color="#6B7280" />
                        <Text className="text-sm text-gray-500">Agregar documento (PDF o imagen)</Text>
                    </TouchableOpacity>

                    {/* Aviso */}
                    <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex-row gap-3">
                        <Ionicons
                            name="information-circle-outline"
                            size={18}
                            color="#3B82F6"
                            style={{ marginTop: 1 }}
                        />
                        <Text className="text-xs text-blue-700 flex-1">
                            Tu propiedad quedará en estatus{' '}
                            <Text className="font-semibold">Pendiente de verificación</Text> hasta que el
                            equipo de Mogao la revise y apruebe.
                        </Text>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={submitting}
                        className={`py-4 rounded-2xl items-center ${submitting ? 'bg-gray-300' : 'bg-mogao-teal'}`}
                        activeOpacity={0.8}
                    >
                        {submitting ? (
                            <View className="items-center gap-1">
                                <ActivityIndicator size="small" color="#fff" />
                                {uploadProgress ? (
                                    <Text className="text-white text-xs mt-1">{uploadProgress}</Text>
                                ) : null}
                            </View>
                        ) : (
                            <Text className="text-white font-bold text-base">Publicar propiedad</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modal nombre de documento (reemplaza Alert.prompt — iOS y Android) */}
            <Modal
                visible={docPendiente !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setDocPendiente(null)}
            >
                <View className="flex-1 bg-black/50 items-center justify-center px-8">
                    <View className="bg-white rounded-2xl p-5 w-full">
                        <Text className="text-base font-bold text-gray-900 mb-1">
                            Nombre del documento
                        </Text>
                        <Text className="text-xs text-gray-500 mb-3">
                            Ej: Escritura, Predial, Agua, Planos…
                        </Text>
                        <TextInput
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-4"
                            placeholder="Escribe el nombre"
                            placeholderTextColor="#9CA3AF"
                            value={docNombre}
                            onChangeText={setDocNombre}
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={handleConfirmarDocumento}
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setDocPendiente(null)}
                                className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
                            >
                                <Text className="text-sm font-semibold text-gray-600">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleConfirmarDocumento}
                                disabled={!docNombre.trim()}
                                className={`flex-1 py-3 rounded-xl items-center ${docNombre.trim() ? 'bg-mogao-teal' : 'bg-gray-200'}`}
                            >
                                <Text className={`text-sm font-semibold ${docNombre.trim() ? 'text-white' : 'text-gray-400'}`}>
                                    Agregar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Picker tipo de propiedad */}
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
                    <FlatList
                        data={tiposPropiedad}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                className="py-3.5 px-2 border-b border-gray-50 flex-row items-center justify-between"
                                onPress={() => {
                                    setField('tipo_id', item.id);
                                    setTipoPickerVisible(false);
                                }}
                            >
                                <Text className="text-sm text-gray-800">{item.nombre}</Text>
                                {form.tipo_id === item.id && (
                                    <Ionicons name="checkmark" size={18} color="#0E3B36" />
                                )}
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <Text className="text-gray-400 text-sm text-center py-6">
                                Sin tipos disponibles
                            </Text>
                        }
                    />
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <Text className="text-xs font-bold text-mogao-teal uppercase tracking-wider mb-3 mt-2">
            {title}
        </Text>
    );
}

function FieldLabel({ label }: { label: string }) {
    return <Text className="text-xs font-medium text-gray-600 mb-1.5">{label}</Text>;
}
