import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';
import { api } from '@/lib/api';
import { config } from '@/lib/config';

const ADVERTISE_BASE_URL = 'https://gjej-pune.com';
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Globe,
  Handshake,
  ListChecks,
  LogIn,
  Mail,
  Menu,
  Search,
  Shield,
  Star,
  UserPlus,
  Users,
  X,
} from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

const LOCALE_LABELS: Record<string, string> = {
  de: 'Deutsch',
  en: 'English',
  fr: 'Français',
  it: 'Italiano',
  sq: 'Shqip',
};

const HERO_IMAGE = require('../assets/images/hero.png');
const LOGO_IMAGE = require('../assets/images/logo.png');
const FALLBACK_PARTNER_LOGO = require('../assets/images/magentix-logo.png');

const TRUST_CTA: Record<string, { question: string; link: string }> = {
  de: { question: 'Möchtest du, dass dein Logo hier steht?', link: 'Jetzt werben' },
  en: { question: 'Want your logo here?', link: 'Advertise now' },
  fr: { question: 'Vous voulez votre logo ici ?', link: 'Faire de la publicité' },
  it: { question: 'Vuoi il tuo logo qui?', link: 'Pubblicizza ora' },
  sq: { question: 'Dëshironi logon tuaj këtu?', link: 'Reklamoni tani' },
};

