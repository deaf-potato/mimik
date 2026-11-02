import { describe, expect, it } from 'vitest';
import { AI_LANGUAGES, GUIDE_META_PROMPT, getLanguageSuffix } from '../prompts';

describe('GUIDE_META_PROMPT', () => {
  it('has a steps placeholder', () => {
    expect(GUIDE_META_PROMPT).toContain('{{steps}}');
  });

  it('keeps the 60-character title constraint', () => {
    expect(GUIDE_META_PROMPT).toContain('60 characters');
  });

  it('asks for a description of one or two sentences', () => {
    expect(GUIDE_META_PROMPT.toLowerCase()).toContain('description');
    expect(GUIDE_META_PROMPT).toMatch(/one or two sentences/i);
  });
});

describe('getLanguageSuffix', () => {
  it('returns empty string for English', () => {
    expect(getLanguageSuffix('en')).toBe('');
  });

  it('returns empty string for en-US', () => {
    expect(getLanguageSuffix('en-US')).toBe('');
  });

  it('writes the Polish instruction in Polish', () => {
    expect(getLanguageSuffix('pl')).toContain('po polsku');
  });

  it('matches a regional locale to its base language', () => {
    expect(getLanguageSuffix('pl-PL')).toBe(getLanguageSuffix('pl'));
  });

  it('falls back to the English instruction and the locale code for unknown languages', () => {
    const suffix = getLanguageSuffix('sv');
    expect(suffix).toContain('sv');
    expect(suffix).toContain('Write the output in');
  });

  it('writes every offered language its own instruction, never the English fallback', () => {
    for (const { code } of AI_LANGUAGES) {
      if (code === 'en') continue;
      expect(getLanguageSuffix(code)).not.toContain('Write the output in');
    }
  });

  it('tells every language to leave UI labels alone', () => {
    expect(getLanguageSuffix('pl')).toContain('Nie tłumacz');
    expect(getLanguageSuffix('sv')).toContain('Never translate');
  });
});

describe('AI_LANGUAGES', () => {
  it('has 2 supported languages', () => {
    expect(AI_LANGUAGES).toHaveLength(2);
  });

  it('includes English as first entry', () => {
    expect(AI_LANGUAGES[0]).toEqual({ code: 'en', label: 'English' });
  });

  it('includes Polish', () => {
    expect(AI_LANGUAGES).toContainEqual({ code: 'pl', label: 'Polski' });
  });

  it('each entry has code and label', () => {
    for (const lang of AI_LANGUAGES) {
      expect(lang.code).toBeTruthy();
      expect(lang.label).toBeTruthy();
    }
  });
});
