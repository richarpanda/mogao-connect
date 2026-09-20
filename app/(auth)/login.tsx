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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const LOGO = require('../../assets/logo-mogao-connect.png');

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    async function handleLogin() {
        if (!email || !password) {
            Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) throw error;
        } catch (err: any) {
            Alert.alert('Error al iniciar sesión', err.message ?? 'Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        // Para activar: npx expo install expo-web-browser expo-auth-session
        // y configurar Google provider en Supabase + Google Cloud Console.
        // Ver docs/features/fase-1-google-oauth.md
        Alert.alert(
            'Google OAuth',
            'Esta función está lista para activarse. Necesitas configurar las credenciales de Google en Supabase primero.',
        );
    }

    return (
        <View className="flex-1 bg-mogao-teal">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Encabezado teal */}
                <View className="items-center justify-center pt-8 pb-10 px-6">
                    <Image
                        source={LOGO}
                        style={{ height: 150 }}
                        resizeMode="contain"
                    />
                    <View
                        style={{ height: 1, width: 40, backgroundColor: 'rgba(201,162,39,0.6)', marginTop: 20, marginBottom: 50 }}
                    />
                </View>

                {/* Card */}
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
                        {/* Heading */}
                        <Text
                            style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600', color: '#8A6C1B', marginBottom: 4, marginTop: 4 }}
                        >
                            Acceso
                        </Text>
                        <Text className="text-3xl font-bold text-mogao-teal mb-1">
                            Inicia sesión
                        </Text>
                        <Text className="text-sm text-gray-500 mb-7">
                            Ingresa tus datos para continuar
                        </Text>

                        {/* Form card */}
                        <View
                            className="bg-white rounded-2xl p-5 mb-5"
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
                            {/* Email */}
                            <Text className="text-sm font-medium text-gray-700 mb-1.5">
                                Correo electrónico
                            </Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl mb-4 px-3 bg-gray-50">
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
                                    returnKeyType="next"
                                />
                            </View>

                            {/* Password */}
                            <Text className="text-sm font-medium text-gray-700 mb-1.5">
                                Contraseña
                            </Text>
                            <View className="flex-row items-center border border-gray-200 rounded-xl mb-2 px-3 bg-gray-50">
                                <Ionicons name="lock-closed-outline" size={16} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 py-3 pl-2.5 text-sm text-gray-900"
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                    onSubmitEditing={handleLogin}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1 ml-1">
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={18}
                                        color="#9CA3AF"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Olvidé contraseña */}
                            <TouchableOpacity
                                className="self-end mb-5"
                                onPress={() => router.push('/(auth)/forgot-password' as any)}
                            >
                                <Text className="text-xs text-mogao-gold font-medium">
                                    ¿Olvidaste tu contraseña?
                                </Text>
                            </TouchableOpacity>

                            {/* Botón entrar */}
                            <TouchableOpacity
                                className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'}`}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                <Text className="text-white font-semibold text-sm">
                                    {loading ? 'Entrando...' : 'Entrar'}
                                </Text>
                                {!loading && <Ionicons name="arrow-forward" size={15} color="white" />}
                            </TouchableOpacity>
                        </View>

                        {/* Divisor */}
                        <View className="flex-row items-center gap-3 mb-5">
                            <View className="flex-1 bg-gray-200" style={{ height: 1 }} />
                            <Text className="text-xs text-gray-400">o continúa con</Text>
                            <View className="flex-1 bg-gray-200" style={{ height: 1 }} />
                        </View>

                        {/* Google */}
                        <TouchableOpacity
                            className="flex-row items-center justify-center gap-2.5 bg-white border border-gray-200 rounded-xl py-3.5 mb-3"
                            style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
                            onPress={handleGoogle}
                            disabled={googleLoading}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="logo-google" size={18} color="#EA4335" />
                            <Text className="text-gray-700 font-semibold text-sm">
                                Continuar con Google
                            </Text>
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-5">
                            <Text className="text-sm text-gray-500">¿No tienes cuenta? </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text className="text-sm text-mogao-gold font-semibold">
                                        Regístrate
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
