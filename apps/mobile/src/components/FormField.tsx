import { Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label: string;
};

export function FormField({ label, ...rest }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        className="rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground"
        {...rest}
      />
    </View>
  );
}
