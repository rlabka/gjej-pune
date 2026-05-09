import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, X } from 'lucide-react-native';
import { useDialog } from '@/contexts/DialogContext';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';

export type ReportTargetType = 'user' | 'message' | 'job' | 'ad';

const REASONS = ['spam', 'harassment', 'inappropriate', 'fake', 'other'] as const;
type Reason = (typeof REASONS)[number];

const REASON_KEY: Record<Reason, string> = {
  spam: 'Mobile.moderation.reasonSpam',
  harassment: 'Mobile.moderation.reasonHarassment',
  inappropriate: 'Mobile.moderation.reasonInappropriate',
  fake: 'Mobile.moderation.reasonFake',
  other: 'Mobile.moderation.reasonOther',
};

interface Props {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  /**
   * Localized title shown at the top of the sheet — defaults to a generic
   * "Report" string. Pass a more specific label like "Report this listing"
   * for clarity.
   */
  title?: string;
  onClose: () => void;
}

/**
 * Bottom-sheet style modal that lets the user pick a reason and add
 * optional details, then submits a Report to the backend. Used across
 * chat / job / ad / profile-views screens — App Store Review
 * Guideline 1.2 (UGC moderation) compliance.
 */
export function ReportSheet({ visible, targetType, targetId, title, onClose }: Props) {
  const { t } = useI18n();
  const dialog = useDialog();
  const [reason, setReason] = useState<Reason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setReason(null);
    setDetails('');
    setSubmitting(false);
  }

  async function submit() {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const res = await api.post<{ ok: boolean; error?: string }>(
        '/api/reports',
        { targetType, targetId, reason, details: details.trim() || undefined },
        token
      );
      if (res?.ok) {
        dialog.showSuccess(t('Mobile.moderation.reportThanks'));
        reset();
        onClose();
      } else {
        dialog.showError(res?.error || t('Mobile.moderation.reportFailed'));
        setSubmitting(false);
      }
    } catch {
      dialog.showError(t('Mobile.moderation.reportFailed'));
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Pressable style={{ flex: 1 }} onPress={handleClose} />
        <SafeAreaView edges={['bottom']} className="bg-white">
          <View className="rounded-t-3xl bg-white px-5 pt-4 pb-2">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-extrabold text-[#0B1F44]">
                {title || t('Mobile.moderation.report')}
              </Text>
              <Pressable
                onPress={handleClose}
                className="h-9 w-9 items-center justify-center rounded-full active:bg-slate-100"
              >
                <X color="#64748B" size={18} />
              </Pressable>
            </View>

            <Text className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
              {t('Mobile.moderation.reportReasonTitle')}
            </Text>

            <ScrollView className="mb-2 max-h-[280px]">
              {REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
                      selected
                        ? 'border-[#162C66] bg-[#162C66]/5'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-bold ${
                        selected ? 'text-[#162C66]' : 'text-[#0B1F44]'
                      }`}
                    >
                      {t(REASON_KEY[r])}
                    </Text>
                    {selected && <Check color="#162C66" size={18} />}
                  </Pressable>
                );
              })}

              <Text className="mt-3 mb-1.5 text-[12px] font-semibold text-slate-500">
                {t('Mobile.moderation.detailsLabel')}
              </Text>
              <TextInput
                multiline
                value={details}
                onChangeText={setDetails}
                placeholder={t('Mobile.moderation.detailsPlaceholder')}
                placeholderTextColor="#94A3B8"
                maxLength={1000}
                style={{
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  padding: 12,
                  minHeight: 90,
                  textAlignVertical: 'top',
                  color: '#0B1F44',
                  fontSize: 14,
                }}
              />
            </ScrollView>

            <Pressable
              onPress={submit}
              disabled={!reason || submitting}
              className={`mt-2 h-[52px] flex-row items-center justify-center rounded-2xl ${
                !reason || submitting ? 'bg-slate-300' : 'bg-[#162C66] active:opacity-90'
              }`}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text className="text-[15px] font-extrabold text-white">
                  {t('Mobile.moderation.submit')}
                </Text>
              )}
            </Pressable>
            <Pressable
              onPress={handleClose}
              disabled={submitting}
              className="mt-2 h-[44px] items-center justify-center"
            >
              <Text className="text-[14px] font-bold text-slate-500">
                {t('Mobile.moderation.cancel')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
