import { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const LOGO = require('../../assets/logo-mogao-connect.png');

type Rol = 'cliente' | 'vendedor' | 'agente';

type RolOption = {
    id: Rol;
    titulo: string;
    descripcion: string;
    icon: string;
};

const ROL_OPTIONS: RolOption[] = [
    {
        id: 'cliente',
        titulo: 'Comprador',
        descripcion: 'Busca propiedades y solicita visitas con asesores de la red.',
        icon: 'home-outline',
    },
    {
        id: 'vendedor',
        titulo: 'Vendedor / Propietario',
        descripcion: 'Publica tu propiedad para que los asesores de Mogao la promuevan.',
        icon: 'key-outline',
    },
    {
        id: 'agente',
        titulo: 'Asesor independiente',
        descripcion: 'Atiende solicitudes de compra y acompaña a compradores en el proceso.',
        icon: 'briefcase-outline',
    },
];

export default function RoleSelect() {
    const router = useRouter();
    const [selected, setSelected] = useState<Rol | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleConfirm() {
        if (!selected) {
            Alert.alert('Selecciona un rol', 'Elige cómo quieres usar Mogao.');
            return;
        }
        setLoading(true);
        try {
            const { error: rolErr } = await supabase.rpc('set_initial_rol', { p_rol: selected });
            if (rolErr) throw rolErr;

            await AsyncStorage.removeItem('needsRoleSelect');
            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('[role-select]', err);
            Alert.alert('Error', err.message ?? 'No se pudo guardar tu rol. Inténtalo de nuevo.');
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
                        source={LOGO}
                        style={{ height: 44 }}
                        resizeMode="contain"
                    />
                    <View
                        style={{ height: 1, width: 40, backgroundColor: 'rgba(201,162,39,0.6)', marginTop: 18, marginBottom: 12 }}
                    />
                    <Text
                        style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' }}
                    >
                        Únete a la red Mogao
                    </Text>
                </View>

                <ScrollView
                    className="flex-1 bg-mogao-cream rounded-t-3xl"
                    contentContainerStyle={{ padding: 28, paddingBottom: 48 }}
                    showsVerticalScrollIndicator={false}
                >
                    <Text
                        style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '600', color: '#8A6C1B', marginBottom: 4, marginTop: 4 }}
                    >
                        Tipo de cuenta
                    </Text>
                    <Text className="text-3xl font-bold text-mogao-teal mb-1">
                        ¿Cómo usarás Mogao?
                    </Text>
                    <Text className="text-sm text-gray-500 mb-7">
                        Puedes agregar roles adicionales más adelante desde tu perfil.
                    </Text>

                    <View className="gap-3 mb-8">
                        {ROL_OPTIONS.map((option) => {
                            const isSelected = selected === option.id;
                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    onPress={() => setSelected(option.id)}
                                    activeOpacity={0.8}
                                    className={`rounded-2xl p-5 flex-row items-center gap-4 ${
                                        isSelected
                                            ? 'bg-mogao-teal'
                                            : 'bg-white border border-gray-100'
                                    }`}
                                    style={
                                        isSelected
                                            ? {}
                                            : {
                                                shadowColor: '#0E3B36',
                                                shadowOpacity: 0.05,
                                                shadowRadius: 8,
                                                elevation: 2,
                                              }
                                    }
                                >
                                    <View
                                        className={`w-12 h-12 rounded-xl items-center justify-center ${
                                            isSelected ? 'bg-white/20' : 'bg-mogao-cream'
                                        }`}
                                    >
                                        <Ionicons
                                            name={option.icon as any}
                                            size={22}
                                            color={isSelected ? '#C9A227' : '#0E3B36'}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text
                                            className={`text-base font-bold mb-0.5 ${
                                                isSelected ? 'text-white' : 'text-gray-900'
                                            }`}
                                        >
                                            {option.titulo}
                                        </Text>
                                        <Text
                                            className={`text-xs leading-4 ${
                                                isSelected ? 'text-white/70' : 'text-gray-500'
                                            }`}
                                        >
                                            {option.descripcion}
                                        </Text>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={22} color="#C9A227" />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        className={`flex-row items-center justify-center gap-2 rounded-xl py-3.5 ${
                            !selected || loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                        }`}
                        onPress={handleConfirm}
                        disabled={!selected || loading}
                        activeOpacity={0.85}
                    >
                        <Text className="text-white font-semibold text-sm">
                            {loading ? 'Guardando...' : 'Continuar'}
                        </Text>
                        {!loading && selected && (
                            <Ionicons name="arrow-forward" size={15} color="white" />
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
