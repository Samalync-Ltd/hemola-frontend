import React from 'react';

// A run of Latin text inside an Arabic sentence ("App Store", "Google Play").
const LATIN_RUN = /([A-Za-z][A-Za-z0-9 .&'-]*[A-Za-z0-9])/g;

/**
 * Arabic text with the English names isolated in <span dir="ltr">, so the
 * browser's bidi algorithm can't mix their letters with the Arabic around
 * them. English text is returned as is.
 */
export const Bidi = ({ text, lang }) => {
    if (lang !== 'ar') return text;
    return text.split(LATIN_RUN).map((part, index) => (
        index % 2 === 1 ? <span key={index} dir="ltr">{part}</span> : part
    ));
};
