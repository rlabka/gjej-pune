import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Circle,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  Save,
  User,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { JobCategoryPicker } from '@/components/JobCategoryPicker';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import type { LocationSuggestion } from '@/lib/useLocationAutocomplete';
import { CurrencySelect } from '@/components/CurrencySelect';

const SALARY_TYPES = ['Hour', 'Month', 'Year', 'Provision'] as const;
type SalaryType = (typeof SALARY_TYPES)[number];

export default function EditJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const dialog = useDialog();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [category, setCategory] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactSurname, setContactSurname] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [salary, setSalary] = useState('');
  const [salaryType, setSalaryType] = useState<SalaryType>('Hour');
  const [currency, setCurrency] = useState<string>('CHF');
  const [locationLabel, setLocationLabel] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [whenOption, setWhenOption] = useState<'Urgent' | 'Negotiation' | ''>('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Load existing job ───────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const token = (await getToken()) ?? undefined;
        const res = await api.get<{ ok: boolean; job: any }>(
          `/api/jobs/${id}`,
          token
        );
        if (res?.ok && res.job) {
          const j = res.job;
          setCategory(j.category ?? '');
          setContactName(j.contactName ?? '');
          setContactSurname(j.contactSurname ?? '');
          setContactPhone(j.contactPhone ?? '');
          setCompanyName(j.companyName ?? '');
          setSalary(j.salary != null ? String(j.salary) : '');
          if (SALARY_TYPES.includes(j.salaryType as SalaryType)) {
            setSalaryType(j.salaryType as SalaryType);
          }
          setCurrency(j.currency ?? 'CHF');
          const city = j.locationCity ?? '';
          const state = j.locationState ?? '';
          setLocationCity(city);
          setLocationState(state);
          setLocationLabel(state && city !== state ? `${city}, ${state}` : city);
          if (j.lat != null) setLocationLat(j.lat);
          if (j.lng != null) setLocationLng(j.lng);
          if (j.when === 'Urgent' || j.when === 'Negotiation') {
            setWhenOption(j.when);
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const canSave =
    !!category &&
    contactName.trim().length > 0 &&
    contactSurname.trim().length > 0 &&
    contactPhone.trim().length > 0 &&
    salary.trim().length > 0 &&
    locationLabel.trim().length > 0 &&
    !!whenOption;

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });

  async function onSave() {
    if (submitting) return;

    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = 'required';
    if (!contactName.trim()) nextErrors.contactName = 'required';
    if (!contactSurname.trim()) nextErrors.contactSurname = 'required';
    if (!contactPhone.trim()) nextErrors.contactPhone = 'required';
    if (!salary.trim()) nextErrors.salary = 'required';
    if (!locationLabel.trim()) nextErrors.locationCity = 'required';
    if (!whenOption) nextErrors.when = 'required';
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const token = (await getToken()) ?? undefined;
      const payload: any = {
        category,
        contactName: contactName.trim(),
        contactSurname: contactSurname.trim(),
        contactPhone: contactPhone.trim(),
        companyName: companyName.trim() || undefined,
        salary: salary ? parseFloat(salary) : undefined,
        salaryType,
        currency: salaryType === 'Provision' ? undefined : currency,
        locationCity: locationCity.trim() || locationLabel.trim(),
        locationState: locationState.trim() || locationLabel.trim(),
        lat: locationLat ?? undefined,
        lng: locationLng ?? undefined,
        when: whenOption,
      };
      const res = await api.put<{
        ok: boolean;
        error?: string;
        details?: { field: string; message: string }[];
      }>(`/api/jobs/${id}`, payload, token);

      if (res.ok) {
        router.back();
      } else if (res.error === 'validationError' && res.details) {
        const serverErrors: Record<string, string> = {};
        for (const d of res.details) serverErrors[d.field] = d.message;
        setErrors(serverErrors);
      } else {
        dialog.showError(t('Mobile.jobForm.errorToast'));
      }
    } catch {
      dialog.showError(t('Mobile.jobForm.errorToast'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#162C66" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-4 pb-1 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
          <Text className="text-[16px] font-extrabold tracking-tight text-[#0B1F44]">
            {t('Mobile.adForm.editJobTitle')}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="mb-5 mt-2 flex-row items-start px-5">
              <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/[0.06]">
                <Briefcase color="#162C66" size={22} />
              </View>
              <View className="flex-1 pt-0.5">
                <Text className="text-xl font-extrabold text-[#0B1F44]">
                  {t('Mobile.adForm.editJobTitle')}
                </Text>
                <Text className="mt-1 text-[13px] text-slate-500">
                  {t('Mobile.jobForm.subtitle')}
                </Text>
              </View>
            </View>

            {/* Job Category */}
            <Card>
              <CardHeader
                icon={<Briefcase color="#D97706" size={16} />}
                iconBg="#FFFBEB"
                title={t('Mobile.jobForm.category')}
                required
              />
              <JobCategoryPicker
                value={category}
                onChange={(key) => {
                  setCategory(key);
                  clearError('category');
                }}
                placeholder={t('Mobile.jobForm.selectCategory')}
                hasError={!!errors.category}
              />
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader
                icon={<User color="#162C66" size={16} />}
                iconBg="rgba(22,44,102,0.06)"
                title={t('Mobile.jobForm.contactInfo')}
              />
              <View style={{ gap: 14 }}>
                <Field
                  label={t('Mobile.jobForm.name')}
                  icon={<User color="#94A3B8" size={11} />}
                  required
                  hint={t('Mobile.jobForm.hidden')}
                  value={contactName}
                  onChangeText={(v) => {
                    setContactName(v);
                    clearError('contactName');
                  }}
                  placeholder={t('Mobile.jobForm.namePh')}
                  hasError={!!errors.contactName}
                />
                <Field
                  label={t('Mobile.jobForm.surname')}
                  icon={<User color="#94A3B8" size={11} />}
                  required
                  hint={t('Mobile.jobForm.hidden')}
                  value={contactSurname}
                  onChangeText={(v) => {
                    setContactSurname(v);
                    clearError('contactSurname');
                  }}
                  placeholder={t('Mobile.jobForm.surnamePh')}
                  hasError={!!errors.contactSurname}
                />
                <Field
                  label={t('Mobile.jobForm.telNr')}
                  icon={<Phone color="#94A3B8" size={11} />}
                  required
                  hint={t('Mobile.jobForm.hidden')}
                  value={contactPhone}
                  onChangeText={(v) => {
                    setContactPhone(v);
                    clearError('contactPhone');
                  }}
                  placeholder={t('Mobile.jobForm.phonePh')}
                  keyboardType="phone-pad"
                  hasError={!!errors.contactPhone}
                />
                <Field
                  label={t('Mobile.jobForm.companyName')}
                  icon={<Building2 color="#94A3B8" size={11} />}
                  hint={t('Mobile.jobForm.companyHidden')}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder={t('Mobile.jobForm.companyPh')}
                />
              </View>
            </Card>

            {/* Salary */}
            <Card>
              <CardHeader
                icon={<DollarSign color="#059669" size={16} />}
                iconBg="#ECFDF5"
                title={t('Mobile.jobForm.salary')}
                required
              />

              {/* Salary type segmented control */}
              <View className="mb-3 flex-row overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {SALARY_TYPES.map((st) => {
                  const active = salaryType === st;
                  return (
                    <Pressable
                      key={st}
                      onPress={() => {
                        setSalaryType(st);
                        if (st === 'Provision') setSalary('');
                      }}
                      className={`flex-1 py-2.5 ${active ? 'bg-[#162C66]' : ''}`}
                    >
                      <Text
                        className={`text-center text-[12px] font-semibold ${
                          active ? 'text-white' : 'text-slate-600'
                        }`}
                        numberOfLines={1}
                      >
                        {t(`Mobile.jobForm.salary${st}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Amount + currency */}
              <View className="flex-row" style={{ gap: 8 }}>
                <View className="relative flex-1">
                  <TextInput
                    value={salary}
                    onChangeText={(v) => {
                      if (salaryType === 'Provision') {
                        if (v === '' || (/^\d*\.?\d*$/.test(v) && parseFloat(v) <= 100)) {
                          setSalary(v);
                          clearError('salary');
                        }
                      } else {
                        if (v === '' || /^\d*\.?\d*$/.test(v)) {
                          setSalary(v);
                          clearError('salary');
                        }
                      }
                    }}
                    placeholder={
                      salaryType === 'Provision'
                        ? t('Mobile.jobForm.provisionPh')
                        : t('Mobile.jobForm.salaryPh')
                    }
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    className={`rounded-xl border px-4 py-3 text-[15px] font-medium text-slate-900 ${
                      errors.salary
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-slate-200 bg-slate-50'
                    } ${salaryType === 'Provision' ? 'pr-10' : ''}`}
                  />
                  {salaryType === 'Provision' ? (
                    <Text className="absolute right-4 top-1/2 -translate-y-[10px] text-[15px] font-bold text-slate-400">
                      %
                    </Text>
                  ) : null}
                </View>
                {salaryType !== 'Provision' ? (
                  <CurrencySelect value={currency} onChange={setCurrency} />
                ) : null}
              </View>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader
                icon={<MapPin color="#2563EB" size={16} />}
                iconBg="#EFF6FF"
                title={t('Mobile.jobForm.location')}
                required
              />
              <LocationAutocomplete
                value={locationLabel}
                onChangeText={(val) => {
                  // User is typing freely — keep displayed text as-is and reset
                  // the structured fields so we don't reuse stale city/state.
                  setLocationLabel(val);
                  setLocationCity('');
                  setLocationState('');
                  setLocationLat(null);
                  setLocationLng(null);
                  clearError('locationCity');
                }}
                onSelect={(s: LocationSuggestion) => {
                  // User picked a real suggestion — populate structured fields.
                  const state = s.state || s.country || '';
                  setLocationCity(s.city);
                  setLocationState(state);
                  setLocationLabel(
                    state && s.city !== state ? `${s.city}, ${state}` : s.city
                  );
                  setLocationLat(s.lat);
                  setLocationLng(s.lng);
                  clearError('locationCity');
                }}
                placeholder={t('Mobile.jobForm.locationPh')}
                variant="light"
              />
            </Card>

            {/* When */}
            <Card>
              <CardHeader
                icon={<Clock color="#7C3AED" size={16} />}
                iconBg="#F5F3FF"
                title={t('Mobile.jobForm.when')}
                required
              />
              <View className="flex-row" style={{ gap: 10 }}>
                {(['Urgent', 'Negotiation'] as const).map((opt) => {
                  const active = whenOption === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        setWhenOption(opt);
                        clearError('when');
                      }}
                      className={`flex-1 rounded-xl border-2 py-3.5 ${
                        active
                          ? 'border-[#162C66] bg-[#162C66]'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <Text
                        className={`text-center text-[14px] font-semibold ${
                          active ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {t(`Mobile.jobForm.when${opt}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>

            {/* Checklist */}
            <Card>
              <Text className="mb-3 text-sm font-bold text-[#0B1F44]">
                {t('Mobile.jobForm.checklist')}
              </Text>
              <View style={{ gap: 8 }}>
                <ChecklistRow
                  label={t('Mobile.jobForm.category')}
                  done={!!category}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.name')}
                  done={!!contactName.trim()}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.surname')}
                  done={!!contactSurname.trim()}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.telNr')}
                  done={!!contactPhone.trim()}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.salary')}
                  done={!!salary.trim()}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.location')}
                  done={!!locationLabel.trim()}
                />
                <ChecklistRow
                  label={t('Mobile.jobForm.when')}
                  done={!!whenOption}
                />
              </View>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Sticky bottom Save CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-200/60 bg-white px-4 pt-3"
          style={{
            paddingBottom: 24,
            shadowColor: '#0B1F44',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Pressable
            onPress={onSave}
            disabled={submitting || !canSave}
            className={`h-[52px] flex-row items-center justify-center rounded-xl active:opacity-90 ${
              canSave ? 'bg-[#162C66]' : 'bg-slate-100'
            }`}
            style={
              canSave
                ? {
                    shadowColor: '#162C66',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 4,
                  }
                : undefined
            }
          >
            {submitting ? (
              <ActivityIndicator color={canSave ? '#FFFFFF' : '#94A3B8'} />
            ) : (
              <>
                <Save color={canSave ? '#FFFFFF' : '#94A3B8'} size={16} />
                <Text
                  className={`ml-2 text-[15px] font-extrabold ${
                    canSave ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {t('Mobile.adForm.update')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="mx-4 mb-4 rounded-2xl border border-slate-200 bg-white p-5"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}

function CardHeader({
  icon,
  iconBg,
  title,
  required,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  required?: boolean;
}) {
  return (
    <View className="mb-4 flex-row items-center">
      <View
        className="mr-2.5 h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </View>
      <Text className="text-[14px] font-bold text-[#0B1F44]">
        {title}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
    </View>
  );
}

function Field({
  label,
  icon,
  required,
  hint,
  hasError,
  value,
  onChangeText,
  ...rest
}: {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
  hasError?: boolean;
  value: string;
  onChangeText: (v: string) => void;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  return (
    <View>
      <View className="mb-1.5 flex-row items-center" style={{ gap: 4 }}>
        {icon}
        <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {label}
          {required ? <Text className="text-red-500"> *</Text> : null}
        </Text>
        {hint ? (
          <Text className="text-[10px] font-medium text-slate-400">{hint}</Text>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#94A3B8"
        className={`rounded-xl border px-4 py-3 text-[15px] font-medium text-slate-900 ${
          hasError
            ? 'border-red-300 bg-red-50/50'
            : 'border-slate-200 bg-slate-50'
        }`}
        {...rest}
      />
    </View>
  );
}

function ChecklistRow({ label, done }: { label: string; done: boolean }) {
  return (
    <View className="flex-row items-center">
      <View
        className={`mr-2.5 h-5 w-5 items-center justify-center rounded-md ${
          done ? 'bg-emerald-100' : 'bg-slate-100'
        }`}
      >
        {done ? (
          <CheckCircle2 color="#059669" size={12} />
        ) : (
          <Circle color="#CBD5E1" size={12} />
        )}
      </View>
      <Text
        className={`text-[13px] font-medium ${
          done ? 'text-slate-700' : 'text-slate-400'
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
