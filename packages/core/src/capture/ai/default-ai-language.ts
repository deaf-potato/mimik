import { i18n } from '@/core/env';
import type { AILanguageCode } from './prompts';

export function defaultAiLanguage(): AILanguageCode {
  try {
    return i18n.t('meta.locale')?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
  } catch {
    return 'en';
  }
}
