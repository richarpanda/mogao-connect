import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/context/auth-context';

export default function TabsLayout() {
    const { modoActivo } = useAuth();
    const esAsesor = modoActivo === 'asesor';

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#0E3B36',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarStyle: { borderTopColor: '#EDE9DC', backgroundColor: '#FFFFFF' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Catálogo',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="solicitudes"
                options={{
                    title: esAsesor ? 'Solicitudes' : 'Mis procesos',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name={esAsesor ? 'calendar-outline' : 'document-text-outline'}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="perfil"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
