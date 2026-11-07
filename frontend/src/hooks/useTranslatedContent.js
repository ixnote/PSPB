import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const cache = new Map();

function cacheKey(text, lang) {
  return `${lang}:${text}`;
}

export function useTranslatedContent(texts, options = {}) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const { enabled = true } = options;
  const [translated, setTranslated] = useState(texts);
  const prevTextsRef = useRef(null);
  const prevLangRef = useRef(null);

  useEffect(() => {
    if (!enabled || lang === 'en' || !texts || texts.length === 0) {
      setTranslated(texts);
      return;
    }

    const textsKey = JSON.stringify(texts);
    if (textsKey === JSON.stringify(prevTextsRef.current) && lang === prevLangRef.current) {
      return;
    }
    prevTextsRef.current = texts;
    prevLangRef.current = lang;

    const allCached = texts.every((t) => !t || cache.has(cacheKey(t, lang)));
    if (allCached) {
      setTranslated(texts.map((t) => (t ? cache.get(cacheKey(t, lang)) || t : t)));
      return;
    }

    const uncachedTexts = texts.filter((t) => t && !cache.has(cacheKey(t, lang)));
    if (uncachedTexts.length === 0) {
      setTranslated(texts.map((t) => (t ? cache.get(cacheKey(t, lang)) || t : t)));
      return;
    }

    let cancelled = false;

    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: uncachedTexts, targetLang: lang }),
    })
      .then((r) => (r.ok ? r.json() : { translations: uncachedTexts }))
      .then((data) => {
        if (cancelled) return;
        const results = data.translations || uncachedTexts;
        uncachedTexts.forEach((original, i) => {
          cache.set(cacheKey(original, lang), results[i]);
        });
        setTranslated(texts.map((t) => (t ? cache.get(cacheKey(t, lang)) || t : t)));
      })
      .catch(() => {
        if (!cancelled) setTranslated(texts);
      });

    return () => { cancelled = true; };
  }, [texts, lang, enabled]);

  return translated;
}

export function useTranslatedField(text) {
  const result = useTranslatedContent(text ? [text] : [], { enabled: !!text });
  return result[0] || text;
}
