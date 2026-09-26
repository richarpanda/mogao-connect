import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useUsuario } from '../../lib/hooks/use-usuario';

const ROL_LABEL: Record<string, string> = {
    admin: 'Administrador',
    agente: 'Asesor',
    cliente: 'Comprador',
    vendedor: 'Vendedor / Propietario',
};

const ESTATUS_LABEL: Record<string, string> = {
    pendiente: 'Verificación pendiente',
    autorizado: 'Verificado',
    rechazado: 'Verificación rechazada',
};

export default function Perfil() {
    const router = useRouter();
    const { usuario, agente, vendedorCuenta, loading } = useUsuario();

    // El rol 'agente' usa la fila de agentes; 'vendedor' usa vendedores_cuenta
    const rolExt = agente ?? vendedorCuenta ?? null;

    async function handleLogout() {
        Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Salir',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                },
            },
        ]);
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-mogao-cream">
                <ActivityIndicator size="large" color="#0E3B36" />
            </View>
        );
    }

    const iniciales = [usuario?.nombre, usuario?.email?.charAt(0).toUpperCase()]
        .filter(Boolean)[0]
        ?.charAt(0)
        .toUpperCase() ?? '?';

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top', 'bottom']}>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                <Text className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</Text>

                {/* Avatar + info */}
                <View
                    className="bg-white rounded-2xl p-5 items-center mb-4"
                    style={{
                        shadowColor: '#0E3B36',
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 2,
                    }}
                >
                    <View
                        className="w-20 h-20 rounded-full items-center justify-center mb-3 bg-mogao-teal"
                    >
                        <Text className="text-3xl font-bold text-white">{iniciales}</Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900">{usuario?.nombre ?? '—'}</Text>
                    <Text className="text-sm text-gray-500 mb-3">{usuario?.email ?? '—'}</Text>

                    {usuario && (
                        <View className="bg-mogao-cream px-4 py-1.5 rounded-full">
                            <Text className="text-sm font-semibold text-mogao-teal">
                                {ROL_LABEL[usuario.rol] ?? usuario.rol}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Badge verificación — agentes y vendedores */}
                {rolExt && (
                    <View
                        className={`rounded-2xl p-4 mb-4 flex-row items-start gap-3 ${
                            rolExt.estatus_autorizacion === 'autorizado'
                                ? 'bg-green-50'
                                : rolExt.estatus_autorizacion === 'rechazado'
                                ? 'bg-red-50'
                                : 'bg-yellow-50'
                        }`}
                    >
                        <Ionicons
                            name={
                                rolExt.estatus_autorizacion === 'autorizado'
                                    ? 'checkmark-circle'
                                    : rolExt.estatus_autorizacion === 'rechazado'
                                    ? 'close-circle'
                                    : 'time-outline'
                            }
                            size={20}
                            color={
                                rolExt.estatus_autorizacion === 'autorizado'
                                    ? '#16a34a'
                                    : rolExt.estatus_autorizacion === 'rechazado'
                                    ? '#dc2626'
                                    : '#d97706'
                            }
                        />
                        <View className="flex-1">
                            <Text
                                className={`text-sm font-semibold ${
                                    rolExt.estatus_autorizacion === 'autorizado'
                                        ? 'text-green-700'
                                        : rolExt.estatus_autorizacion === 'rechazado'
                                        ? 'text-red-700'
                                        : 'text-yellow-700'
                                }`}
                            >
                                {ESTATUS_LABEL[rolExt.estatus_autorizacion]}
                            </Text>
                            {rolExt.estatus_autorizacion === 'pendiente' && (
                                <Text className="text-xs text-yellow-600 mt-0.5">
                                    El equipo de Mogao revisará tu cuenta en breve.
                                </Text>
                            )}
                            {rolExt.estatus_autorizacion === 'rechazado' && rolExt.motivo_rechazo && (
                                <Text className="text-xs text-red-600 mt-0.5">
                                    {rolExt.motivo_rechazo}
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Opciones de perfil */}
                <View
                    className="bg-white rounded-2xl mb-4 overflow-hidden"
                    style={{ shadowColor: '#0E3B36', shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}
                >
                    {[
                        { icon: 'person-outline', label: 'Editar perfil', onPress: () => {} },
                        { icon: 'shield-checkmark-outline', label: 'Verificación de identidad (KYC)', onPress: () => {} },
                        { icon: 'lock-closed-outline', label: 'Cambiar contraseña', onPress: () => {} },
                    ].map((item, i, arr) => (
                        <TouchableOpacity
                            key={item.label}
                            className={`flex-row items-center gap-3 px-5 py-4 ${
                                i < arr.length - 1 ? 'border-b border-gray-50' : ''
                            }`}
                            onPress={item.onPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={item.icon as any} size={20} color="#0E3B36" />
                            <Text className="flex-1 text-sm font-medium text-gray-800">{item.label}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Cerrar sesión */}
                <TouchableOpacity
                    onPress={handleLogout}
                    className="flex-row items-center justify-center gap-2 border border-red-100 bg-red-50 rounded-2xl py-4"
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                    <Text className="text-red-500 font-semibold text-sm">Cerrar sesión</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
