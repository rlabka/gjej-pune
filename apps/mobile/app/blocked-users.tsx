import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldOff, User as UserIcon } from 'lucide-react-native';
import { useDialog } from '@/contexts/DialogContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { resolveMediaUrl } from '@/lib/useApi';
import { config } from '@/lib/config';

interface BlockedRow {
  id: string;
  blockedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    image: string | null;
    role: string;
  };
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<BlockedRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = (await getToken()) ?? undefined;
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ ok: boolean; blocked: BlockedRow[] }>(
        '/api/users/blocked',
        token
      );
      if (res?.ok) setRows(res.blocked ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function unblock(userId: string) {
    if (busy) return;
    setBusy(userId);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.delete<{ ok: boolean }>(
        `/api/users/${userId}/block`,
        token
      );
      if (res?.ok) {
        dialog.showSuccess(t('Mobile.moderation.unblockSuccess'));
        setRows((prev) => prev.filter((r) => r.user.id !== userId));
      } else {
        dialog.showError();
      }
    } catch {
      dialog.showError();
    } finally {
      setBusy(null);
    }
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center border-b border-slate-200/60 px-4 py-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-50"
          >
            <ArrowLeft color="#0B1F44" size={20} />
          </Pressable>
          <Text className="ml-2 flex-1 text-[16px] font-extrabold text-[#0B1F44]">
            {t('Mobile.moderation.blockedUsers')}
          </Text>
        </View>
      </SafeAreaView>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#94A3B8" />
        </View>
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <ShieldOff color="#94A3B8" size={28} />
          </View>
          <Text className="text-center text-[14px] font-medium text-slate-500">
            {t('Mobile.moderation.blockedUsersEmpty')}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => {
            const photo = resolveMediaUrl(config.apiUrl, item.user.image);
            const name = item.user.displayName || item.user.email;
            const isBusy = busy === item.user.id;
            return (
              <View
                className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white p-3"
                style={{
                  shadowColor: '#0B1F44',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 1,
                }}
              >
                {photo ? (
                  <Image
                    source={{ uri: photo }}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                ) : (
                  <View className="h-11 w-11 items-center justify-center rounded-full bg-[#162C66]">
                    <UserIcon color="#FFFFFF" size={18} />
                  </View>
                )}
                <Text
                  className="mx-3 flex-1 text-[14px] font-bold text-[#0B1F44]"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Pressable
                  onPress={() => unblock(item.user.id)}
                  disabled={isBusy}
                  className="rounded-xl border border-slate-200 px-3 py-2 active:bg-slate-50 disabled:opacity-50"
                >
                  {isBusy ? (
                    <ActivityIndicator color="#162C66" size="small" />
                  ) : (
                    <Text className="text-[12px] font-bold text-[#162C66]">
                      {t('Mobile.moderation.unblock')}
                    </Text>
                  )}
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
