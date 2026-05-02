import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FileText } from 'lucide-react-native';
import { useI18n } from '@/contexts/I18nContext';
import { api } from '@/lib/api';

type LegalType = 'agb' | 'privacy' | 'imprint';

const FIELD_KEY: Record<LegalType, string> = {
  agb: 'terms',
  privacy: 'privacy',
  imprint: 'impressum',
};

type CmsResponse = {
  ok: boolean;
  content?: { fieldKey: string; value: string }[];
};

export default function LegalScreen() {
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { t, locale } = useI18n();

  const legalType: LegalType = (type === 'privacy' || type === 'imprint'
    ? type
    : 'agb') as LegalType;

  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<CmsResponse>(`/api/cms/content/Legal?locale=${locale}`)
      .then((res) => {
        const item = res?.content?.find(
          (c) => c.fieldKey === FIELD_KEY[legalType]
        );
        setHtml(item?.value ?? '');
      })
      .catch(() => setHtml(''))
      .finally(() => setLoading(false));
  }, [locale, legalType]);

  const blocks = parseHtml(html);

  const title =
    legalType === 'agb'
      ? t('Mobile.legal.agb')
      : legalType === 'privacy'
        ? t('Mobile.legal.privacy')
        : t('Mobile.legal.imprint');

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="flex-row items-center px-4 pt-2">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
          >
            <ArrowLeft color="#0B1F44" size={22} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 80 }}
        >
          <View className="flex-row items-center mt-2 mb-5">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-[#162C66]/5">
              <FileText color="#162C66" size={20} />
            </View>
            <Text className="text-2xl font-extrabold text-[#0B1F44]">{title}</Text>
          </View>

          {loading ? (
            <View className="mt-10 items-center">
              <ActivityIndicator color="#162C66" />
            </View>
          ) : blocks.length === 0 ? (
            <Text className="mt-4 text-[14px] italic text-slate-400">
              {t('Mobile.common.empty')}
            </Text>
          ) : (
            <View>
              {blocks.map((b, idx) => (
                <Block key={idx} block={b} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* ─── Tiny HTML renderer ──────────────────────────────────
 * Handles the tags the CMS legal editor typically emits:
 * <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <a>, <br>.
 * ───────────────────────────────────────────────────────── */

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'li'; text: string; ordered: boolean; index: number };

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripInline(s: string): string {
  // Replace <br> with newline, then strip remaining inline tags
  return decode(
    s
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(strong|b|em|i|span|a|u)[^>]*>/gi, '')
  ).trim();
}

function parseHtml(html: string): Block[] {
  if (!html) return [];

  const blocks: Block[] = [];
  // Normalize whitespace
  const normalized = html.replace(/\r/g, '').replace(/\s+\n/g, '\n');

  // Walk through top-level tags
  const blockRegex =
    /<(h2|h3|p|ul|ol)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = blockRegex.exec(normalized)) !== null) {
    // Capture any text between blocks as paragraph
    if (m.index > lastIndex) {
      const between = stripInline(normalized.slice(lastIndex, m.index));
      if (between) blocks.push({ kind: 'p', text: between });
    }

    const tag = m[1].toLowerCase();
    const inner = m[3];

    if (tag === 'h2') {
      blocks.push({ kind: 'h2', text: stripInline(inner) });
    } else if (tag === 'h3') {
      blocks.push({ kind: 'h3', text: stripInline(inner) });
    } else if (tag === 'p') {
      const text = stripInline(inner);
      if (text) blocks.push({ kind: 'p', text });
    } else if (tag === 'ul' || tag === 'ol') {
      const ordered = tag === 'ol';
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let li: RegExpExecArray | null;
      let i = 0;
      while ((li = liRegex.exec(inner)) !== null) {
        const text = stripInline(li[1]);
        if (text) {
          i += 1;
          blocks.push({ kind: 'li', text, ordered, index: i });
        }
      }
    }

    lastIndex = m.index + m[0].length;
  }

  // Trailing content
  if (lastIndex < normalized.length) {
    const tail = stripInline(normalized.slice(lastIndex));
    if (tail) blocks.push({ kind: 'p', text: tail });
  }

  // If nothing parsed (CMS returned plain text), treat whole thing as paragraph
  if (blocks.length === 0) {
    const plain = stripInline(normalized);
    if (plain) blocks.push({ kind: 'p', text: plain });
  }

  return blocks;
}

function Block({ block }: { block: Block }) {
  if (block.kind === 'h2') {
    return (
      <Text className="mt-6 mb-3 text-xl font-extrabold text-[#162C66]">
        {block.text}
      </Text>
    );
  }
  if (block.kind === 'h3') {
    return (
      <Text className="mt-5 mb-2 text-base font-bold text-[#162C66]">
        {block.text}
      </Text>
    );
  }
  if (block.kind === 'li') {
    return (
      <View className="mb-1.5 flex-row pl-2">
        <Text className="mr-2 text-[14px] leading-relaxed text-slate-600">
          {block.ordered ? `${block.index}.` : '•'}
        </Text>
        <Text className="flex-1 text-[14px] leading-relaxed text-slate-600">
          {block.text}
        </Text>
      </View>
    );
  }
  return (
    <Text className="mb-3 text-[14px] leading-relaxed text-slate-600">
      {block.text}
    </Text>
  );
}
