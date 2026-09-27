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

export default function EditarPerfil() {
    const router = useRouter();
    const { usuario, loading, refetch } = useUsuario();
    const { show, alertProps } = useAppAlert();
    const [nombre, setNombre] = useState('');
    const [telefono, setTelefono] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (usuario) {
            setNombre(usuario.nombre ?? '');
            setTelefono(usuario.telefono ?? '');
        }
    }, [usuario]);

    async function handleSave() {
        if (!nombre.trim()) {
            show({ type: 'warning', title: 'Campo requerido', message: 'El nombre no puede estar vacío.' });
            return;
        }
        setSaving(true);
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Sin sesión');
            const { error } = await supabase
                .from('usuarios')
                .update({ nombre: nombre.trim(), telefono: telefono.trim() || null })
                .eq('id', user.id);
            if (error) throw error;
            refetch();
            show({
                type: 'success',
                title: 'Perfil actualizado',
                message: 'Tus datos se guardaron correctamente.',
                actions: [{ label: 'OK', onPress: () => router.back() }],
            });
        } catch (err: any) {
            show({ type: 'error', title: 'Error', message: err.message ?? 'No se pudo guardar. Inténtalo de nuevo.' });
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
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
                            Perfil
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-8">
                            Editar perfil
                        </Text>

                        <View
                            className="bg-white rounded-2xl p-5 mb-6"
                            style={{
                                borderWidth: 1,
                                borderColor: 'rgba(201,162,39,0.18)',
                                shadowColor: '#0E3B36',
                                shadowOpacity: 0.1,
                                shadowRadius: 24,
                                shadowOffset: { width: 0, height: 8 },
                                elevation: 4,
                            }}
                        >
                            <Text className="text-sm font-medium text-gray-700 mb-1.5">
                                Nombre completo *
                            </Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl mb-4 px-3 bg-gray-50">
                                <Ionicons name="person-outline" size={16} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                                    placeholder="Tu nombre completo"
                                    placeholderTextColor="#9CA3AF"
                                    value={nombre}
                                    onChangeText={setNombre}
                                    returnKeyType="next"
                                />
                            </View>

                            <Text className="text-sm font-medium text-gray-700 mb-1.5">
                                Teléfono
                            </Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-gray-50">
                                <Ionicons name="call-outline" size={16} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                                    placeholder="+52 55 0000 0000"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                    value={telefono}
                                    onChangeText={setTelefono}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSave}
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            className={`items-center justify-center rounded-xl py-3.5 ${
                                saving ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                            }`}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {saving ? 'Guardando...' : 'Guardar cambios'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            <AppAlert {...alertProps} />
        </View>
    );
}
