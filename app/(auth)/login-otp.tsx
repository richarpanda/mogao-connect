import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const LOGO_URI = 'https://www.mogaoinmobiliaria.com/assets/images/logo/mogao-logo.png';

export default function LoginOtp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSendCode() {
        if (!email.trim()) {
            Alert.alert('Correo requerido', 'Ingresa tu correo electrónico.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    shouldCreateUser: false, // solo permite acceso a cuentas existentes
                },
            });
            if (error) throw error;
            router.push({
                pathname: '/(auth)/verify-otp' as any,
                params: { email: email.trim(), type: 'email' },
            });
        } catch (err: any) {
            const msg = err.message ?? '';
            if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('no user')) {
                Alert.alert(
                    'Cuenta no encontrada',
                    'No existe una cuenta con ese correo. ¿Quieres registrarte?',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Registrarme', onPress: () => router.replace('/(auth)/register') },
                    ],
                );
            } else {
                Alert.alert('Error', msg || 'No se pudo enviar el código. Inténtalo de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-mogao-teal">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Encabezado */}
                <View className="items-center justify-center pt-8 pb-10 px-6">
                    <Image
                        source={{ uri: LOGO_URI }}
                        style={{ width: 130, height: 52 }}
                        resizeMode="contain"
                    />
                    <View
                        style={{ height: 1, width: 40, backgroundColor: 'rgba(201,162,39,0.6)', marginTop: 20, marginBottom: 14 }}
                    />
                    <Text
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' }}
                    >
                        Acceso sin contraseña
                    </Text>
                </View>

                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        className="flex-1 bg-mogao-cream rounded-t-3xl"
                        contentContainerStyle={{ padding: 28, paddingBottom: 48 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Botón volver */}
                        <TouchableOpacity
                            className="flex-row items-center gap-1.5 mb-6 self-start"
                            onPress={() => router.back()}
                        >
                            <Ionicons name="arrow-back" size={18} color="#0E3B36" />
                            <Text className="text-sm text-mogao-teal font-medium">Volver</Text>
                        </TouchableOpacity>

                        <Text
                            style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600', color: '#8A6C1B', marginBottom: 4 }}
                        >
                            Código de acceso
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-1">
                            Acceso por correo
                        </Text>
                        <Text className="text-sm text-gray-500 mb-7 leading-5">
                            Te enviaremos un código de 6 dígitos a tu correo. No necesitas contraseña.
                        </Text>

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
                                    autoFocus
                                    value={email}
                                    onChangeText={setEmail}
                                    onSubmitEditing={handleSendCode}
                                    returnKeyType="send"
                                />
                            </View>

                            <TouchableOpacity
                                className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'}`}
                                onPress={handleSendCode}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                <Text className="text-white font-semibold text-sm">
                                    {loading ? 'Enviando...' : 'Enviar código'}
                                </Text>
                                {!loading && <Ionicons name="send-outline" size={15} color="white" />}
                            </TouchableOpacity>
                        </View>

                        <Text className="text-xs text-gray-400 text-center mt-6 leading-5 px-4">
                            Solo funciona con cuentas ya registradas. Si no tienes cuenta, usa el registro.
                        </Text>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
