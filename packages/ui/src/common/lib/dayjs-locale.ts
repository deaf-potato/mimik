import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/pl';
import { i18n } from '@mimik/core/env';

dayjs.extend(relativeTime);

const DAYJS_LOCALE_MAP: Record<string, string> = {
  pl: 'pl',
};

export function getDayjsLocale(): string | undefined {
  try {
    const locale = i18n.t('meta.locale');
    if (locale && DAYJS_LOCALE_MAP[locale]) return DAYJS_LOCALE_MAP[locale];
    const key = locale?.split(/[-_]/)[0]?.toLowerCase();
    if (key && DAYJS_LOCALE_MAP[key]) return DAYJS_LOCALE_MAP[key];
  } catch {}
  return undefined;
}