type AdLogo = {
  id: string;
  companyName: string;
  companyWebsite: string | null;
  logoUrl: string | null;
};

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, locale, setLocale, locales } = useI18n();
  const [role, setRole] = useState<'job-seeker' | 'employer'>('job-seeker');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [trustLogos, setTrustLogos] = useState<AdLogo[]>([]);

  // Fetch active ad placements for the trust marquee
  useEffect(() => {
    api
      .get<{ ok: boolean; ads: AdLogo[] }>('/api/ad-placements/active')
      .then((res) => {
        if (res?.ok) setTrustLogos(res.ads ?? []);
      })
      .catch(() => {});
  }, []);

  const trustCta = TRUST_CTA[locale] ?? TRUST_CTA.de;
  const trustLogoUrls = useMemo(() => {
    const urls: string[] = [];
    for (const ad of trustLogos) {
      if (!ad.logoUrl) continue;
      urls.push(
        ad.logoUrl.startsWith('http')
          ? ad.logoUrl
          : `${config.apiUrl}${ad.logoUrl}`
      );
    }
    return urls;
  }, [trustLogos]);

  // Hero title with the "Sigurt" / "Safe" highlight
  const heroParts = useMemo(() => {
    const raw = t('Hero.title');
    const m = raw.match(/^(.*?)<marker>(.*?)<\/marker>(.*)$/s);
    if (!m) return { before: raw, marker: '', after: '' };
    return { before: m[1], marker: m[2], after: m[3] };
  }, [t]);

  const handleSearch = () => {
    router.push({
      pathname: '/(auth)/register',
      params: { role, location },
    } as any);
  };

  const openAdvertise = async () => {
    try {
      await WebBrowser.openBrowserAsync(`${ADVERTISE_BASE_URL}/${locale}/advertise`, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        toolbarColor: '#162C66',
        controlsColor: '#FFFFFF',
        dismissButtonStyle: 'close',
      });
    } catch {
      /* ignore */
    }
  };

  const testimonials = [
    {
      name: t('Testimonials.review1_name'),
      city: t('Testimonials.review1_city'),
      text: t('Testimonials.review1_text'),
      img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: t('Testimonials.review2_name'),
      city: t('Testimonials.review2_city'),
      text: t('Testimonials.review2_text'),
      img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    },
    {
      name: t('Testimonials.review3_name'),
      city: t('Testimonials.review3_city'),
      text: t('Testimonials.review3_text'),
      img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    },
  ];

  const faqs = [1, 2, 3, 4, 5, 6].map((n) => ({
    q: t(`FAQ.q${n}`),
    a: t(`FAQ.a${n}`),
  }));

  const platformBullets = [
    { bold: t('PlatformOffer.bullet1_bold'), normal: t('PlatformOffer.bullet1_normal') },
    { bold: t('PlatformOffer.bullet2_bold'), normal: t('PlatformOffer.bullet2_normal') },
    { bold: t('PlatformOffer.bullet3_bold'), normal: t('PlatformOffer.bullet3_normal') },
    { bold: t('PlatformOffer.bullet4_bold'), normal: t('PlatformOffer.bullet4_normal') },
  ];

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* ─── Top Bar ────────────────────────────────────── */}
        <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3">
          <Image
            source={LOGO_IMAGE}
            style={{ width: 130, height: 32 }}
            resizeMode="contain"
          />
          <View className="flex-row items-center" style={{ gap: 14 }}>
            <Pressable
              onPress={() => setLangOpen(true)}
              className="flex-row items-center active:opacity-70"
            >
              <Globe color="#64748B" size={18} />
              <Text className="ml-1.5 text-[13px] font-bold uppercase text-slate-500">
                {locale}
              </Text>
              <ChevronDown color="#94A3B8" size={14} style={{ marginLeft: 2 }} />
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              className="h-9 w-9 items-center justify-center active:opacity-70"
            >
              <Menu color="#0B1F44" size={22} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero ─────────────────────────────────────── */}
          <View className="px-6 pt-10 pb-8">
            {/* Title */}
            <View className="items-center">
              <Text className="text-center text-[26px] font-extrabold leading-[1.18] text-[#162C66]">
                {heroParts.before}
                <Text className="relative">{heroParts.marker}</Text>
                {heroParts.after}
              </Text>
              {/* Wavy underline anchored under the marker word — drawn relative to the title block */}
              {heroParts.marker ? <WavyUnderline marker={heroParts.marker} /> : null}
            </View>

            {/* Subtitle */}
            <Text className="mt-4 text-center text-[14px] leading-[1.55] text-slate-500">
              {t('Hero.subtitle')}
            </Text>

            {/* Role radio buttons */}
            <View className="mt-7" style={{ gap: 14 }}>
              <RadioRow
                active={role === 'job-seeker'}
                label={t('Hero.lookingForJob')}
                onPress={() => setRole('job-seeker')}
              />
              <RadioRow
                active={role === 'employer'}
                label={t('Hero.lookingForEmployees')}
                onPress={() => setRole('employer')}
              />
            </View>

            {/* Search card */}
            <View
              className="mt-6 rounded-3xl bg-white p-2"
              style={{
                shadowColor: '#0B1F44',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.06,
                shadowRadius: 14,
                elevation: 4,
                borderWidth: 1,
                borderColor: '#F1F5F9',
              }}
            >
              <View className="rounded-2xl bg-[#F7F7F7] px-2">
                <LocationAutocomplete
                  value={location}
                  onChangeText={setLocation}
                  placeholder={t('Hero.cityPlaceholder')}
                  variant="light"
                />
              </View>
              <Pressable
                onPress={handleSearch}
                className="mt-2 flex-row items-center justify-center rounded-2xl bg-[#F5C400] py-4 active:opacity-90"
                style={{
                  shadowColor: '#F5C400',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 3,
                }}
              >
                <Search color="#162C66" size={18} strokeWidth={3} />
                <Text className="ml-2 text-[16px] font-extrabold text-[#162C66]">
                  {t('Hero.searchNow')}
                </Text>
              </Pressable>
            </View>

            {/* Trust badge */}
            <View className="mt-7 items-center">
              <View className="flex-row" style={{ gap: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    color="#F5C400"
                    fill="#F5C400"
                    size={18}
                    strokeWidth={1}
                  />
                ))}
              </View>
              <Text className="mt-2 text-[14px] font-extrabold text-[#162C66]">
                {t('Hero.trustBadge')}
              </Text>
              <Text className="mt-0.5 text-[12px] text-slate-400">
                {t('Hero.trustBadgeDesc')}
              </Text>
            </View>
          </View>

          {/* ─── Hero Image ───────────────────────────────── */}
          <View className="px-5 pb-2">
            <View
              className="overflow-hidden rounded-3xl bg-slate-100"
              style={{
                aspectRatio: 16 / 9,
                shadowColor: '#0B1F44',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.1,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              <Image
                source={HERO_IMAGE}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* ─── Trust Logos ──────────────────────────────── */}
          <View className="mt-10 border-y border-slate-100 bg-white py-8">
            <Text
              className="text-center text-[12px] font-bold uppercase text-[#162C66]/30"
              style={{ letterSpacing: 3 }}
            >
              {t('Trust.title')}
            </Text>

            <View className="mt-6">
              <TrustMarquee logos={trustLogoUrls} />
            </View>

            <View className="mt-7 px-5">
              <Text className="text-center text-[13px] text-slate-500">
                {trustCta.question}{' '}
                <Text className="font-extrabold text-[#162C66]" onPress={openAdvertise}>
                  {trustCta.link}
                </Text>
              </Text>
            </View>
          </View>

          {/* ─── How It Works ─────────────────────────────── */}
          <View className="mt-12 px-5">
            <SectionTitle title={t('HowItWorks.title')} />
            <View style={{ gap: 12 }} className="mt-5">
              <StepCard
                index={1}
                icon={<Briefcase color="#162C66" size={18} />}
                title={t('HowItWorks.step1Title')}
                desc={t('HowItWorks.step1Desc')}
              />
              <StepCard
                index={2}
                icon={<ListChecks color="#162C66" size={18} />}
                title={t('HowItWorks.step2Title')}
                desc={t('HowItWorks.step2Desc')}
              />
              <StepCard
                index={3}
                icon={<Handshake color="#162C66" size={18} />}
                title={t('HowItWorks.step3Title')}
                desc={t('HowItWorks.step3Desc')}
              />
            </View>
          </View>

          {/* ─── Platform Offer ──────────────────────────── */}
          <View className="mx-5 mt-12 overflow-hidden rounded-3xl bg-[#0B1F44] p-6">
            <View className="absolute left-0 right-0 top-0 h-1 bg-[#F5C400]" />
            <Text className="text-[20px] font-extrabold leading-tight text-white">
              {t('PlatformOffer.title')}
            </Text>
            <View className="mt-5" style={{ gap: 12 }}>
              {platformBullets.map((b, idx) => (
                <View key={idx} className="flex-row">
                  <CheckCircle2 color="#F5C400" size={16} />
                  <View className="ml-2 flex-1">
                    <Text className="text-[13px] leading-relaxed text-white">
                      <Text className="font-extrabold">{b.bold}</Text>
                      <Text className="text-white/70">{b.normal}</Text>
                    </Text>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => router.push('/(auth)/register' as any)}
              className="mt-6 flex-row items-center justify-center rounded-xl bg-[#F5C400] py-3.5 active:opacity-90"
            >
              <UserPlus color="#162C66" size={15} strokeWidth={2.5} />
              <Text className="ml-2 text-[14px] font-extrabold text-[#162C66]">
                {t('PlatformOffer.cta')}
              </Text>
            </Pressable>
          </View>

          {/* ─── Why Us ──────────────────────────────────── */}
          <View className="mt-12 px-5">
            <Text className="text-[12px] font-extrabold uppercase tracking-wider text-[#F5C400]">
              {t('WhyUs.title')}
            </Text>
            <Text className="mt-2 text-[22px] font-extrabold leading-tight text-[#0B1F44]">
              {t('WhyUs.titleHighlight')}
            </Text>
            <Text className="mt-3 text-[13px] leading-relaxed text-slate-600">
              {t('WhyUs.description')}
            </Text>
            <View className="mt-4" style={{ gap: 10 }}>
              {[1, 2, 3, 4].map((n) => (
                <View key={n} className="flex-row items-start">
                  <View className="mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-[#F5C400]/15">
                    <CheckCircle2 color="#F5C400" size={13} />
                  </View>
                  <Text className="ml-2 flex-1 text-[13px] leading-relaxed text-slate-700">
                    {t(`WhyUs.feature${n}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ─── Testimonials ────────────────────────────── */}
          <View className="mt-12">
            <View className="px-5">
              <SectionTitle title={t('Testimonials.title')} />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {testimonials.map((tt, idx) => (
                <View
                  key={idx}
                  className="mr-3 w-[290px] rounded-2xl border border-slate-200 bg-white p-5"
                  style={{
                    shadowColor: '#0B1F44',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                >
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: tt.img }}
                      style={{ width: 44, height: 44, borderRadius: 22 }}
                    />
                    <View className="ml-3 flex-1">
                      <Text className="text-[14px] font-bold text-[#0B1F44]">
                        {tt.name}
                      </Text>
                      <Text className="text-[10px] font-extrabold uppercase tracking-wider text-[#F5C400]">
                        {tt.city}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 flex-row" style={{ gap: 1 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        color="#F5C400"
                        fill="#F5C400"
                        size={11}
                        strokeWidth={1}
                      />
                    ))}
                  </View>
                  <Text className="mt-3 text-[13px] leading-relaxed text-slate-600">
                    {tt.text}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* ─── FAQ ─────────────────────────────────────── */}
          <View className="mt-12 px-5">
            <SectionTitle title={t('FAQ.title')} />
            <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {faqs.map((f, idx) => {
                const open = openFaq === idx;
                return (
                  <View
                    key={idx}
                    className={
                      idx < faqs.length - 1 ? 'border-b border-slate-100' : ''
                    }
                  >
                    <Pressable
                      onPress={() => setOpenFaq(open ? null : idx)}
                      className="flex-row items-center justify-between px-4 py-4 active:bg-slate-50"
                    >
                      <Text
                        className="flex-1 pr-3 text-[13px] font-bold text-[#0B1F44]"
                        numberOfLines={open ? undefined : 2}
                      >
                        {f.q}
                      </Text>
                      {open ? (
                        <ChevronUp color="#94A3B8" size={16} />
                      ) : (
                        <ChevronDown color="#94A3B8" size={16} />
                      )}
                    </Pressable>
                    {open ? (
                      <View className="px-4 pb-4">
                        <Text className="text-[13px] leading-relaxed text-slate-600">
                          {f.a}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* ─── Final CTA ───────────────────────────────── */}
          <View className="mx-5 mt-12 items-center overflow-hidden rounded-3xl bg-[#162C66] p-8">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#F5C400]">
              <Users color="#0B1F44" size={22} />
            </View>
            <Text className="mt-4 text-center text-[20px] font-extrabold leading-tight text-white">
              {t('CTASection.title')}
            </Text>
            <View className="mt-5 w-full" style={{ gap: 10 }}>
              <Pressable
                onPress={() => router.push('/(auth)/register' as any)}
                className="flex-row items-center justify-center rounded-xl bg-[#F5C400] py-3.5 active:opacity-90"
              >
                <UserPlus color="#162C66" size={15} strokeWidth={2.5} />
                <Text className="ml-2 text-[14px] font-extrabold text-[#162C66]">
                  {t('Header.signUp')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/(auth)/login' as any)}
                className="flex-row items-center justify-center rounded-xl border border-white/20 bg-white/5 py-3.5 active:opacity-80"
              >
                <LogIn color="#FFFFFF" size={14} />
                <Text className="ml-2 text-[14px] font-extrabold text-white">
                  {t('Header.login')}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ─── Footer ──────────────────────────────────── */}
          <View className="mt-12 border-t border-slate-100 px-5 pt-6">
            <Image
              source={LOGO_IMAGE}
              style={{ width: 120, height: 30 }}
              resizeMode="contain"
            />
            <Text className="mt-3 text-[13px] leading-relaxed text-slate-500">
              {t('Footer.description')}
            </Text>
            <View className="mt-4 flex-row flex-wrap" style={{ gap: 6 }}>
              <FooterLink
                icon={<Mail color="#64748B" size={12} />}
                label={t('Header.contact')}
                onPress={() => router.push('/contact' as any)}
              />
              <FooterLink
                icon={<FileText color="#64748B" size={12} />}
                label={t('Footer.agb')}
                onPress={() => router.push('/legal/agb' as any)}
              />
              <FooterLink
                icon={<Shield color="#64748B" size={12} />}
                label={t('Footer.privacy')}
                onPress={() => router.push('/legal/privacy' as any)}
              />
              <FooterLink
                icon={<FileText color="#64748B" size={12} />}
                label={t('Footer.impression')}
                onPress={() => router.push('/legal/imprint' as any)}
              />
            </View>
            <Text className="mt-5 text-[11px] text-slate-400">
              {t('Footer.copyright')}
            </Text>
          </View>
        </ScrollView>

        {/* ─── Hamburger Side Drawer ─────────────────────── */}
        <SideDrawer visible={menuOpen} onClose={() => setMenuOpen(false)}>
          <View className="border-b border-slate-100 px-5 pb-4 pt-2">
            <Image
              source={LOGO_IMAGE}
              style={{ width: 130, height: 32 }}
              resizeMode="contain"
            />
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingVertical: 8 }}>
            <DrawerSection label={t('Header.signUp')}>
              <DrawerRow
                icon={<UserPlus color="#162C66" size={18} />}
                label={t('Header.signUp')}
                badge="NEW"
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/(auth)/register' as any);
                }}
              />
              <DrawerRow
                icon={<LogIn color="#162C66" size={18} />}
                label={t('Header.login')}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/(auth)/login' as any);
                }}
              />
            </DrawerSection>

            <DrawerSection label={t('Header.help')}>
              <DrawerRow
                icon={<Mail color="#64748B" size={18} />}
                label={t('Header.contact')}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/contact' as any);
                }}
              />
              <DrawerRow
                icon={<Globe color="#64748B" size={18} />}
                label={t('Header.language')}
                value={LOCALE_LABELS[locale] ?? locale}
                onPress={() => {
                  setMenuOpen(false);
                  setTimeout(() => setLangOpen(true), 250);
                }}
              />
            </DrawerSection>

            <DrawerSection label={t('Mobile.legal.section')}>
              <DrawerRow
                icon={<FileText color="#64748B" size={18} />}
                label={t('Footer.agb')}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/legal/agb' as any);
                }}
              />
              <DrawerRow
                icon={<Shield color="#64748B" size={18} />}
                label={t('Footer.privacy')}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/legal/privacy' as any);
                }}
              />
              <DrawerRow
                icon={<FileText color="#64748B" size={18} />}
                label={t('Footer.impression')}
                onPress={() => {
                  setMenuOpen(false);
                  router.push('/legal/imprint' as any);
                }}
              />
            </DrawerSection>
          </ScrollView>

          <View className="border-t border-slate-100 px-5 py-4">
            <Text className="text-[11px] text-slate-400">
              {t('Footer.copyright')}
            </Text>
          </View>
        </SideDrawer>

        {/* ─── Language Picker (centered modal) ──────────── */}
        <CenterModal visible={langOpen} onClose={() => setLangOpen(false)}>
          <View className="px-6 pb-2 pt-5">
            <Text className="text-[18px] font-extrabold text-[#0B1F44]">
              {t('Footer.selectLanguage')}
            </Text>
          </View>

          <View className="px-3 py-2">
            {locales.map((l) => {
              const active = l === locale;
              return (
                <Pressable
                  key={l}
                  onPress={async () => {
                    await setLocale(l);
                    setLangOpen(false);
                  }}
                  className={`mb-1 flex-row items-center justify-between rounded-xl px-4 py-3.5 active:opacity-80 ${
                    active ? 'bg-[#162C66]/[0.06]' : ''
                  }`}
                >
                  <View className="flex-1">
                    <Text
                      className={`text-[15px] ${
                        active
                          ? 'font-extrabold text-[#162C66]'
                          : 'font-semibold text-[#0B1F44]'
                      }`}
                    >
                      {LOCALE_LABELS[l] ?? l}
                    </Text>
                    <Text className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                      {l}
                    </Text>
                  </View>
                  {active ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-[#F5C400]">
                      <Text className="text-[11px] font-extrabold text-[#162C66]">
                        ✓
                      </Text>
                    </View>
                  ) : (
                    <View className="h-5 w-5 rounded-full border-2 border-slate-200" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </CenterModal>
      </SafeAreaView>
    </View>
  );
}

/* ─── Wavy underline (SVG) ──────────────────────────────── */

function WavyUnderline({ marker }: { marker: string }) {
  // Width is roughly proportional to marker length × char width at the title size
  const width = Math.max(60, marker.length * 16);
  return (
    <View
      pointerEvents="none"
      style={{ marginTop: -6, height: 12, width, alignItems: 'center' }}
    >
      <Svg width={width} height={12} viewBox="0 0 100 12" preserveAspectRatio="none">
        <Path
          d="M 2 7 Q 25 12 50 7 T 98 7"
          stroke="#F5C400"
          strokeWidth={3.5}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function RadioRow({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center self-center active:opacity-70"
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          active ? 'border-[#F5C400]' : 'border-slate-300'
        }`}
      >
        {active ? (
          <View className="h-2.5 w-2.5 rounded-full bg-[#F5C400]" />
        ) : null}
      </View>
      <Text
        className={`ml-3 text-[15px] font-extrabold ${
          active ? 'text-[#162C66]' : 'text-slate-500'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View>
      <View className="h-1 w-10 rounded-full bg-[#F5C400]" />
      <Text className="mt-3 text-[22px] font-extrabold leading-tight text-[#0B1F44]">
        {title}
      </Text>
    </View>
  );
}

function StepCard({
  index,
  icon,
  title,
  desc,
}: {
  index: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <View className="flex-row rounded-2xl border border-slate-200 bg-white p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#F5C400]/15">
        {icon}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <View className="h-5 w-5 items-center justify-center rounded-md bg-[#0B1F44]">
            <Text className="text-[10px] font-extrabold text-[#F5C400]">
              {index}
            </Text>
          </View>
          <Text className="ml-2 text-[14px] font-extrabold text-[#0B1F44]">
            {title}
          </Text>
        </View>
        <Text className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
          {desc}
        </Text>
      </View>
    </View>
  );
}

function FooterLink({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 active:opacity-80"
    >
      {icon}
      <Text className="ml-1.5 text-[11px] font-bold text-slate-500">{label}</Text>
    </Pressable>
  );
}

/* ─── SideDrawer ──────────────────────────────────────────
 * Slides from the right edge with a fading backdrop. Native-driver
 * animations for 60fps glide. Mirrors LinkedIn / Indeed pattern.
 * ──────────────────────────────────────────────────────── */

const ABSOLUTE_FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

function SideDrawer({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { width: screenW } = Dimensions.get('window');
  const drawerWidth = Math.min(340, Math.round(screenW * 0.86));
  const slide = useRef(new Animated.Value(drawerWidth)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: drawerWidth,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, drawerWidth, fade, slide, mounted]);

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Animated.View
          pointerEvents={visible ? 'auto' : 'none'}
          style={{
            ...ABSOLUTE_FILL,
            backgroundColor: 'rgba(11, 31, 68, 0.45)',
            opacity: fade,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: drawerWidth,
            backgroundColor: '#FFFFFF',
            transform: [{ translateX: slide }],
            shadowColor: '#000',
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 20,
          }}
        >
          <SafeAreaView edges={['top', 'bottom', 'right']} style={{ flex: 1 }}>
            <View className="flex-row justify-end px-3 pt-2">
              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
              >
                <X color="#0B1F44" size={20} />
              </Pressable>
            </View>
            {children}
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function DrawerSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-2 mt-3">
      <Text className="px-5 pb-2 text-[10px] font-extrabold uppercase tracking-[2px] text-slate-400">
        {label}
      </Text>
      {children}
    </View>
  );
}

function DrawerRow({
  icon,
  label,
  value,
  badge,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  badge?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-5 py-3.5 active:bg-slate-50"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </View>
      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="text-[15px] font-bold text-[#0B1F44]">{label}</Text>
          {badge ? (
            <View className="ml-2 rounded-md bg-[#F5C400] px-1.5 py-0.5">
              <Text className="text-[9px] font-extrabold tracking-wider text-[#162C66]">
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
        {value ? (
          <Text className="mt-0.5 text-[12px] text-slate-500">{value}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ─── CenterModal ─────────────────────────────────────────
 * Centered overlay with fade + spring-scale entrance.
 * For short single-decision pickers (language, etc.).
 * ──────────────────────────────────────────────────────── */

function CenterModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 220,
          friction: 18,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.96,
          duration: 150,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, fade, scale, mounted]);

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(11, 31, 68, 0.45)',
          opacity: fade,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Pressable onPress={onClose} style={ABSOLUTE_FILL} />
        <Animated.View
          style={{
            width: '88%',
            maxWidth: 380,
            backgroundColor: '#FFFFFF',
            borderRadius: 20,
            overflow: 'hidden',
            transform: [{ scale }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.2,
            shadowRadius: 28,
            elevation: 14,
          }}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/* ─── Trust Marquee ──────────────────────────────────────
 * Continuous infinite-scroll of partner logos (like the web's CSS marquee).
 * Renders the logo list twice and animates translateX from 0 to -listWidth.
 * ──────────────────────────────────────────────────────── */

function TrustMarquee({ logos }: { logos: string[] }) {
  const items = logos.length > 0 ? logos : [null]; // null = fallback partner logo
  const duplicated = [...items, ...items]; // render twice for seamless loop
  const translateX = useRef(new Animated.Value(0)).current;
  const [listWidth, setListWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== listWidth) setListWidth(w);
  };

  useEffect(() => {
    if (listWidth <= 0) return;
    const halfWidth = listWidth / 2;
    // Speed: ~50px per second — feels natural, not too fast
    const duration = (halfWidth / 50) * 1000;
    translateX.setValue(0);
    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -halfWidth,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [listWidth, translateX]);

  return (
    <View style={{ overflow: 'hidden' }}>
      <Animated.View
        onLayout={onLayout}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          transform: [{ translateX }],
        }}
      >
        {duplicated.map((url, i) =>
          url ? (
            <Image
              key={i}
              source={{ uri: url }}
              style={{
                width: 130,
                height: 50,
                marginHorizontal: 22,
                opacity: 0.35,
              }}
              resizeMode="contain"
            />
          ) : (
            <Image
              key={i}
              source={FALLBACK_PARTNER_LOGO}
              style={{
                width: 130,
                height: 50,
                marginHorizontal: 22,
                opacity: 0.35,
              }}
              resizeMode="contain"
            />
          )
        )}
      </Animated.View>
    </View>
  );
}
