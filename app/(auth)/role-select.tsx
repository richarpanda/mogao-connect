import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

type Rol = 'cliente' | 'vendedor' | 'agente';

type RolOption = {
    id: Rol;
    titulo: string;
    descripcion: string;
    emoji: string;
};

const ROL_OPTIONS: RolOption[] = [
    {
        id: 'cliente',
        titulo: 'Comprador',
        descripcion: 'Busca propiedades y solicita visitas con asesores de la red.',
        emoji: '🏠',
    },
    {
        id: 'vendedor',
        titulo: 'Vendedor / Propietario',
        descripcion: 'Publica tu propiedad para que los asesores de Mogao la promuevan.',
        emoji: '🔑',
    },
    {
        id: 'agente',
        titulo: 'Asesor independiente',
        descripcion: 'Atiende solicitudes de compra y acompaña a compradores en el proceso.',
        emoji: '🤝',
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
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('Sin sesión activa');

            // Actualizar rol en usuarios (la fila ya existe — la crea el trigger on_auth_user_created)
            const { error: rolErr } = await supabase
                .from('usuarios')
                .update({ rol: selected })
                .eq('id', user.id);
            if (rolErr) throw rolErr;

            // Crear fila de rol específico según la selección
            if (selected === 'agente') {
                const { error: agenteErr } = await supabase.from('agentes').insert({
                    usuario_id: user.id,
                    // estatus_autorizacion = 'pendiente', origen = 'app' (defaults del esquema)
                });
                if (agenteErr) throw agenteErr;
            }

            if (selected === 'vendedor') {
                // Requiere migración fase-1-schema.sql: tabla vendedores_cuenta + enum 'vendedor'
                const { error: vendErr } = await supabase.from('vendedores_cuenta').insert({
                    usuario_id: user.id,
                    // estatus_autorizacion = 'pendiente', origen = 'app' (defaults)
                });
                if (vendErr) throw vendErr;
            }

            router.replace('/(tabs)');
        } catch (err: any) {
            console.error('[role-select]', err);
            Alert.alert('Error', err.message ?? 'No se pudo guardar tu rol. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingHorizontal: 24,
                    paddingTop: 60,
                    paddingBottom: 32,
                }}
            >
                <Text className="text-3xl font-bold text-gray-900 mb-2">¿Cómo usarás Mogao?</Text>
                <Text className="text-base text-gray-500 mb-10">
                    Puedes agregar roles adicionales más adelante desde tu perfil.
                </Text>

                <View className="gap-4 mb-10">
                    {ROL_OPTIONS.map((option) => {
                        const isSelected = selected === option.id;
                        return (
                            <TouchableOpacity
                                key={option.id}
                                onPress={() => setSelected(option.id)}
                                className={`rounded-2xl border-2 p-5 ${
                                    isSelected
                                        ? 'border-mogao-gold bg-mogao-cream'
                                        : 'border-gray-200 bg-white'
                                }`}
                            >
                                <Text className="text-3xl mb-2">{option.emoji}</Text>
                                <Text
                                    className={`text-lg font-bold mb-1 ${
                                        isSelected ? 'text-mogao-teal' : 'text-gray-900'
                                    }`}
                                >
                                    {option.titulo}
                                </Text>
                                <Text className="text-sm text-gray-500">{option.descripcion}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <TouchableOpacity
                    className={`rounded-xl py-4 items-center ${
                        !selected || loading ? 'bg-mogao-tealLight' : 'bg-mogao-teal'
                    }`}
                    onPress={handleConfirm}
                    disabled={!selected || loading}
                >
                    <Text className="text-white font-semibold text-base">
                        {loading ? 'Guardando...' : 'Continuar'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
