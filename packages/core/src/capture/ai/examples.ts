import { resolveByLocale } from './locale';
import type { AILanguageCode } from './prompts';

export interface PromptExamples {
  readonly steps: readonly string[];
  readonly titles: readonly string[];
  readonly descriptions: readonly string[];
}

const EXAMPLES: Record<AILanguageCode, PromptExamples> = {
  en: {
    steps: [
      'Click the Submit button',
      'Enter email address in the Email field',
      'Select "Admin" from the Role dropdown',
      'Navigate to the Settings page',
    ],
    titles: [
      'Review web-app Pull Requests',
      'Configure Slack Notification Preferences',
      'Submit Expense Report in Workday',
      'Create Repository in GitHub Organization',
    ],
    descriptions: [
      "Reset a locked-out user's password from the Okta admin panel. For IT support staff.",
      'Configure which Slack channels send desktop notifications, and set a do-not-disturb schedule.',
    ],
  },
  pl: {
    steps: [
      'Kliknąć przycisk Submit',
      'Wpisać adres email w polu Email',
      'Wybrać "Admin" z listy Role',
      'Przejść na stronę Settings',
    ],
    titles: [
      'Przegląd Pull Requestów w web-app',
      'Konfiguracja powiadomień Slack',
      'Wysłanie raportu wydatków w Workday',
      'Utworzenie repozytorium w organizacji GitHub',
    ],
    descriptions: [
      'Reset hasła zablokowanego użytkownika w panelu administracyjnym Okta. Dla działu wsparcia IT.',
      'Wybór kanałów Slack wysyłających powiadomienia na pulpit i ustawienie harmonogramu trybu Nie przeszkadzać.',
    ],
  },
};

export function resolveExamples(locale: string): PromptExamples {
  return resolveByLocale(EXAMPLES, locale) ?? EXAMPLES.en;
}

export function formatExamples(lines: readonly string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}
