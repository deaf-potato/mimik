import { describe, expect, it } from 'vitest';
import { appLocale } from '../app-locale';

describe('appLocale', () => {
  it('takes the language picked in settings', () => {
    expect(appLocale('pl', 'en-US')).toBe('pl');
  });

  it('follows the system when nothing or an unknown language is picked', () => {
    expect(appLocale(null, 'pl-PL')).toBe('pl');
    expect(appLocale('system', 'pl')).toBe('pl');
    expect(appLocale(undefined, 'en-GB')).toBe('en');
  });

  it('falls back to English for a language Mimik does not ship', () => {
    expect(appLocale(null, 'ja-JP')).toBe('en');
  });
});
