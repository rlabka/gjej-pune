import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { AdCard, type AdItem } from '@/components/AdCard';

export default function MyAdsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.get<{ ok: boolean; ads: AdItem[] }>(
        '/api/ads/mine',
        token
      );
      if (res?.ok) setAds(res.ads ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft color="#162C66" size={22} />
          </Pressable>
          <Text className="ml-2 text-xl font-extrabold text-secondary">
            {t('Mobile.profile.myAds')}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/ad/new' as any)}
          className="rounded-full bg-secondary p-2"
        >
          <Plus color="#FFFFFF" size={18} />
        </Pressable>
      </View>

      <FlatList
        className="px-6"
        data={ads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AdCard item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#162C66"
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View className="mt-16 items-center">
              <Text className="text-sm text-muted">{t('Mobile.common.empty')}</Text>
            </View>
          ) : (
            <View className="mt-10">
              <ActivityIndicator color="#162C66" />
            </View>
          )
        }
        contentContainerStyle={{ paddingBottom: 60 }}
      />
    </SafeAreaView>
  );
}
