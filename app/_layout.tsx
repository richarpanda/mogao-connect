import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { AuthProvider, useAuth } from '../lib/context/auth-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Ajusta este valor a la duración real de tu GIF (en milisegundos)
const GIF_DURATION_MS = 2500;

function SplashScreen({ onDone }: { onDone: () => void }) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(opacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(onDone);
        }, GIF_DURATION_MS);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Animated.View style={[styles.splash, { opacity }]}>
            <Image
                source={require('../assets/splash-animation.gif')}
                style={styles.gif}
                contentFit="contain"
                autoplay
            />
        </Animated.View>
    );
}

function RootNavigator() {
    const { session, loading, rolLoading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading || rolLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
            return;
        }

        if (session && inAuthGroup) {
            AsyncStorage.getItem('needsRoleSelect').then((flag) => {
                if (!flag) router.replace('/(tabs)');
                // Si flag existe, el usuario está en medio del registro → no redirigir
            });
        }
    // segments intencionalmente fuera del dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, loading, rolLoading]);

    // Solo bloqueamos el render completo mientras carga el auth inicial
    if (loading) {
        return <Animated.View style={{ flex: 1, backgroundColor: '#FAF7F0' }} />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    const [splashDone, setSplashDone] = useState(false);

    // El splash se muestra PRIMERO — el navegador no existe aún
    if (!splashDone) {
        return <SplashScreen onDone={() => setSplashDone(true)} />;
    }

    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        backgroundColor: '#0E3B36',
        alignItems: 'center',
        justifyContent: 'center',
    },
    gif: {
        width: SCREEN_WIDTH * 0.65,
        height: SCREEN_WIDTH * 0.65,
    },
});
