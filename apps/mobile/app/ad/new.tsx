import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { FormField } from '@/components/FormField';

export default function NewAdScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [age, setAge] = useState('');
  const [experience, setExperience] = useState('');
  const [livingPlace, setLivingPlace] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled) setPhoto(result.assets[0] ?? null);
  }

  async function onSubmit() {
    if (!firstName || !surname || !phone || !category) {
      Alert.alert(t('Mobile.common.error'));
      return;
    }
    setSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const payload = {
        firstName,
        surname,
        phone,
        category,
        age: age ? Number(age) : null,
        experience,
        livingPlace,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        spokenLanguages: languages.split(',').map((s) => s.trim()).filter(Boolean),
      };
      const res = await api.post<{ ok: boolean; ad: { id: string } }>(
        '/api/ads',
        payload,
        token
      );
      if (!res?.ok) throw new Error('create failed');

      // Upload photo if provided
      if (photo) {
        const form = new FormData();
        form.append('photo', {
          uri: photo.uri,
          name: photo.fileName ?? `photo-${Date.now()}.jpg`,
          type: photo.mimeType ?? 'image/jpeg',
        } as any);
        await api.upload(`/api/ads/${res.ad.id}/photo`, form, token);
      }

      router.back();
      router.push(`/ad/${res.ad.id}` as any);
    } catch {
      Alert.alert(t('Mobile.common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg" edges={['top']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="p-2">
          <ArrowLeft color="#162C66" size={22} />
        </Pressable>
        <Text className="ml-2 text-xl font-extrabold text-secondary">
          {t('Mobile.adForm.createTitle')}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Photo picker */}
          <Pressable
            onPress={pickImage}
            className="mb-5 items-center justify-center rounded-2xl border border-dashed border-border bg-white py-6"
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} className="h-28 w-28 rounded-full" />
            ) : (
              <View className="items-center">
                <Camera color="#162C66" size={28} />
                <Text className="mt-2 text-sm font-semibold text-secondary">
                  {t('Mobile.adForm.selectPhoto')}
                </Text>
              </View>
            )}
          </Pressable>

          <FormField label={t('Mobile.ad.firstName')} value={firstName} onChangeText={setFirstName} />
          <FormField label={t('Mobile.ad.surname')} value={surname} onChangeText={setSurname} />
          <FormField label={t('Mobile.job.category')} value={category} onChangeText={setCategory} />
          <FormField
            label={t('Mobile.ad.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <FormField
            label={t('Mobile.ad.age')}
            value={age}
            onChangeText={setAge}
            keyboardType="number-pad"
          />
          <FormField
            label={t('Mobile.ad.experience')}
            value={experience}
            onChangeText={setExperience}
            multiline
            numberOfLines={3}
          />
          <FormField
            label={t('Mobile.ad.livingPlace')}
            value={livingPlace}
            onChangeText={setLivingPlace}
          />
          <FormField
            label={`${t('Mobile.ad.skills')} (comma separated)`}
            value={skills}
            onChangeText={setSkills}
          />
          <FormField
            label={`${t('Mobile.ad.languages')} (comma separated)`}
            value={languages}
            onChangeText={setLanguages}
          />

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="mt-2 rounded-xl bg-secondary py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-center text-base font-bold text-white">
                {t('Mobile.adForm.submit')}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
