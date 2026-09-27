import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useUsuario } from '../../lib/hooks/use-usuario';
import { AppAlert, useAppAlert } from '../../lib/components/app-alert';

function CampoPassword({
    label,
    value,
    onChange,
    placeholder,
    onSubmit,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
}) {
    const [visible, setVisible] = useState(false);
    return (
        <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>
            <View className="flex-row items-center border border-gray-200 rounded-xl px-3 bg-gray-50">
                <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                <TextInput
                    className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                    placeholder={placeholder ?? '••••••••'}
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={!visible}
                    value={value}
                    onChangeText={onChange}
                    returnKeyType={onSubmit ? 'done' : 'next'}
                    onSubmitEditing={onSubmit}
                />
                <TouchableOpacity onPress={() => setVisible((v) => !v)} className="p-1 ml-1">
                    <Ionicons
                        name={visible ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#9CA3AF"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function CambiarPassword() {
    const router = useRouter();
    const { usuario } = useUsuario();
    const { show, alertProps } = useAppAlert();
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleChange() {
        if (!actual || !nueva || !confirmar) {
            show({ type: 'warning', title: 'Campos requeridos', message: 'Completa todos los campos.' });
            return;
        }
        if (nueva.length < 6) {
            show({ type: 'warning', title: 'Contraseña muy corta', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
            return;
        }
        if (nueva !== confirmar) {
            show({ type: 'warning', title: 'No coinciden', message: 'La nueva contraseña y su confirmación no son iguales.' });
            return;
        }
        if (!usuario?.email) {
            show({ type: 'error', title: 'Error', message: 'No se pudo obtener el correo de la cuenta.' });
            return;
        }
        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: usuario.email,
                password: actual,
            });
            if (signInError) throw new Error('La contraseña actual es incorrecta.');

            const { error: updateError } = await supabase.auth.updateUser({ password: nueva });
            if (updateError) throw updateError;

            show({
                type: 'success',
                title: 'Contraseña actualizada',
                message: 'Tu contraseña se cambió correctamente.',
                actions: [{ label: 'OK', onPress: () => router.back() }],
            });
        } catch (err: any) {
            show({ type: 'error', title: 'Error', message: err.message ?? 'No se pudo cambiar la contraseña.' });
        } finally {
            setLoading(false);
        }
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
                            Seguridad
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-8">
                            Cambiar contraseña
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
                            <CampoPassword
                                label="Contraseña actual"
                                value={actual}
                                onChange={setActual}
                            />
                            <CampoPassword
                                label="Nueva contraseña"
                                value={nueva}
                                onChange={setNueva}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <CampoPassword
                                label="Confirmar nueva contraseña"
                                value={confirmar}
                                onChange={setConfirmar}
                                onSubmit={handleChange}
                            />
                        </View>

                        <TouchableOpacity
                            className={`items-center justify-center rounded-xl py-3.5 ${
                                loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                            }`}
                            onPress={handleChange}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            <AppAlert {...alertProps} />
        </View>
    );
}
