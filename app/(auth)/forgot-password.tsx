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
import { AppAlert, useAppAlert } from '../../lib/components/app-alert';

export default function ForgotPassword() {
    const router = useRouter();
    const { show, alertProps } = useAppAlert();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    async function handleSend() {
        if (!email.trim()) {
            show({ type: 'warning', title: 'Campo requerido', message: 'Ingresa tu correo electrónico.' });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            show({ type: 'error', title: 'Error', message: err.message ?? 'No pudimos enviar el correo. Inténtalo de nuevo.' });
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
                            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.8)" />
                            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Volver</Text>
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
                            Acceso
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-2">
                            Recuperar contraseña
                        </Text>
                        <Text className="text-sm text-gray-500 mb-8">
                            Te enviaremos un enlace para restablecer tu contraseña.
                        </Text>

                        {sent ? (
                            <View className="bg-green-50 rounded-2xl p-5 flex-row items-start gap-3 border border-green-100">
                                <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                                <View className="flex-1">
                                    <Text className="text-green-700 font-semibold text-sm mb-1">
                                        Correo enviado
                                    </Text>
                                    <Text className="text-green-600 text-sm leading-5">
                                        Revisa tu bandeja en {email} y sigue las instrucciones para restablecer tu contraseña.
                                    </Text>
                                    <TouchableOpacity
                                        className="mt-4 flex-row items-center gap-1.5"
                                        onPress={() => router.back()}
                                    >
                                        <Ionicons name="arrow-back" size={14} color="#0E3B36" />
                                        <Text className="text-mogao-teal text-sm font-medium">Volver al inicio de sesión</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View
                                className="bg-white rounded-2xl p-5"
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
                                    Correo electrónico
                                </Text>
                                <View className="flex-row items-center border border-gray-200 rounded-xl mb-5 px-3 bg-gray-50">
                                    <Ionicons name="mail-outline" size={16} color="#9CA3AF" />
                                    <TextInput
                                        className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                                        placeholder="tu@correo.com"
                                        placeholderTextColor="#9CA3AF"
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                        value={email}
                                        onChangeText={setEmail}
                                        returnKeyType="done"
                                        onSubmitEditing={handleSend}
                                    />
                                </View>

                                <TouchableOpacity
                                    className={`items-center justify-center rounded-xl py-3.5 ${
                                        loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                                    }`}
                                    onPress={handleSend}
                                    disabled={loading}
                                    activeOpacity={0.85}
                                >
                                    <Text className="text-white font-semibold text-sm">
                                        {loading ? 'Enviando...' : 'Enviar enlace'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            <AppAlert {...alertProps} />
        </View>
    );
}
