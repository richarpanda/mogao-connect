import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { AuthProvider, useAuth } from '../lib/context/auth-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ajusta esta duración para que coincida con la longitud de tu GIF (en ms)
const GIF_DURATION_MS = 2500;

function AnimatedSplash({ onDone }: { onDone: () => void }) {
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
            />
        </Animated.View>
    );
}

function RootNavigator() {
    const { session, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && inAuthGroup) {
            router.replace('/(tabs)');
        }
    // segments intencionalmente fuera del dep array — solo reaccionar a cambios de sesión
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, loading]);

    return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
    const [splashDone, setSplashDone] = useState(false);

    return (
        <AuthProvider>
            <RootNavigator />
            {!splashDone && (
                <AnimatedSplash onDone={() => setSplashDone(true)} />
            )}
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    splash: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0E3B36',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
    },
    gif: {
        width: SCREEN_WIDTH * 0.65,
        height: SCREEN_WIDTH * 0.65,
    },
});
