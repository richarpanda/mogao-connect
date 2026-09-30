import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/context/auth-context';

export default function TabsLayout() {
    const { modoActivo } = useAuth();
    const esAsesor = modoActivo === 'asesor';
    const esVendedor = modoActivo === 'vendedor';

    const tabCentralLabel = esAsesor ? 'Solicitudes' : esVendedor ? 'Propiedades' : 'Mis procesos';
    const tabCentralIcon = esAsesor ? 'calendar-outline' : esVendedor ? 'home-outline' : 'document-text-outline';

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
                        <Ionicons name="search-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="solicitudes"
                options={{
                    title: tabCentralLabel,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name={tabCentralIcon as any} size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="requerimientos"
                options={{
                    title: 'Requerimientos',
                    href: esAsesor ? undefined : null,
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="list-outline" size={size} color={color} />
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
