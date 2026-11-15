import { useEffect, useSyncExternalStore } from 'react';

/**
 * The smallest language system that works. The platform itself is Arabic
 * only (index.html is lang="ar" dir="rtl"), so this exists just for the
 * public pages — the landing page and the legal pages. Everything inside
 * the app keeps its Arabic / RTL behaviour untouched.
 */
const STORAGE_KEY = 'hemooltak-lang';

const readStored = () => {
    try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
};

let current = readStored();
const listeners = new Set();

export const setLanguage = (lang) => {
    current = lang === 'en' ? 'en' : 'ar';
    try { localStorage.setItem(STORAGE_KEY, current); } catch { /* private mode: the choice just isn't remembered */ }
    listeners.forEach((listener) => listener());
};

const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

/** 'ar' (default) or 'en'. */
export const useLanguage = () => useSyncExternalStore(subscribe, () => current, () => 'ar');

const applyToHtml = (lang) => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

/**
 * For a public page: puts the chosen language and direction on <html> while
 * the page is shown, and sets the tab title and meta description in that
 * language. Leaving the page restores the app's Arabic / RTL defaults.
 */
export const usePublicPage = ({ title, description }) => {
    const lang = useLanguage();
    const pageTitle = title[lang];
    const pageDescription = description ? description[lang] : null;

    useEffect(() => {
        applyToHtml(lang);
        const previousTitle = document.title;
        const meta = document.querySelector('meta[name="description"]');
        const previousDescription = meta?.getAttribute('content');
        document.title = pageTitle;
        if (meta && pageDescription) meta.setAttribute('content', pageDescription);
        return () => {
            applyToHtml('ar');
            document.title = previousTitle;
            if (meta && previousDescription != null) meta.setAttribute('content', previousDescription);
        };
    }, [lang, pageTitle, pageDescription]);

    return lang;
};
