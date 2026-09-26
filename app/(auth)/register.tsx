import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function Register() {
    const router = useRouter();
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleRegister() {
        if (!nombre || !email || !password) {
            Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.');
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { nombre, apellido },
                },
            });
            if (error) throw error;

            if (data.session) {
                // Sin confirmación de email activa → directo a rol
                await AsyncStorage.setItem('needsRoleSelect', '1');
                router.replace('/(auth)/role-select' as any);
            } else {
                // Supabase requiere confirmar email — pantalla OTP
                router.replace({
                    pathname: '/(auth)/verify-otp' as any,
                    params: { email, type: 'signup' },
                });
            }
        } catch (err: any) {
            Alert.alert('Error al registrarse', err.message ?? 'Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-white"
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text className="text-3xl font-bold text-gray-900 mb-2">Crear cuenta</Text>
                <Text className="text-base text-gray-500 mb-10">Únete a la red Mogao</Text>

                <View className="flex-row gap-3 mb-4">
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-700 mb-1">Nombre *</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                            placeholder="Juan"
                            value={nombre}
                            onChangeText={setNombre}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-700 mb-1">Apellido</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
                            placeholder="Pérez"
                            value={apellido}
                            onChangeText={setApellido}
                        />
                    </View>
                </View>

                <Text className="text-sm font-medium text-gray-700 mb-1">Correo electrónico *</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-base text-gray-900"
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <Text className="text-sm font-medium text-gray-700 mb-1">Contraseña *</Text>
                <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 mb-8 text-base text-gray-900"
                    placeholder="Mínimo 6 caracteres"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    className={`rounded-xl py-4 items-center mb-4 ${loading ? 'bg-blue-300' : 'bg-blue-600'}`}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text className="text-white font-semibold text-base">
                        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
                    </Text>
                </TouchableOpacity>

                {/* TODO Fase 1: Google OAuth */}
                <TouchableOpacity
                    className="border border-gray-300 rounded-xl py-4 items-center mb-8"
                    onPress={() => Alert.alert('Próximamente', 'Login con Google estará disponible pronto.')}
                >
                    <Text className="text-gray-700 font-semibold text-base">Continuar con Google</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center pb-8">
                    <Text className="text-gray-500">¿Ya tienes cuenta? </Text>
                    <Link href="/(auth)/login" asChild>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-semibold">Inicia sesión</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
