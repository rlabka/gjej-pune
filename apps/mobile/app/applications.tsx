import { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Ban,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckCircle,
  ChevronRight,
  Eye,
  FileText,
  FileX2,
  Inbox,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  RotateCcw,
  Search as SearchIcon,
  Star,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';

/* ─── Types ─────────────────────────────────────────────── */

type EmployerStatus =
  | 'NEW'
  | 'IN_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'HIRED'
  | 'REJECTED';

type EmployerApplicant = {
  id: number;
  name: string;
  role: string;
  jobKey: string;
  location: string;
  status: EmployerStatus;
  appliedAt: string;
  img: string;
};

type JobSeekerStatus = 'In Review' | 'Interview' | 'Rejected' | 'Pending';

type JobSeekerApplication = {
  id: number;
  title: string;
  company: string;
  location: string;
  appliedDate: string;
  status: JobSeekerStatus;
  logo: string;
};

/* ─── Mock data ─────────────────────────────────────────── */

const EMPLOYER_INITIAL: EmployerApplicant[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    role: 'Senior Frontend Engineer',
    jobKey: 'seniorFrontendEngineer',
    location: 'Zürich',
    status: 'IN_REVIEW',
    appliedAt: 'Jan 28, 2026',
    img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 2,
    name: 'Sarah Miller',
    role: 'Product Designer',
    jobKey: 'productDesigner',
    location: 'Bern',
    status: 'NEW',
    appliedAt: 'Jan 29, 2026',
    img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 3,
    name: 'Marc Dubois',
    role: 'Fullstack Developer',
    jobKey: 'fullstackDeveloper',
    location: 'Geneva',
    status: 'SHORTLISTED',
    appliedAt: 'Jan 25, 2026',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 4,
    name: 'Elena Rossi',
    role: 'Fullstack Developer',
    jobKey: 'fullstackDeveloper',
    location: 'Lugano',
    status: 'REJECTED',
    appliedAt: 'Jan 20, 2026',
    img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 5,
    name: 'Maya Keller',
    role: 'Marketing Manager',
    jobKey: 'marketingManager',
    location: 'Basel',
    status: 'INTERVIEW',
    appliedAt: 'Jan 22, 2026',
    img: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=100',
  },
  {
    id: 6,
    name: 'Noah Schmid',
    role: 'Sales Executive',
    jobKey: 'salesExecutive',
    location: 'Zürich',
    status: 'HIRED',
    appliedAt: 'Jan 10, 2026',
    img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
  },
];

const JOB_SEEKER_INITIAL: JobSeekerApplication[] = [
  { id: 1, title: 'Senior UX Designer', company: 'Google Switzerland', location: 'Zürich', appliedDate: '2 days ago', status: 'Interview', logo: 'G' },
  { id: 2, title: 'Frontend Developer', company: 'Meta', location: 'Remote', appliedDate: '5 days ago', status: 'In Review', logo: 'M' },
  { id: 3, title: 'Product Manager', company: 'Netflix', location: 'Bern', appliedDate: '1 week ago', status: 'Pending', logo: 'N' },
  { id: 4, title: 'Backend Engineer', company: 'Amazon', location: 'Geneva', appliedDate: '2 weeks ago', status: 'Rejected', logo: 'A' },
  { id: 5, title: 'Mobile App Developer', company: 'Spotify', location: 'Zürich', appliedDate: '3 weeks ago', status: 'In Review', logo: 'S' },
];

/* ─── Status visuals ────────────────────────────────────── */

const EMPLOYER_PIPELINE: EmployerStatus[] = [
  'NEW',
  'IN_REVIEW',
  'SHORTLISTED',
  'INTERVIEW',
  'HIRED',
  'REJECTED',
];

