import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export type AlertAction = {
    label: string;
    onPress?: () => void;
    style?: 'primary' | 'cancel' | 'destructive';
};

export type AlertOptions = {
    type?: AlertType;
    title: string;
    message?: string;
    actions?: AlertAction[];
};

const TYPE_CFG: Record<AlertType, { icon: string; iconColor: string; bg: string }> = {
    success: { icon: 'checkmark-circle', iconColor: '#16a34a', bg: '#dcfce7' },
    error:   { icon: 'close-circle',     iconColor: '#dc2626', bg: '#fee2e2' },
    warning: { icon: 'warning',           iconColor: '#d97706', bg: '#fef3c7' },
    info:    { icon: 'information-circle',iconColor: '#0E3B36', bg: '#d1fae5' },
};

export function useAppAlert() {
    const [visible, setVisible] = useState(false);
    const [opts, setOpts] = useState<AlertOptions>({ title: '' });

    function show(options: AlertOptions) {
        setOpts(options);
        setVisible(true);
    }

    return {
        show,
        alertProps: {
            visible,
            opts,
            onClose: () => setVisible(false),
        },
    };
}

type Props = {
    visible: boolean;
    opts: AlertOptions;
    onClose: () => void;
};

export function AppAlert({ visible, opts, onClose }: Props) {
    const type = opts.type ?? 'info';
    const cfg = TYPE_CFG[type];
    const actions = opts.actions ?? [{ label: 'Aceptar' }];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(7,31,28,0.55)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 24,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 320,
                        backgroundColor: '#fff',
                        borderRadius: 24,
                        overflow: 'hidden',
                        elevation: 24,
                        shadowColor: '#000',
                        shadowOpacity: 0.3,
                        shadowRadius: 24,
                        shadowOffset: { width: 0, height: 10 },
                    }}
                >
                    <View
                        style={{
                            backgroundColor: cfg.bg,
                            alignItems: 'center',
                            paddingTop: 32,
                            paddingBottom: 24,
                        }}
                    >
                        <View
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 36,
                                backgroundColor: cfg.iconColor + '22',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Ionicons name={cfg.icon as any} size={42} color={cfg.iconColor} />
                        </View>
                    </View>

                    <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: opts.message ? 4 : 0 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' }}>
                            {opts.title}
                        </Text>
                    </View>

                    {opts.message ? (
                        <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 0 }}>
                            <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>
                                {opts.message}
                            </Text>
                        </View>
                    ) : null}

                    <View style={{ padding: 20 }}>
                        {actions.map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                onPress={() => {
                                    onClose();
                                    action.onPress?.();
                                }}
                                activeOpacity={0.85}
                                style={{
                                    borderRadius: 12,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    marginTop: i > 0 ? 8 : 0,
                                    backgroundColor:
                                        action.style === 'cancel'      ? '#F3F4F6' :
                                        action.style === 'destructive'  ? '#ef4444' :
                                                                          '#0E3B36',
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: '600',
                                        color: action.style === 'cancel' ? '#374151' : '#fff',
                                    }}
                                >
                                    {action.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
