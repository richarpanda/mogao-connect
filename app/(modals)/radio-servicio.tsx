import { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useUsuario } from '../../lib/hooks/use-usuario';
import { AppAlert, useAppAlert } from '../../lib/components/app-alert';

const RADIO_MIN = 1;
const RADIO_MAX = 100;
const RADIO_DEFAULT = 10;

export default function RadioServicio() {
    const router = useRouter();
    const { agente, loading } = useUsuario();
    const { show, alertProps } = useAppAlert();
    const [zona, setZona] = useState('');
    const [radio, setRadio] = useState(RADIO_DEFAULT);
    const [saving, setSaving] = useState(false);
    const [migracionAplicada, setMigracionAplicada] = useState<boolean | null>(null);

    useEffect(() => {
        checkMigracion();
    }, [agente]);

    async function checkMigracion() {
        if (!agente) return;
        try {
            const { error } = await supabase
                .from('agentes')
                .select('radio_km')
                .eq('id', agente.id)
                .maybeSingle();

            if (error?.message?.toLowerCase().includes('column')) {
                setMigracionAplicada(false);
            } else {
                setMigracionAplicada(true);
                const row = error ? null : await supabase
                    .from('agentes')
                    .select('radio_km, radio_lng')
                    .eq('id', agente.id)
                    .maybeSingle()
                    .then(({ data }) => data);
                if (row && (row as any).radio_km) {
                    setRadio((row as any).radio_km);
                }
            }
        } catch {
            setMigracionAplicada(false);
        }
    }

    function incrementar() {
        setRadio((v) => Math.min(v + 5, RADIO_MAX));
    }

    function decrementar() {
        setRadio((v) => Math.max(v - 5, RADIO_MIN));
    }

    async function handleGuardar() {
        if (!agente) return;
        setSaving(true);
        try {
            const { error } = await supabase
                .from('agentes')
                .update({ radio_km: radio } as any)
                .eq('id', agente.id);
            if (error) throw error;
            show({
                type: 'success',
                title: 'Guardado',
                message: 'Tu radio de servicio se actualizó correctamente.',
                actions: [{ label: 'OK', onPress: () => router.back() }],
            });
        } catch (err: any) {
            if (err.message?.toLowerCase().includes('column')) {
                show({
                    type: 'warning',
                    title: 'Migración pendiente',
                    message: 'Esta función requiere una actualización del esquema de base de datos. Consulta docs/db-schema.md → Cambios pendientes.',
                });
            } else {
                show({ type: 'error', title: 'Error', message: err.message ?? 'No se pudo guardar. Inténtalo de nuevo.' });
            }
        } finally {
            setSaving(false);
        }
    }

    if (loading || migracionAplicada === null) {
        return (
            <View className="flex-1 items-center justify-center bg-mogao-cream">
                <ActivityIndicator size="large" color="#0E3B36" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-mogao-teal">
            <SafeAreaView className="flex-1" edges={['top']}>
                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View className="pt-8 pb-10 px-6 items-start">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="flex-row items-center gap-2"
                        >
                            <Ionicons name="close" size={20} color="rgba(255,255,255,0.8)" />
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        className="flex-1 bg-mogao-cream rounded-t-3xl"
                        contentContainerStyle={{ padding: 28, paddingBottom: 48 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <Text
                            style={{
                                fontSize: 10,
                                letterSpacing: 3,
                                textTransform: 'uppercase',
                                fontWeight: '600',
                                color: '#8A6C1B',
                                marginBottom: 4,
                                marginTop: 4,
                            }}
                        >
                            Asesor
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-2">
                            Radio de servicio
                        </Text>
                        <Text className="text-sm text-gray-500 mb-6">
                            Define el área donde recibirás solicitudes de cita. Solo aparecerán las propiedades que caigan dentro de tu radio.
                        </Text>

                        {!migracionAplicada && (
                            <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex-row items-start gap-3">
                                <Ionicons name="warning-outline" size={20} color="#d97706" />
                                <View className="flex-1">
                                    <Text className="text-yellow-800 font-semibold text-sm mb-1">
                                        Migración de esquema pendiente
                                    </Text>
                                    <Text className="text-yellow-700 text-xs leading-4">
                                        Esta función requiere ejecutar la migración en Supabase.{'\n'}
                                        Ver docs/db-schema.md → Cambios pendientes.
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View
                            className="bg-white rounded-2xl p-5 mb-4"
                            style={{
                                borderWidth: 1,
                                borderColor: 'rgba(201,162,39,0.18)',
                                shadowColor: '#0E3B36',
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-sm font-medium text-gray-700 mb-1.5">
                                Ciudad o zona de referencia
                            </Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-gray-50">
                                <Ionicons name="location-outline" size={16} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                                    placeholder="Ej. Ciudad de México, CDMX"
                                    placeholderTextColor="#9CA3AF"
                                    value={zona}
                                    onChangeText={setZona}
                                    returnKeyType="done"
                                />
                            </View>
                            <Text className="text-xs text-gray-400 mt-2">
                                El pin de ubicación exacto se configurará cuando se agregue el mapa (Fase 4).
                            </Text>
                        </View>

                        <View
                            className="bg-white rounded-2xl p-5 mb-6"
                            style={{
                                borderWidth: 1,
                                borderColor: 'rgba(201,162,39,0.18)',
                                shadowColor: '#0E3B36',
                                shadowOpacity: 0.08,
                                shadowRadius: 12,
                                elevation: 2,
                            }}
                        >
                            <Text className="text-sm font-medium text-gray-700 mb-4">
                                Radio de cobertura
                            </Text>
                            <View className="flex-row items-center justify-between">
                                <TouchableOpacity
                                    onPress={decrementar}
                                    disabled={radio <= RADIO_MIN}
                                    className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                                        radio <= RADIO_MIN ? 'border-gray-200' : 'border-mogao-teal'
                                    }`}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="remove"
                                        size={22}
                                        color={radio <= RADIO_MIN ? '#D1D5DB' : '#0E3B36'}
                                    />
                                </TouchableOpacity>

                                <View className="items-center">
                                    <Text className="text-5xl font-bold text-mogao-teal">{radio}</Text>
                                    <Text className="text-sm text-gray-500 mt-1">kilómetros</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={incrementar}
                                    disabled={radio >= RADIO_MAX}
                                    className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                                        radio >= RADIO_MAX ? 'border-gray-200' : 'border-mogao-teal'
                                    }`}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name="add"
                                        size={22}
                                        color={radio >= RADIO_MAX ? '#D1D5DB' : '#0E3B36'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text className="text-xs text-gray-400 text-center mt-3">
                                Incrementos de 5 km · Rango: {RADIO_MIN}–{RADIO_MAX} km
                            </Text>
                        </View>

                        <TouchableOpacity
                            className={`items-center justify-center rounded-xl py-3.5 ${
                                saving ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                            }`}
                            onPress={handleGuardar}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {saving ? 'Guardando...' : 'Guardar radio'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            <AppAlert {...alertProps} />
        </View>
    );
}
