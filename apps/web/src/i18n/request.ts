import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';
 
export default getRequestConfig(async ({requestLocale}) => {
  // This should typically correspond to the `[locale]` segment
  let locale = await requestLocale;

  type AppLocale = (typeof routing.locales)[number];
  const isAppLocale = (value: string): value is AppLocale =>
    (routing.locales as readonly string[]).includes(value);
 
  // Ensure that a valid locale is used
  if (!locale || !isAppLocale(locale)) {
    locale = routing.defaultLocale;
  }
 
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
