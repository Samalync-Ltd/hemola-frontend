import { useEffect, useSyncExternalStore } from 'react';

/**
 * The site's language: Arabic (default, right-to-left) or English
 * (left-to-right). One choice for the whole website — the landing page, the
 * legal pages, sign-in and the platform itself — saved in this browser, so
 * the next visit opens in the same language.
 *
 * <html lang/dir> always follows the choice, so the layout (which uses
 * logical CSS properties: inline-start/end, not left/right) flips with it.
 */
const STORAGE_KEY = 'hemooltak-lang';

const readStored = () => {
    try { return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar'; } catch { return 'ar'; }
};

let current = readStored();
const listeners = new Set();

const applyToHtml = (lang) => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
};

// Before the first render, so an English visitor never sees an RTL flash.
applyToHtml(current);

/** The current language, outside React (services, error messages, formatters). */
export const getLanguage = () => current;

export const setLanguage = (lang) => {
    const next = lang === 'en' ? 'en' : 'ar';
    if (next === current) return;
    current = next;
    try { localStorage.setItem(STORAGE_KEY, current); } catch { /* private mode: the choice just isn't remembered */ }
    applyToHtml(current);
    listeners.forEach((listener) => listener());
};

const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

/** 'ar' (default) or 'en'; re-renders the component when it changes. */
export const useLanguage = () => useSyncExternalStore(subscribe, () => current, () => 'ar');

/**
 * Sets the browser tab title (and, when given, the meta description) in the
 * current language while the page is shown, and puts the previous ones back
 * when it is left. `title`/`description` are { ar, en } pairs.
 */
export const useDocumentTitle = (title, description) => {
    const lang = useLanguage();
    const pageTitle = title?.[lang];
    const pageDescription = description ? description[lang] : null;

    useEffect(() => {
        if (!pageTitle) return undefined;
        const previousTitle = document.title;
        const meta = document.querySelector('meta[name="description"]');
        const previousDescription = meta?.getAttribute('content');
        document.title = pageTitle;
        if (meta && pageDescription) meta.setAttribute('content', pageDescription);
        return () => {
            document.title = previousTitle;
            if (meta && previousDescription != null) meta.setAttribute('content', previousDescription);
        };
    }, [pageTitle, pageDescription]);

    return lang;
};

/** For a public page (landing, legal): its title and description, and the language. */
export const usePublicPage = ({ title, description }) => useDocumentTitle(title, description);