const STATUS_COLOR: Record<EmployerStatus, { dot: string; bg: string; text: string }> = {
  NEW: { dot: '#3B82F6', bg: '#EFF6FF', text: '#1D4ED8' },
  IN_REVIEW: { dot: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  SHORTLISTED: { dot: '#6366F1', bg: '#EEF2FF', text: '#4338CA' },
  INTERVIEW: { dot: '#A855F7', bg: '#FAF5FF', text: '#7E22CE' },
  HIRED: { dot: '#10B981', bg: '#ECFDF5', text: '#047857' },
  REJECTED: { dot: '#EF4444', bg: '#FEF2F2', text: '#B91C1C' },
};

const JS_STATUS_COLOR: Record<JobSeekerStatus, { dot: string; bg: string; text: string }> = {
  'In Review': { dot: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
  Interview: { dot: '#A855F7', bg: '#FAF5FF', text: '#7E22CE' },
  Pending: { dot: '#94A3B8', bg: '#F1F5F9', text: '#475569' },
  Rejected: { dot: '#EF4444', bg: '#FEF2F2', text: '#B91C1C' },
};

/* ─── Component ─────────────────────────────────────────── */

export default function ApplicationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { session } = useAuth();
  const isEmployer = session?.role === 'employer';

  if (isEmployer) return <EmployerView t={t} onBack={() => router.back()} />;
  return (
    <JobSeekerView
      t={t}
      onBack={() => router.back()}
      onBrowseJobs={() => router.push('/(tabs)/search' as any)}
    />
  );
}

/* ═══ Employer View ═══════════════════════════════════════ */

function EmployerView({
  t,
  onBack,
}: {
  t: (key: string, opts?: any) => string;
  onBack: () => void;
}) {
  const [items, setItems] = useState<EmployerApplicant[]>(EMPLOYER_INITIAL);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<EmployerStatus | 'ALL'>('ALL');
  const [openMenuFor, setOpenMenuFor] = useState<number | null>(null);

  const counts = useMemo(() => {
    const c: Record<EmployerStatus, number> = {
      NEW: 0,
      IN_REVIEW: 0,
      SHORTLISTED: 0,
      INTERVIEW: 0,
      HIRED: 0,
      REJECTED: 0,
    };
    const q = query.toLowerCase();
    items.forEach((i) => {
      if (q && !i.name.toLowerCase().includes(q)) return;
      c[i.status]++;
    });
    return c;
  }, [items, query]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (activeTab !== 'ALL' && i.status !== activeTab) return false;
        if (query) {
          const q = query.toLowerCase();
          return (
            i.name.toLowerCase().includes(q) ||
            i.location.toLowerCase().includes(q) ||
            i.role.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort(
        (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
  }, [items, activeTab, query]);

  const moveTo = (id: number, status: EmployerStatus) => {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setOpenMenuFor(null);
  };

  const handleAction = (id: number, action: string) => {
    setOpenMenuFor(null);
    const a = items.find((x) => x.id === id);
    if (!a) return;
    if (a.status === 'HIRED' && action !== 'restore') return;
    switch (action) {
      case 'shortlist':
        return moveTo(id, 'SHORTLISTED');
      case 'interview':
        return moveTo(id, 'INTERVIEW');
      case 'restore':
        return moveTo(id, 'IN_REVIEW');
      case 'hire':
        Alert.alert(
          t('Mobile.applications.confirmHireTitle'),
          t('Mobile.applications.confirmHireDesc', { name: a.name }),
          [
            { text: t('Mobile.common.cancel'), style: 'cancel' },
            { text: t('Mobile.common.confirm'), onPress: () => moveTo(id, 'HIRED') },
          ]
        );
        return;
      case 'reject':
        Alert.alert(
          t('Mobile.applications.confirmRejectTitle'),
          t('Mobile.applications.confirmRejectDesc', { name: a.name }),
          [
            { text: t('Mobile.common.cancel'), style: 'cancel' },
            {
              text: t('Mobile.common.confirm'),
              style: 'destructive',
              onPress: () => moveTo(id, 'REJECTED'),
            },
          ]
        );
        return;
    }
  };

  const tabs: Array<{
    key: EmployerStatus | 'ALL';
    label: string;
    count: number;
    dot?: string;
  }> = [
    { key: 'ALL', label: t('Mobile.applications.tabAll'), count: total },
    { key: 'NEW', label: t('Mobile.applications.tabNew'), count: counts.NEW, dot: STATUS_COLOR.NEW.dot },
    { key: 'IN_REVIEW', label: t('Mobile.applications.tabInReview'), count: counts.IN_REVIEW, dot: STATUS_COLOR.IN_REVIEW.dot },
    { key: 'SHORTLISTED', label: t('Mobile.applications.tabShortlisted'), count: counts.SHORTLISTED, dot: STATUS_COLOR.SHORTLISTED.dot },
    { key: 'INTERVIEW', label: t('Mobile.applications.tabInterview'), count: counts.INTERVIEW, dot: STATUS_COLOR.INTERVIEW.dot },
    { key: 'HIRED', label: t('Mobile.applications.tabHired'), count: counts.HIRED, dot: STATUS_COLOR.HIRED.dot },
    { key: 'REJECTED', label: t('Mobile.applications.tabRejected'), count: counts.REJECTED, dot: STATUS_COLOR.REJECTED.dot },
  ];

  const stageLabel = (s: EmployerStatus) => {
    switch (s) {
      case 'NEW':
        return t('Mobile.applications.tabNew');
      case 'IN_REVIEW':
        return t('Mobile.applications.tabInReview');
      case 'SHORTLISTED':
        return t('Mobile.applications.tabShortlisted');
      case 'INTERVIEW':
        return t('Mobile.applications.tabInterview');
      case 'HIRED':
        return t('Mobile.applications.tabHired');
      case 'REJECTED':
        return t('Mobile.applications.tabRejected');
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 pt-2">
          <Pressable
            onPress={onBack}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        <FlatList
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => {
            const sc = STATUS_COLOR[item.status];
            return (
              <View className="px-4 mb-3">
                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 flex-row items-center">
                      <View className="h-11 w-11 overflow-hidden rounded-full bg-slate-100">
                        <Image
                          source={{ uri: item.img }}
                          className="h-full w-full"
                        />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-[14px] font-bold text-[#0B1F44]" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-[12px] text-slate-500" numberOfLines={1}>
                          {item.role}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() =>
                        setOpenMenuFor(openMenuFor === item.id ? null : item.id)
                      }
                      className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100"
                    >
                      <MoreHorizontal color="#94A3B8" size={18} />
                    </Pressable>
                  </View>

                  <View className="mt-3 flex-row flex-wrap items-center" style={{ gap: 12 }}>
                    <View className="flex-row items-center">
                      <MapPin color="#94A3B8" size={12} />
                      <Text className="ml-1 text-[12px] text-slate-500">
                        {item.location}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Calendar color="#94A3B8" size={12} />
                      <Text className="ml-1 text-[12px] text-slate-500">
                        {item.appliedAt}
                      </Text>
                    </View>
                  </View>

                  <View
                    className="mt-3 flex-row items-center self-start rounded-lg px-2.5 py-1"
                    style={{ backgroundColor: sc.bg }}
                  >
                    <View
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: sc.dot }}
                    />
                    <Text
                      className="ml-1.5 text-[11px] font-bold"
                      style={{ color: sc.text }}
                    >
                      {stageLabel(item.status)}
                    </Text>
                  </View>

                  {openMenuFor === item.id ? (
                    <View className="mt-3 flex-row flex-wrap" style={{ gap: 6 }}>
                      <ActionPill
                        icon={<Eye color="#0B1F44" size={12} />}
                        label={t('Mobile.applications.actionViewProfile')}
                        onPress={() => setOpenMenuFor(null)}
                      />
                      {item.status !== 'SHORTLISTED' &&
                      item.status !== 'HIRED' &&
                      item.status !== 'REJECTED' ? (
                        <ActionPill
                          icon={<Star color="#0B1F44" size={12} />}
                          label={t('Mobile.applications.actionShortlist')}
                          onPress={() => handleAction(item.id, 'shortlist')}
                        />
                      ) : null}
                      {item.status !== 'INTERVIEW' &&
                      item.status !== 'HIRED' &&
                      item.status !== 'REJECTED' ? (
                        <ActionPill
                          icon={<CalendarCheck color="#0B1F44" size={12} />}
                          label={t('Mobile.applications.actionInterview')}
                          onPress={() => handleAction(item.id, 'interview')}
                        />
                      ) : null}
                      {item.status !== 'HIRED' && item.status !== 'REJECTED' ? (
                        <ActionPill
                          icon={<UserCheck color="#0B1F44" size={12} />}
                          label={t('Mobile.applications.actionHire')}
                          onPress={() => handleAction(item.id, 'hire')}
                        />
                      ) : null}
                      <ActionPill
                        icon={<MessageSquare color="#0B1F44" size={12} />}
                        label={t('Mobile.applications.actionMessage')}
                        onPress={() => setOpenMenuFor(null)}
                      />
                      {item.status === 'REJECTED' ? (
                        <ActionPill
                          icon={<RotateCcw color="#0B1F44" size={12} />}
                          label={t('Mobile.applications.actionRestore')}
                          onPress={() => handleAction(item.id, 'restore')}
                        />
                      ) : item.status !== 'HIRED' ? (
                        <ActionPill
                          icon={<Ban color="#B91C1C" size={12} />}
                          label={t('Mobile.applications.actionReject')}
                          danger
                          onPress={() => handleAction(item.id, 'reject')}
                        />
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListHeaderComponent={
            <View>
              <View className="px-6 pt-2">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/5">
                    <Users color="#162C66" size={20} />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-2xl font-extrabold text-[#0B1F44]">
                      {t('Mobile.applications.titleEmployer')}
                    </Text>
                    <Text className="mt-1 text-[13px] text-slate-500">
                      {t('Mobile.applications.subtitleEmployer')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* KPI cards */}
              <View className="mt-4 px-4 flex-row" style={{ gap: 8 }}>
                <Kpi
                  icon={<Users color="#162C66" size={16} />}
                  bg="#162C6611"
                  value={items.length}
                  label={t('Mobile.applications.metricTotal')}
                />
                <Kpi
                  icon={<FileText color="#1D4ED8" size={16} />}
                  bg="#EFF6FF"
                  value={items.filter((i) => i.status === 'NEW').length}
                  label={t('Mobile.applications.metricNew')}
                />
              </View>
              <View className="mt-2 px-4 flex-row" style={{ gap: 8 }}>
                <Kpi
                  icon={<CheckCircle color="#047857" size={16} />}
                  bg="#ECFDF5"
                  value={items.filter((i) => i.status === 'HIRED').length}
                  label={t('Mobile.applications.metricHired')}
                />
                <Kpi
                  icon={<XCircle color="#B91C1C" size={16} />}
                  bg="#FEF2F2"
                  value={items.filter((i) => i.status === 'REJECTED').length}
                  label={t('Mobile.applications.metricRejected')}
                />
              </View>

              {/* Search */}
              <View className="mt-4 px-4">
                <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
                  <SearchIcon color="#94A3B8" size={16} />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('Mobile.applications.searchPlaceholder')}
                    placeholderTextColor="#94A3B8"
                    className="ml-2 flex-1 py-3 text-[14px] text-[#0B1F44]"
                    returnKeyType="search"
                  />
                  {query ? (
                    <Pressable onPress={() => setQuery('')} className="p-1">
                      <X color="#94A3B8" size={16} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* Tabs (horizontal scroll) */}
              <View className="mt-3">
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  data={tabs}
                  keyExtractor={(it) => it.key}
                  ItemSeparatorComponent={() => <View className="w-2" />}
                  renderItem={({ item }) => {
                    const isActive = activeTab === item.key;
                    return (
                      <Pressable
                        onPress={() => setActiveTab(item.key)}
                        className={`flex-row items-center rounded-xl px-3 py-2 active:opacity-80 ${
                          isActive ? 'bg-[#162C66]' : 'bg-white border border-slate-200'
                        }`}
                      >
                        {item.dot ? (
                          <View
                            className="mr-1.5 h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: isActive ? '#FFFFFF99' : item.dot,
                            }}
                          />
                        ) : null}
                        <Text
                          className={`text-[12px] font-bold ${
                            isActive ? 'text-white' : 'text-[#0B1F44]'
                          }`}
                        >
                          {item.label}
                        </Text>
                        <View
                          className={`ml-1.5 rounded-md px-1.5 py-0.5 ${
                            isActive ? 'bg-white/20' : 'bg-slate-100'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-extrabold ${
                              isActive ? 'text-white' : 'text-slate-500'
                            }`}
                          >
                            {item.count}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </View>

              <View className="h-3" />
            </View>
          }
          ListEmptyComponent={
            <View className="mt-10 items-center px-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Inbox color="#CBD5E1" size={26} />
              </View>
              <Text className="text-[15px] font-bold text-[#0B1F44]">
                {t('Mobile.applications.emptyEmployer')}
              </Text>
              <Text className="mt-1 text-center text-[13px] text-slate-400">
                {t('Mobile.applications.emptyEmployerDesc')}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* ═══ Job-Seeker View ═════════════════════════════════════ */

function JobSeekerView({
  t,
  onBack,
  onBrowseJobs,
}: {
  t: (key: string, opts?: any) => string;
  onBack: () => void;
  onBrowseJobs: () => void;
}) {
  const [items] = useState<JobSeekerApplication[]>(JOB_SEEKER_INITIAL);
  const [activeTab, setActiveTab] = useState<'All' | JobSeekerStatus>('All');

  const tabs: Array<{ key: 'All' | JobSeekerStatus; label: string }> = [
    { key: 'All', label: t('Mobile.applications.tabAll') },
    { key: 'In Review', label: t('Mobile.applications.tabInReview') },
    { key: 'Interview', label: t('Mobile.applications.tabInterview') },
    { key: 'Rejected', label: t('Mobile.applications.tabRejected') },
  ];

  const filtered = useMemo(() => {
    if (activeTab === 'All') return items;
    return items.filter((a) => a.status === activeTab);
  }, [items, activeTab]);

  const tabCount = (k: 'All' | JobSeekerStatus) =>
    k === 'All' ? items.length : items.filter((a) => a.status === k).length;

  const stageLabel = (s: JobSeekerStatus) => {
    switch (s) {
      case 'In Review':
        return t('Mobile.applications.tabInReview');
      case 'Interview':
        return t('Mobile.applications.tabInterview');
      case 'Pending':
        return t('Mobile.applications.tabPending');
      case 'Rejected':
        return t('Mobile.applications.tabRejected');
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 pt-2">
          <Pressable
            onPress={onBack}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        <FlatList
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 80 }}
          data={filtered}
          keyExtractor={(i) => String(i.id)}
          renderItem={({ item }) => {
            const sc = JS_STATUS_COLOR[item.status];
            return (
              <View className="px-4 mb-3">
                <Pressable className="rounded-2xl border border-slate-200 bg-white p-4 active:opacity-90">
                  <View className="flex-row items-center">
                    <View className="h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                      <Text className="text-base font-extrabold text-[#162C66]">
                        {item.logo}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className="text-[14px] font-bold text-[#0B1F44]"
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className="mt-0.5 text-[12px] font-medium text-slate-500"
                        numberOfLines={1}
                      >
                        {item.company}
                      </Text>
                      <View className="mt-1.5 flex-row items-center" style={{ gap: 12 }}>
                        <View className="flex-row items-center">
                          <MapPin color="#94A3B8" size={11} />
                          <Text className="ml-1 text-[11px] text-slate-400">
                            {item.location}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Calendar color="#94A3B8" size={11} />
                          <Text className="ml-1 text-[11px] text-slate-400">
                            {t('Mobile.applications.appliedOn', {
                              date: item.appliedDate,
                            })}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View className="ml-2 items-end">
                      <View
                        className="flex-row items-center rounded-lg px-2 py-1"
                        style={{ backgroundColor: sc.bg }}
                      >
                        <View
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: sc.dot }}
                        />
                        <Text
                          className="ml-1 text-[10px] font-bold"
                          style={{ color: sc.text }}
                        >
                          {stageLabel(item.status)}
                        </Text>
                      </View>
                      <ChevronRight color="#CBD5E1" size={18} className="mt-1.5" />
                    </View>
                  </View>
                </Pressable>
              </View>
            );
          }}
          ListHeaderComponent={
            <View>
              <View className="px-6 pt-2">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/5">
                    <FileText color="#162C66" size={20} />
                  </View>
                  <View className="flex-1 pt-0.5">
                    <Text className="text-2xl font-extrabold text-[#0B1F44]">
                      {t('Mobile.applications.titleJobSeeker')}
                    </Text>
                    <Text className="mt-1 text-[13px] text-slate-500">
                      {t('Mobile.applications.subtitleJobSeeker')}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-4 flex-row flex-wrap px-4" style={{ gap: 8 }}>
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      className={`flex-row items-center rounded-full px-3.5 py-2 active:opacity-80 ${
                        isActive ? 'bg-[#162C66]' : 'bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-[13px] font-bold ${
                          isActive ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {tab.label}
                      </Text>
                      <Text
                        className={`ml-1.5 text-[11px] ${
                          isActive ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {tabCount(tab.key)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View className="h-3" />
            </View>
          }
          ListEmptyComponent={
            <View className="mt-10 items-center px-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <FileX2 color="#CBD5E1" size={26} />
              </View>
              <Text className="text-[15px] font-bold text-[#0B1F44]">
                {t('Mobile.applications.emptyJobSeeker')}
              </Text>
              <Text className="mt-1 text-center text-[13px] text-slate-400">
                {t('Mobile.applications.emptyJobSeekerDesc')}
              </Text>
              <Pressable
                onPress={onBrowseJobs}
                className="mt-4 flex-row items-center rounded-xl bg-[#162C66] px-4 py-2.5 active:opacity-80"
              >
                <Briefcase color="#FFFFFF" size={14} />
                <Text className="ml-1.5 text-[13px] font-extrabold text-white">
                  {t('Mobile.applications.browseJobs')}
                </Text>
              </Pressable>
            </View>
          }
        />
      </SafeAreaView>
    </View>
  );
}

/* ─── Helpers ───────────────────────────────────────────── */

function Kpi({
  icon,
  value,
  label,
  bg,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  bg: string;
}) {
  return (
    <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3">
      <View
        className="h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: bg }}
      >
        {icon}
      </View>
      <Text className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </Text>
      <Text className="mt-0.5 text-xl font-extrabold text-[#0B1F44]">
        {value}
      </Text>
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center rounded-lg px-2.5 py-1.5 active:opacity-80 ${
        danger ? 'bg-red-50' : 'bg-slate-100'
      }`}
    >
      {icon}
      <Text
        className={`ml-1 text-[11px] font-bold ${
          danger ? 'text-red-600' : 'text-[#0B1F44]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
