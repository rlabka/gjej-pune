import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info as InfoIcon,
} from 'lucide-react-native';

export type DialogVariant = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export type DialogProps = {
  visible: boolean;
  variant?: DialogVariant;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
};

const VARIANTS: Record<
  DialogVariant,
  { icon: any; tint: string; iconColor: string; bg: string }
> = {
  success: {
    icon: CheckCircle2,
    tint: '#059669',
    iconColor: '#FFFFFF',
    bg: '#10B981',
  },
  error: {
    icon: AlertCircle,
    tint: '#DC2626',
    iconColor: '#FFFFFF',
    bg: '#EF4444',
  },
  warning: {
    icon: AlertTriangle,
    tint: '#D97706',
    iconColor: '#FFFFFF',
    bg: '#F59E0B',
  },
  info: {
    icon: InfoIcon,
    tint: '#2563EB',
    iconColor: '#FFFFFF',
    bg: '#3B82F6',
  },
  confirm: {
    icon: HelpCircle,
    tint: '#162C66',
    iconColor: '#FFFFFF',
    bg: '#162C66',
  },
};

export function Dialog({
  visible,
  variant = 'info',
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
  onDismiss,
}: DialogProps) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      fade.setValue(0);
      scale.setValue(0.92);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fade, scale]);

  const v = VARIANTS[variant];
  const Icon = v.icon;
  const showCancel = variant === 'confirm' || !!cancelLabel;
  const finalConfirmLabel = confirmLabel ?? 'OK';
  const finalCancelLabel = cancelLabel ?? 'Abbrechen';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        onCancel?.();
        onDismiss?.();
      }}
      statusBarTranslucent
    >
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(11, 31, 68, 0.55)',
          justifyContent: 'center',
          paddingHorizontal: 24,
          opacity: fade,
        }}
      >
        <Pressable
          style={{ position: 'absolute', inset: 0 } as any}
          onPress={() => {
            if (variant !== 'confirm') {
              onCancel?.();
              onDismiss?.();
            }
          }}
        />
        <Animated.View
          style={{
            transform: [{ scale }],
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: '#0B1F44',
            shadowOffset: { width: 0, height: 18 },
            shadowOpacity: 0.25,
            shadowRadius: 32,
            elevation: 18,
          }}
        >
          {/* Icon row with subtle accent strip */}
          <View
            style={{
              alignItems: 'center',
              paddingTop: 28,
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: v.bg,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: v.bg,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              <Icon color={v.iconColor} size={32} strokeWidth={2.5} />
            </View>
          </View>

          {/* Title + Message */}
          <View style={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 4 }}>
            <Text
              className="text-center text-[18px] font-extrabold text-[#0B1F44]"
              style={{ lineHeight: 24 }}
            >
              {title}
            </Text>
            {message ? (
              <Text
                className="mt-2 text-center text-[14px] font-medium text-slate-500"
                style={{ lineHeight: 20 }}
              >
                {message}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View
            style={{
              flexDirection: showCancel ? 'row' : 'column',
              padding: 20,
              gap: 10,
            }}
          >
            {showCancel ? (
              <Pressable
                onPress={() => {
                  onCancel?.();
                  onDismiss?.();
                }}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                android_ripple={{ color: '#E2E8F0' }}
              >
                {({ pressed }: any) => (
                  <Text
                    className="text-[15px] font-bold text-slate-600"
                    style={{ opacity: pressed ? 0.7 : 1 }}
                  >
                    {finalCancelLabel}
                  </Text>
                )}
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                onConfirm?.();
                onDismiss?.();
              }}
              style={{
                flex: showCancel ? 1 : undefined,
                height: 48,
                borderRadius: 14,
                backgroundColor: destructive ? '#DC2626' : v.tint,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: destructive ? '#DC2626' : v.tint,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            >
              {({ pressed }: any) => (
                <Text
                  className="text-[15px] font-bold text-white"
                  style={{ opacity: pressed ? 0.85 : 1 }}
                >
                  {finalConfirmLabel}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
