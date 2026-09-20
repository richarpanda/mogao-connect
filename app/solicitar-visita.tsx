import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';

export default function SolicitarVisita() {
    const router = useRouter();
    const { propiedad_id, titulo } = useLocalSearchParams<{
        propiedad_id: string;
        titulo: string;
    }>();

    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [notas, setNotas] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSolicitar() {
        if (!fecha || !hora) {
            Alert.alert('Campos requeridos', 'Indica la fecha y hora deseada para la visita.');
            return;
        }

        // Validar formato básico antes de construir el timestamp
        const dateTimeStr = `${fecha}T${hora}:00`;
        const fechaHora = new Date(dateTimeStr);
        if (isNaN(fechaHora.getTime())) {
            Alert.alert(
                'Formato inválido',
                'Usa el formato AAAA-MM-DD para la fecha y HH:MM para la hora. Ejemplo: 2026-10-15 y 10:30',
            );
            return;
        }
        if (fechaHora < new Date()) {
            Alert.alert('Fecha inválida', 'La visita debe ser en una fecha futura.');
            return;
        }

        setLoading(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Sin sesión activa');

            // 1. Buscar contacto existente para este usuario
            const { data: contactoExistente } = await supabase
                .from('contactos')
                .select('id')
                .eq('usuario_id', user.id)
                .maybeSingle();

            let contactoId = contactoExistente?.id;

            // 2. Si no existe, crear contacto
            //    REQUIERE: contactos.agente_id nullable (migración fase-3-schema.sql)
            if (!contactoId) {
                const { data: u } = await supabase
                    .from('usuarios')
                    .select('nombre, email, telefono')
                    .eq('id', user.id)
                    .single();

                const { data: nuevoContacto, error: contactoErr } = await supabase
                    .from('contactos')
                    .insert({
                        usuario_id: user.id,
                        nombre: u?.nombre ?? user.email ?? 'Comprador',
                        email: u?.email ?? user.email,
                        telefono: u?.telefono ?? null,
                        origen: 'app',
                    })
                    .select('id')
                    .single();

                if (contactoErr) throw contactoErr;
                contactoId = nuevoContacto.id;
            }

            // 3. Crear cita sin agente (agente la toma después — Fase 4)
            //    REQUIERE: citas.agente_id nullable (migración fase-3-schema.sql)
            const { error: citaErr } = await supabase.from('citas').insert({
                contacto_id: contactoId,
                propiedad_id: propiedad_id,
                tipo: 'visita',
                estatus: 'programada',
                fecha_hora: fechaHora.toISOString(),
                notas: notas.trim() || null,
                // agente_id queda NULL — se asigna cuando un asesor la toma (Fase 4)
            });

            if (citaErr) throw citaErr;

            Alert.alert(
                '¡Solicitud enviada!',
                'Un asesor de Mogao tomará tu solicitud y se pondrá en contacto contigo.',
                [{ text: 'Entendido', onPress: () => router.push('/(tabs)/solicitudes') }],
            );
        } catch (err: any) {
            console.error('[SolicitarVisita]', err);
            Alert.alert('Error', err.message ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Encabezado */}
                <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                    <TouchableOpacity onPress={() => router.back()} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">Solicitar visita</Text>
                        {titulo ? (
                            <Text className="text-sm text-gray-500" numberOfLines={1}>
                                {titulo}
                            </Text>
                        ) : null}
                    </View>
                </View>

                <ScrollView
                    className="flex-1 px-5"
                    contentContainerStyle={{ paddingTop: 24, paddingBottom: 32 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text className="text-sm text-gray-500 mb-6 leading-5">
                        Elige una fecha y hora preferida. Un asesor confirmará disponibilidad y se
                        pondrá en contacto contigo.
                    </Text>

                    {/* Fecha */}
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                        Fecha deseada *
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
                        placeholder="AAAA-MM-DD  (ej: 2026-10-15)"
                        value={fecha}
                        onChangeText={setFecha}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                    />

                    {/* Hora */}
                    <Text className="text-sm font-medium text-gray-700 mb-1">Hora deseada *</Text>
                    <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
                        placeholder="HH:MM  (ej: 10:30)"
                        value={hora}
                        onChangeText={setHora}
                        keyboardType="numbers-and-punctuation"
                        maxLength={5}
                    />

                    {/* Notas */}
                    <Text className="text-sm font-medium text-gray-700 mb-1">
                        Notas adicionales
                    </Text>
                    <TextInput
                        className="border border-gray-300 rounded-xl px-4 py-3 mb-8 text-base text-gray-900"
                        placeholder="¿Algo que el asesor deba saber? (opcional)"
                        value={notas}
                        onChangeText={setNotas}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        style={{ minHeight: 100 }}
                    />

                    <TouchableOpacity
                        className={`rounded-2xl py-4 items-center ${
                            loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                        }`}
                        onPress={handleSolicitar}
                        disabled={loading}
                    >
                        <Text className="text-white font-bold text-base">
                            {loading ? 'Enviando...' : 'Enviar solicitud'}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
