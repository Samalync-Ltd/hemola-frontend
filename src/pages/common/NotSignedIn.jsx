import React from 'react';
import { useT } from '../../i18n';

/** Shown by the role wrappers when no one is signed in (the app shell normally redirects first). */
export const NotSignedIn = () => {
    const { t } = useT();
    return <div>{t('layout.notSignedIn')}</div>;
};
