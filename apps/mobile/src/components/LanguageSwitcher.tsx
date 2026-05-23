import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Check, Globe } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import type { Locale } from '@/i18n';

const LOCALE_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
];

type Variant = 'light' | 'dark';

/**
 * Compact language switcher for the in-page header.
 * Tap → bottom sheet with all 5 supported languages. Visible on every page
 * so the user can re-translate the app at any time without diving into
 * Settings. The Settings entry stays for users who expect it there.
 */
export function LanguageSwitcher({ variant = 'dark' }: { variant?: Variant }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  const current = LOCALE_OPTIONS.find((l) => l.code === locale);
  const isDark = variant === 'dark';
  const triggerBg = isDark ? 'bg-white/[0.12]' : 'bg-slate-100';
  const triggerText = isDark ? 'text-white' : 'text-[#0B1F44]';

  async function pick(code: Locale) {
    setOpen(false);
    if (code !== locale) await setLocale(code);
  }

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Change language"
        className={`flex-row items-center rounded-full px-2.5 py-1.5 ${triggerBg}`}
        style={{ gap: 5 }}
        hitSlop={8}
      >
        <Globe size={14} color={isDark ? '#FFFFFF' : '#162C66'} />
        <Text className={`text-[12px] font-bold uppercase ${triggerText}`}>
          {current?.flag} {locale.toUpperCase()}
        </Text>
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 items-center justify-end bg-black/40"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl bg-white px-5 pb-8 pt-5"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <View className="mx-auto mb-4 h-1 w-12 rounded-full bg-slate-300" />
            <Text className="mb-1 text-center text-[18px] font-extrabold text-[#0B1F44]">
              Language
            </Text>
            <Text className="mb-5 text-center text-[12px] text-slate-500">
              Choose your preferred language
            </Text>

            <View style={{ gap: 8 }}>
              {LOCALE_OPTIONS.map((opt) => {
                const active = opt.code === locale;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => pick(opt.code)}
                    className={`flex-row items-center justify-between rounded-2xl border px-4 py-3.5 ${
                      active
                        ? 'border-[#162C66] bg-[#162C66]/5'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View className="flex-row items-center" style={{ gap: 12 }}>
                      <Text className="text-[22px]">{opt.flag}</Text>
                      <View>
                        <Text className="text-[15px] font-bold text-[#0B1F44]">
                          {opt.label}
                        </Text>
                        <Text className="text-[11px] uppercase tracking-wider text-slate-400">
                          {opt.code}
                        </Text>
                      </View>
                    </View>
                    {active && <Check size={20} color="#162C66" />}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
