import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useUsuario } from '../../lib/hooks/use-usuario';

const ROL_LABEL: Record<string, string> = {
    admin: 'Administrador',
    agente: 'Asesor',
    cliente: 'Comprador',
    vendedor: 'Vendedor / Propietario',
};

const ESTATUS_AUTORIZACION_LABEL: Record<string, string> = {
    pendiente: 'Verificación pendiente',
    autorizado: 'Verificado',
    rechazado: 'Verificación rechazada',
};

export default function Perfil() {
    const router = useRouter();
    const { usuario, agente, loading } = useUsuario();

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

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top', 'bottom']}>
            <View className="flex-1 px-5 pt-6">
                <Text className="text-2xl font-bold text-gray-900 mb-6">Mi perfil</Text>

                {/* Avatar placeholder */}
                <View className="items-center mb-6">
                    <View className="w-20 h-20 bg-mogao-cream rounded-full items-center justify-center mb-3">
                        <Text className="text-3xl font-bold text-mogao-teal">
                            {usuario?.nombre?.charAt(0).toUpperCase() ?? '?'}
                        </Text>
                    </View>
                    <Text className="text-xl font-bold text-gray-900">{usuario?.nombre ?? '—'}</Text>
                    <Text className="text-sm text-gray-500">{usuario?.email ?? '—'}</Text>

                    {/* Rol badge */}
                    {usuario && (
                        <View className="mt-2 bg-mogao-cream px-4 py-1 rounded-full">
                            <Text className="text-sm font-medium text-mogao-teal">
                                {ROL_LABEL[usuario.rol] ?? usuario.rol}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Badge de estatus de verificación (solo asesores/vendedores) */}
                {agente && (
                    <View
                        className={`rounded-xl p-4 mb-4 ${
                            agente.estatus_autorizacion === 'autorizado'
                                ? 'bg-green-50'
                                : agente.estatus_autorizacion === 'rechazado'
                                ? 'bg-red-50'
                                : 'bg-yellow-50'
                        }`}
                    >
                        <Text
                            className={`text-sm font-semibold ${
                                agente.estatus_autorizacion === 'autorizado'
                                    ? 'text-green-700'
                                    : agente.estatus_autorizacion === 'rechazado'
                                    ? 'text-red-700'
                                    : 'text-yellow-700'
                            }`}
                        >
                            {agente.estatus_autorizacion === 'autorizado' ? '✓ ' : '⏳ '}
                            {ESTATUS_AUTORIZACION_LABEL[agente.estatus_autorizacion]}
                        </Text>
                        {agente.estatus_autorizacion === 'pendiente' && (
                            <Text className="text-xs text-yellow-600 mt-1">
                                El equipo de Mogao revisará tu cuenta pronto.
                            </Text>
                        )}
                        {agente.estatus_autorizacion === 'rechazado' && agente.motivo_rechazo && (
                            <Text className="text-xs text-red-600 mt-1">{agente.motivo_rechazo}</Text>
                        )}
                    </View>
                )}

                {/* Placeholder — opciones de perfil (Fase 1 completa: KYC, radio de servicio, etc.) */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <Text className="text-xs text-gray-400 text-center">
                        Editar perfil, KYC y área de servicio — Fase 1 completa
                    </Text>
                </View>

                <View className="flex-1" />

                <TouchableOpacity
                    onPress={handleLogout}
                    className="border border-red-200 rounded-xl py-4 items-center mb-4"
                >
                    <Text className="text-red-500 font-semibold">Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
