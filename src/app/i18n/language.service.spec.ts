import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectPreferredLanguage } from './language.service';

describe('detectPreferredLanguage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses the language explicitly saved by the visitor', () => {
    localStorage.setItem('singletone-language', 'ko');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US']);

    expect(detectPreferredLanguage()).toBe('ko');
  });

  it('detects Korean from any browser language when no preference was saved', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US', 'ko-KR']);

    expect(detectPreferredLanguage()).toBe('ko');
  });

  it('defaults to English for non-Korean browser languages', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR', 'en-US']);

    expect(detectPreferredLanguage()).toBe('en');
  });
});
