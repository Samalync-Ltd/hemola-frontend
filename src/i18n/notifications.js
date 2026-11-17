import { translate, hasText } from '.';
import { TripStage } from '../constants/enums';

/**
 * A notification in the user's language.
 *
 * The backend stores each notification with its text already written in
 * Arabic (users/{uid}/notifications: type, title, body — INTEGRATION.md
 * §17.2), from fixed templates (functions/src/notificationText.ts). Arabic
 * shows that text exactly. English is rebuilt from the `type`: the values in
 * the Arabic text (an amount, a trip stage, a quick message) are read back
 * out by matching it against the same template, then put into the English
 * one. If the text doesn't match (an older template), a version without the
 * value is shown. What an admin typed — a broadcast, a rejection reason — is
 * shown as written.
 */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Reads the {placeholders} of an Arabic template back out of a rendered text. */
const readValues = (template, text) => {
    const names = [];
    const pattern = template.split(/(\{\w+\})/).map((part) => {
        const name = part.match(/^\{(\w+)\}$/)?.[1];
        if (!name) return escapeRegExp(part);
        names.push(name);
        return '(.+?)';
    }).join('');
    const match = (text || '').trim().match(new RegExp(`^${pattern}$`, 's'));
    return match ? Object.fromEntries(names.map((name, index) => [name, match[index + 1].trim()])) : null;
};

/** The key whose Arabic is exactly `text`, among `keys` under `prefix`. */
const keyWithArabic = (prefix, keys, text) =>
    keys.find((key) => translate('ar', `${prefix}.${key}`) === (text || '').trim()) ?? null;

const QUICK_MESSAGE_KEYS = [
    'EN_ROUTE_TO_PICKUP', 'ARRIVED_AT_PICKUP', 'LOADING_STARTED', 'LOCATION_UNCLEAR', 'RUNNING_LATE', 'NO_ONE_AT_SITE', 'ARRIVED_AT_DELIVERY',
    'GOODS_READY', 'SITE_OPEN', 'SITE_CONTACT_READY', 'CALL_SITE_CONTACT', 'PLEASE_WAIT', 'LOCATION_IN_DETAILS', 'RECEIVED',
];

const englishBody = (type, body) => {
    const base = `notifications.types.${type}`;
    const plain = hasText(`${base}.bodyPlain`) ? translate('en', `${base}.bodyPlain`) : '';
    if (type === 'TRIP_STAGE_CHANGED') {
        const stage = keyWithArabic('notifications.stage', Object.values(TripStage), body);
        return stage ? translate('en', `notifications.stage.${stage}`) : plain;
    }
    if (type === 'QUICK_MESSAGE') {
        const key = keyWithArabic('trips.quick', QUICK_MESSAGE_KEYS, body);
        return key ? translate('en', `trips.quick.${key}`) : plain;
    }
    const template = translate('ar', `${base}.body`);
    if (!template.includes('{')) return translate('en', `${base}.body`);
    const values = readValues(template, body);
    return values ? translate('en', `${base}.body`, values) : plain;
};

/** `{ title, message }` to show for one notification (as shaped by notificationService). */
export const localizeNotification = (notification, lang) => {
    const { type, title, message } = notification;
    if (lang === 'ar' || type === 'ADMIN_BROADCAST' || !hasText(`notifications.types.${type}.title`)) {
        return { title, message };
    }
    return { title: translate('en', `notifications.types.${type}.title`), message: englishBody(type, message) };
};
