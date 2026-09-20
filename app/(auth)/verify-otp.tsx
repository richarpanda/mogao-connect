import { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const LOGO = require('../../assets/logo-mogao-connect.png');
const RESEND_SECONDS = 60;

function OtpBoxes({
    value,
    onChange,
    disabled,
}: {
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
}) {
    const refs = useRef<(TextInput | null)[]>([]);

    return (
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'center', marginVertical: 8 }}>
            {Array.from({ length: 6 }).map((_, i) => {
                const char = value[i] ?? '';
                const active = !!char;
                return (
                    <TextInput
                        key={i}
                        ref={(el) => { refs.current[i] = el; }}
                        style={{
                            width: 44,
                            height: 54,
                            borderWidth: 1.5,
                            borderColor: active ? '#C9A227' : '#D1D5DB',
                            borderRadius: 12,
                            textAlign: 'center',
                            fontSize: 22,
                            fontWeight: '700',
                            color: '#111827',
                            backgroundColor: active ? '#FAF7F0' : '#fff',
                            opacity: disabled ? 0.6 : 1,
                        }}
                        maxLength={1}
                        keyboardType="number-pad"
                        value={char}
                        editable={!disabled}
                        onChangeText={(v) => {
                            // Soporta pegar el código completo
                            const cleaned = v.replace(/\D/g, '').slice(0, 6 - i);
                            const arr = value.split('').concat(Array(6).fill('')).slice(0, 6);
                            cleaned.split('').forEach((c, j) => { arr[i + j] = c; });
                            const next = arr.slice(0, 6).join('');
                            onChange(next);
                            const jumpTo = Math.min(i + cleaned.length, 5);
                            refs.current[jumpTo]?.focus();
                        }}
                        onKeyPress={({ nativeEvent }) => {
                            if (nativeEvent.key === 'Backspace' && !char && i > 0) {
                                const arr = value.split('');
                                arr[i - 1] = '';
                                onChange(arr.join(''));
                                refs.current[i - 1]?.focus();
                            }
                        }}
                    />
                );
            })}
        </View>
    );
}

export default function VerifyOtp() {
    const router = useRouter();
    const { email, type } = useLocalSearchParams<{ email: string; type: 'signup' | 'email' }>();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    async function handleVerify() {
        if (code.replace(/\s/g, '').length < 6) {
            Alert.alert('Código incompleto', 'Ingresa los 6 dígitos del código.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: code,
                type: type === 'signup' ? 'signup' : 'email',
            });
            if (error) throw error;

            if (type === 'signup') {
                // Cuenta nueva verificada → selección de rol
                router.replace('/(auth)/role-select' as any);
            }
            // Para type='email', onAuthStateChange en AuthProvider redirige a tabs
        } catch (err: any) {
            const msg: string = err.message ?? '';
            if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
                Alert.alert('Código inválido', 'El código expiró o es incorrecto. Solicita uno nuevo.');
            } else {
                Alert.alert('Error', msg || 'No se pudo verificar el código.');
            }
            setCode('');
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setResendLoading(true);
        try {
            if (type === 'signup') {
                const { error } = await supabase.auth.resend({ type: 'signup', email });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { shouldCreateUser: false },
                });
                if (error) throw error;
            }
            setCode('');
            setCountdown(RESEND_SECONDS);
            Alert.alert('Código enviado', 'Revisa tu bandeja de entrada.');
        } catch (err: any) {
            Alert.alert('Error', err.message ?? 'No se pudo reenviar el código.');
        } finally {
            setResendLoading(false);
        }
    }

    const maskedEmail = email
        ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
        : '';

    const isSignup = type === 'signup';

    return (
        <View className="flex-1 bg-mogao-teal">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Encabezado */}
                <View className="items-center justify-center pt-8 pb-10 px-6">
                    <Image
                        source={LOGO}
                        style={{ width: 130, height: 52 }}
                        resizeMode="contain"
                    />
                    <View
                        style={{ height: 1, width: 40, backgroundColor: 'rgba(201,162,39,0.6)', marginTop: 20, marginBottom: 14 }}
                    />
                    <Text
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' }}
                    >
                        {isSignup ? 'Verifica tu cuenta' : 'Código de acceso'}
                    </Text>
                </View>

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
                        {isSignup ? 'Confirmación' : 'Verificación'}
                    </Text>
                    <Text className="text-3xl font-bold text-mogao-teal mb-1">
                        Ingresa el código
                    </Text>
                    <Text className="text-sm text-gray-500 mb-7 leading-5">
                        Te enviamos un código de 6 dígitos a{' '}
                        <Text className="font-semibold text-gray-700">{maskedEmail}</Text>
                    </Text>

                    {/* Cajas OTP */}
                    <View
                        className="bg-white rounded-2xl p-6 mb-6"
                        style={{
                            borderWidth: 1,
                            borderColor: 'rgba(201,162,39,0.18)',
                            shadowColor: '#0E3B36',
                            shadowOpacity: 0.1,
                            shadowRadius: 24,
                            shadowOffset: { width: 0, height: 8 },
                            elevation: 4,
                            alignItems: 'center',
                        }}
                    >
                        <OtpBoxes value={code} onChange={setCode} disabled={loading} />

                        <Text className="text-xs text-gray-400 mt-4 mb-6 text-center">
                            El código expira en 10 minutos
                        </Text>

                        <TouchableOpacity
                            className={`w-full flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'}`}
                            onPress={handleVerify}
                            disabled={loading || code.length < 6}
                            activeOpacity={0.85}
                            style={{ opacity: code.length < 6 && !loading ? 0.5 : 1 }}
                        >
                            <Text className="text-white font-semibold text-sm">
                                {loading ? 'Verificando...' : 'Verificar código'}
                            </Text>
                            {!loading && <Ionicons name="checkmark-circle-outline" size={17} color="white" />}
                        </TouchableOpacity>
                    </View>

                    {/* Reenviar */}
                    <View className="items-center">
                        <Text className="text-sm text-gray-500 mb-2">¿No recibiste el código?</Text>
                        {countdown > 0 ? (
                            <Text className="text-sm text-gray-400">
                                Reenviar en{' '}
                                <Text className="font-semibold text-mogao-teal">{countdown}s</Text>
                            </Text>
                        ) : (
                            <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                                <Text className="text-sm text-mogao-gold font-semibold">
                                    {resendLoading ? 'Enviando...' : 'Reenviar código'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
