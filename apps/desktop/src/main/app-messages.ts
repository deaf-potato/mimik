import type { Messages } from '@mimik/core/i18n/translate';
import en from '@mimik/locales/en.yml';
import pl from '@mimik/locales/pl.yml';
import type { AppLocale } from './app-locale';

export const APP_MESSAGES: Record<AppLocale, Messages> = {
  en: en as Messages,
  pl: pl as Messages,
};
