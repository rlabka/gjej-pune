import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import type { AuthRole } from '@/lib/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const ROLES: { value: AuthRole; label: string }[] = [
    { value: 'job-seeker', label: t('Mobile.auth.jobSeeker') },
    { value: 'employer', label: t('Mobile.auth.employer') },
  ];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AuthRole>('job-seeker');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    const result = await register(email, password, role, displayName || undefined);
    setSubmitting(false);
    if (result.ok) {
      router.replace('/(tabs)');
    } else {
      setError(result.error ?? 'registrationFailed');
    }
  }

  const errorMessage = error ? t(`Mobile.auth.${error}`) : null;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          className="px-6"
        >
          <Text className="mb-6 text-2xl font-bold text-secondary">
            {t('Mobile.auth.registerTitle')}
          </Text>

          <View className="mb-4 flex-row gap-2">
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                className={`flex-1 rounded-xl border px-4 py-3 ${
                  role === r.value
                    ? 'border-secondary bg-secondary'
                    : 'border-border bg-white'
                }`}
              >
                <Text
                  className={`text-center text-sm font-semibold ${
                    role === r.value ? 'text-white' : 'text-foreground'
                  }`}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-semibold text-foreground">
              {t('Mobile.auth.displayName')}
            </Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Max Mustermann"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-semibold text-foreground">
              {t('Mobile.auth.email')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-1 text-sm font-semibold text-foreground">
              {t('Mobile.auth.password')}
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
            />
          </View>

          {errorMessage && <Text className="mb-4 text-sm text-danger">{errorMessage}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={submitting || !email || !password}
            className="mt-2 rounded-xl bg-secondary py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                {t('Mobile.auth.signUp')}
              </Text>
            )}
          </Pressable>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-muted">{t('Mobile.auth.hasAccount')} </Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-secondary">
              {t('Mobile.auth.signIn')}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
