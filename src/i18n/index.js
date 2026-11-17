import { Fragment, createElement, useMemo } from 'react';
import { getLanguage, useLanguage, useDocumentTitle } from './language';
import { strings } from './strings';

/**
 * Every word the platform shows lives in src/i18n/strings/, as an
 * { ar, en } pair under a key. Components never hold text of their own:
 *
 *     const { t } = useT();
 *     t('trips.status')                     // «حالة الرحلة» / "Trip status"
 *     t('common.money', { amount: '1,800' }) // «1,800 ر.س» / "1,800 SAR"
 *
 * `{name}` in a text is filled from the params. What users type (names,
 * notes, cities, reasons) is shown as they wrote it and never goes through
 * here.
 */
const lookup = (key) => key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), strings);

// In English, a value with Arabic in it (a city, a name, a reason someone
// typed) is wrapped in Unicode isolates, so it stays in its own place in the
// sentence: without them «الرياض → جدة» is reordered by the browser and reads
// backwards. Arabic text is left exactly as it was.
const ARABIC = /[\u0600-\u06FF]/;
const isolate = (value) => (typeof value === 'string' && ARABIC.test(value) ? `\u2068${value}\u2069` : value);

const fill = (text, params, lang) => (params
    ? text.replace(/\{(\w+)\}/g, (match, name) => {
        const value = params[name] ?? '';
        return lang === 'en' ? isolate(value) : value;
    })
    : text);

export const translate = (lang, key, params) => {
    const entry = lookup(key);
    if (!entry || typeof entry.ar !== 'string') {
        if (import.meta.env.DEV) console.warn(`[i18n] missing text: ${key}`);
        return key;
    }
    return fill(entry[lang] || entry.ar, params, lang);
};

/** Outside React (services, error messages, formatters): uses the current language. */
export const t = (key, params) => translate(getLanguage(), key, params);

/** Whether a key exists — for tables keyed by backend codes (a new code may arrive first). */
export const hasText = (key) => typeof lookup(key)?.ar === 'string';

/**
 * Like translate, but a param may be a React element (e.g. a bold amount):
 * returns the pieces to render, in order.
 */
export const translateRich = (lang, key, params = {}) => {
    const text = translate(lang, key);
    return text.split(/(\{\w+\})/g).filter(Boolean).map((part, index) => {
        const name = part.match(/^\{(\w+)\}$/)?.[1];
        return createElement(Fragment, { key: index }, name && name in params ? params[name] : part);
    });
};

/** In a component: `{ t, rich, lang }`, re-rendered when the language changes. */
export const useT = () => {
    const lang = useLanguage();
    return useMemo(() => ({
        lang,
        t: (key, params) => translate(lang, key, params),
        rich: (key, params) => translateRich(lang, key, params),
    }), [lang]);
};

/** The browser tab title for a page, from a text key. */
export const usePageTitle = (key) => {
    useDocumentTitle({ ar: translate('ar', key), en: translate('en', key) });
};
