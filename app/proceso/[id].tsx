import { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { EstatusProceso, ProcesoConDetalle, ProcesoDocumento } from '../../lib/types/database';
import { formatFecha, formatPrecio } from '../../lib/utils/format';

type StepInfo = {
    key: EstatusProceso;
    label: string;
    descripcion: string;
};

const STEPS: StepInfo[] = [
    { key: 'interesado',     label: 'Interesado',      descripcion: 'Tu solicitud fue recibida.' },
    { key: 'apartado',       label: 'Apartado',         descripcion: 'La propiedad ha sido reservada para ti.' },
    { key: 'en_tramite',     label: 'En trámite',       descripcion: 'Se están gestionando los documentos.' },
    { key: 'documentacion',  label: 'Documentación',    descripcion: 'Revisión de expediente y documentos.' },
    { key: 'firma',          label: 'Firma',            descripcion: 'Firma de contrato de promesa de compraventa.' },
    { key: 'cerrado',        label: 'Cerrado',          descripcion: 'Operación cerrada, en espera de trámites finales.' },
    { key: 'firma_cv',       label: 'Firma CV',         descripcion: 'Firma del contrato de compraventa definitivo.' },
    { key: 'integracion',    label: 'Integración',      descripcion: 'Integración del expediente notarial.' },
    { key: 'firma_notaria',  label: 'Firma notaría',    descripcion: 'Firma ante notario público.' },
    { key: 'entregado',      label: 'Entregado',        descripcion: '¡Felicidades! La propiedad ha sido entregada.' },
];

export default function ProcesoDetalle() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [proceso, setProceso] = useState<ProcesoConDetalle | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProceso() {
            try {
                const { data, error } = await supabase
                    .from('procesos_compra')
                    .select(
                        '*, propiedades(id, titulo, direccion, ciudad), proceso_historial(*), proceso_documentos(*)',
                    )
                    .eq('id', id)
                    .single();
                if (error) throw error;
                const p = {
                    ...data,
                    proceso_historial: [...data.proceso_historial].sort(
                        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                    ),
                    proceso_documentos: [...(data.proceso_documentos ?? [])].sort(
                        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                    ),
                } as ProcesoConDetalle;
                setProceso(p);
            } catch (err: any) {
                console.error('[ProcesoDetalle]', err);
                Alert.alert('Error', 'No se pudo cargar el proceso.');
                router.back();
            } finally {
                setLoading(false);
            }
        }
        if (id) fetchProceso();
    }, [id]);

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-mogao-cream">
                <ActivityIndicator size="large" color="#0E3B36" />
            </View>
        );
    }

    if (!proceso) return null;

    const currentStepIndex = STEPS.findIndex((s) => s.key === proceso.estatus);

    return (
        <SafeAreaView className="flex-1 bg-mogao-cream" edges={['top', 'bottom']}>
            {/* Encabezado */}
            <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                        {proceso.propiedades?.titulo ?? 'Proceso de compra'}
                    </Text>
                    {proceso.propiedades?.ciudad && (
                        <Text className="text-sm text-gray-500">{proceso.propiedades.ciudad}</Text>
                    )}
                </View>
            </View>

            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: 48 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Resumen */}
                <View className="mx-5 mt-5 bg-mogao-cream rounded-2xl p-4 mb-6">
                    {proceso.precio_acordado != null && (
                        <Text className="text-xl font-bold text-mogao-gold mb-1">
                            {formatPrecio(proceso.precio_acordado)}
                        </Text>
                    )}
                    <Text className="text-xs text-gray-500">
                        Inicio: {formatFecha(proceso.fecha_inicio)}
                    </Text>
                    {proceso.fecha_cierre && (
                        <Text className="text-xs text-gray-500">
                            Cierre: {formatFecha(proceso.fecha_cierre)}
                        </Text>
                    )}
                </View>

                {/* Stepper — 10 pasos */}
                <Text className="px-5 text-base font-semibold text-gray-900 mb-4">
                    Seguimiento del proceso
                </Text>

                <View className="px-5">
                    {STEPS.map((step, index) => {
                        const isDone = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isPending = index > currentStepIndex;

                        return (
                            <View key={step.key} className="flex-row">
                                {/* Línea vertical + círculo */}
                                <View className="items-center mr-4" style={{ width: 28 }}>
                                    <View
                                        className={`w-7 h-7 rounded-full items-center justify-center ${
                                            isDone
                                                ? 'bg-green-500'
                                                : isCurrent
                                                ? 'bg-mogao-gold'
                                                : 'bg-gray-200'
                                        }`}
                                    >
                                        {isDone ? (
                                            <Ionicons name="checkmark" size={16} color="white" />
                                        ) : (
                                            <Text
                                                className={`text-xs font-bold ${
                                                    isCurrent ? 'text-white' : 'text-gray-400'
                                                }`}
                                            >
                                                {index + 1}
                                            </Text>
                                        )}
                                    </View>
                                    {index < STEPS.length - 1 && (
                                        <View
                                            className={`w-0.5 flex-1 my-1 ${
                                                isDone ? 'bg-green-300' : 'bg-gray-200'
                                            }`}
                                            style={{ minHeight: 24 }}
                                        />
                                    )}
                                </View>

                                {/* Texto del paso */}
                                <View className="flex-1 pb-5">
                                    <Text
                                        className={`text-sm font-semibold mb-0.5 ${
                                            isDone
                                                ? 'text-green-600'
                                                : isCurrent
                                                ? 'text-mogao-goldDark'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {step.label}
                                    </Text>
                                    {(isDone || isCurrent) && (
                                        <Text className="text-xs text-gray-500">
                                            {step.descripcion}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Documentos compartidos por el asesor */}
                {proceso.proceso_documentos.length > 0 && (
                    <View className="px-5 mt-4">
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                            Documentos
                        </Text>
                        {proceso.proceso_documentos.map((doc: ProcesoDocumento) => (
                            <View
                                key={doc.id}
                                className="flex-row items-center gap-3 bg-white rounded-xl px-4 py-3 mb-2"
                                style={{ borderWidth: 1, borderColor: '#F3F4F6' }}
                            >
                                <Ionicons name="document-text-outline" size={20} color="#0E3B36" />
                                <View className="flex-1">
                                    <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                                        {doc.nombre_archivo}
                                    </Text>
                                    <Text className="text-xs text-gray-400 mt-0.5 capitalize">
                                        {doc.tipo.replace(/_/g, ' ')}
                                    </Text>
                                </View>
                                <Ionicons name="download-outline" size={18} color="#9CA3AF" />
                            </View>
                        ))}
                    </View>
                )}

                {/* Historial de cambios */}
                {proceso.proceso_historial.length > 0 && (
                    <View className="px-5 mt-4">
                        <Text className="text-base font-semibold text-gray-900 mb-3">
                            Historial
                        </Text>
                        {proceso.proceso_historial.map((h) => (
                            <View
                                key={h.id}
                                className="flex-row gap-3 mb-3"
                            >
                                <View className="w-1.5 rounded-full bg-gray-200 mt-1" />
                                <View className="flex-1">
                                    <Text className="text-sm text-gray-700">
                                        {h.estatus_anterior
                                            ? `${h.estatus_anterior} → ${h.estatus_nuevo}`
                                            : h.estatus_nuevo}
                                    </Text>
                                    {h.comentario && (
                                        <Text className="text-xs text-gray-500 mt-0.5">
                                            {h.comentario}
                                        </Text>
                                    )}
                                    <Text className="text-xs text-gray-400 mt-0.5">
                                        {formatFecha(h.created_at)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
