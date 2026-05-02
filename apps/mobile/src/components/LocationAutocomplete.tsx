import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import {
  useLocationAutocomplete,
  type LocationSuggestion,
} from '@/lib/useLocationAutocomplete';
import { useI18n } from '@/contexts/I18nContext';

type Variant = 'dark' | 'light';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  variant?: Variant;
  textInputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>;
};

export function LocationAutocomplete({
  value,
  onChangeText,
  onSelect,
  placeholder,
  variant = 'light',
  textInputProps,
}: Props) {
  const { locale } = useI18n();
  const { setQuery, suggestions, loading, clear } =
    useLocationAutocomplete(locale);
  const [dismissed, setDismissed] = useState(false);

  // Keep hook's query in sync with externally controlled value
  useEffect(() => {
    setQuery(value);
  }, [value, setQuery]);

  const isDark = variant === 'dark';
  const inputTextColor = isDark ? '#FFFFFF' : '#0B1F44';
  const placeholderColor = isDark ? 'rgba(255,255,255,0.45)' : '#94A3B8';
  const wrapperClass = isDark
    ? 'flex-row items-center rounded-xl bg-white/[0.08] px-3'
    : 'flex-row items-center rounded-xl bg-slate-100 px-3';

  const showDropdown =
    !dismissed && suggestions.length > 0 && value.trim().length >= 2;

  function handleSelect(s: LocationSuggestion) {
    clear();
    setDismissed(true);
    Keyboard.dismiss();
    if (onSelect) {
      onSelect(s);
    } else {
      onChangeText(s.label);
    }
  }

  return (
    <View>
      <View className={wrapperClass}>
        <MapPin color="#F5C400" size={16} />
        <TextInput
          value={value}
          onChangeText={(v) => {
            setDismissed(false);
            onChangeText(v);
            setQuery(v);
          }}
          onFocus={() => setDismissed(false)}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          className="ml-2 flex-1 py-3.5 text-[14px]"
          style={{ color: inputTextColor }}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          {...textInputProps}
        />
        {loading ? (
          <ActivityIndicator color={isDark ? '#F5C400' : '#94A3B8'} size="small" />
        ) : null}
      </View>

      {showDropdown ? (
        <View
          className="mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {suggestions.map((s, i) => (
            <Pressable
              key={s.label + i}
              onPress={() => handleSelect(s)}
              className={`flex-row items-center px-3 py-2.5 ${
                i < suggestions.length - 1
                  ? 'border-b border-slate-100'
                  : ''
              } active:bg-slate-50`}
            >
              <MapPin color="#94A3B8" size={14} />
              <View className="ml-2 flex-1 flex-row items-center">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text
                      className="text-[13px] font-semibold text-[#0B1F44]"
                      numberOfLines={1}
                    >
                      {s.city}
                    </Text>
                    {s.state || s.country ? (
                      <Text
                        className="ml-1 flex-shrink text-[13px] text-slate-400"
                        numberOfLines={1}
                      >
                        — {[s.state, s.country].filter(Boolean).join(', ')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              {s.countryCode ? (
                <Image
                  source={{
                    uri: `https://flagcdn.com/40x30/${s.countryCode.toLowerCase()}.png`,
                  }}
                  style={{
                    width: 20,
                    height: 15,
                    borderRadius: 2,
                    marginLeft: 8,
                  }}
                  resizeMode="cover"
                />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
