import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useUsuario } from '../../lib/hooks/use-usuario';
import { useAuth, type Modo } from '../../lib/context/auth-context';
import { AppAlert, useAppAlert } from '../../lib/components/app-alert';

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
    const { modoActivo, setModoActivo } = useAuth();
    const { usuario, agente, vendedorCuenta, tieneAmbosRoles, loading } = useUsuario();
    const { show, alertProps } = useAppAlert();

    const rolExt = agente ?? vendedorCuenta ?? null;

    function handleLogout() {
        show({
            type: 'warning',
            title: 'Cerrar sesión',
            message: '¿Estás seguro de que quieres salir?',
            actions: [
                { label: 'Cancelar', style: 'cancel' },
                { label: 'Salir', style: 'destructive', onPress: () => supabase.auth.signOut() },
            ],
        });
    }

    function toggleModo() {
        const nuevo: Modo = modoActivo === 'asesor' ? 'comprador' : 'asesor';
        setModoActivo(nuevo);
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-mogao-cream">
                <ActivityIndicator size="large" color="#0E3B36" />
            </View>
        );
    }

    const iniciales =
        [usuario?.nombre, usuario?.email?.charAt(0).toUpperCase()]
            .filter(Boolean)[0]
            ?.charAt(0)
            .toUpperCase() ?? '?';

    const opcionesPerfil = [
        {
            icon: 'person-outline',
            label: 'Editar perfil',
            onPress: () => router.push('/(modals)/editar-perfil' as any),
        },
        {
            icon: 'shield-checkmark-outline',
            label: 'Verificación de identidad (KYC)',
            onPress: () => {},
            disabled: true,
        },
        {
            icon: 'lock-closed-outline',
            label: 'Cambiar contraseña',
            onPress: () => router.push('/(modals)/cambiar-password' as any),
        },
        ...(usuario?.rol === 'agente'
            ? [
                  {
                      icon: 'navigate-outline',
                      label: 'Radio de servicio',
                      onPress: () => router.push('/(modals)/radio-servicio' as any),
                  },
              ]
            : []),
    ];

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
                    <View className="w-20 h-20 rounded-full items-center justify-center mb-3 bg-mogao-teal">
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

                {/* Toggle modo asesor / comprador */}
                {tieneAmbosRoles && (
                    <View
                        className="bg-white rounded-2xl p-4 mb-4 flex-row items-center justify-between"
                        style={{
                            shadowColor: '#0E3B36',
                            shadowOpacity: 0.06,
                            shadowRadius: 12,
                            elevation: 2,
                        }}
                    >
                        <View className="flex-row items-center gap-3">
                            <View className="w-9 h-9 rounded-full bg-mogao-cream items-center justify-center">
                                <Ionicons
                                    name={modoActivo === 'asesor' ? 'briefcase-outline' : 'home-outline'}
                                    size={18}
                                    color="#0E3B36"
                                />
                            </View>
                            <View>
                                <Text className="text-sm font-semibold text-gray-900">
                                    Modo {modoActivo === 'asesor' ? 'Asesor' : 'Comprador'}
                                </Text>
                                <Text className="text-xs text-gray-500">
                                    Toca para cambiar de vista
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={modoActivo === 'asesor'}
                            onValueChange={toggleModo}
                            trackColor={{ false: '#D1D5DB', true: '#155A52' }}
                            thumbColor={modoActivo === 'asesor' ? '#C9A227' : '#F3F4F6'}
                        />
                    </View>
                )}

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
                    style={{
                        shadowColor: '#0E3B36',
                        shadowOpacity: 0.06,
                        shadowRadius: 12,
                        elevation: 2,
                    }}
                >
                    {opcionesPerfil.map((item, i, arr) => (
                        <TouchableOpacity
                            key={item.label}
                            className={`flex-row items-center gap-3 px-5 py-4 ${
                                i < arr.length - 1 ? 'border-b border-gray-50' : ''
                            } ${(item as any).disabled ? 'opacity-40' : ''}`}
                            onPress={item.onPress}
                            disabled={(item as any).disabled}
                            activeOpacity={0.7}
                        >
                            <Ionicons name={item.icon as any} size={20} color="#0E3B36" />
                            <Text className="flex-1 text-sm font-medium text-gray-800">{item.label}</Text>
                            {(item as any).disabled ? (
                                <Text className="text-xs text-gray-400">Próximamente</Text>
                            ) : (
                                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                            )}
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
            <AppAlert {...alertProps} />
        </SafeAreaView>
    );
}
