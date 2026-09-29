const GOOGLE_MAPS_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    'AIzaSyCAiETrkgZ1PDe-0rk_8ErvRaX24c-UEaE';

// Extiende app.json con configuración dinámica (plugins nativos).
module.exports = ({ config }) => ({
    ...config,
    plugins: [
        ...(config.plugins ?? []),
        [
            'react-native-maps',
            {
                googleMapsApiKey: GOOGLE_MAPS_API_KEY,
            },
        ],
    ],
    ios: {
        ...config.ios,
        config: {
            googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        },
    },
});
