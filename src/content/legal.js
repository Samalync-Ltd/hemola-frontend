// Text of the three legal pages. The client supplies the legal text — it must
// not be written here by us. While `body` is empty the page shows only its
// heading and the "content will be added" note.
//
// `body.ar` / `body.en`: an array of paragraphs, e.g. ['First paragraph.', ...]
export const legalPages = {
    terms: {
        title: { ar: 'الشروط والأحكام', en: 'Terms and Conditions' },
        body: { ar: [], en: [] },
    },
    privacy: {
        title: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
        body: { ar: [], en: [] },
    },
    refund: {
        title: { ar: 'سياسة الاسترجاع', en: 'Refund Policy' },
        body: { ar: [], en: [] },
    },
};

/**
 * A legal page is published (route + footer link) only once its text exists
 * in both languages — the "content will be added" placeholder must never
 * reach production.
 */
export const isLegalPagePublished = (page) => {
    const body = legalPages[page]?.body;
    return Boolean(body && body.ar.length > 0 && body.en.length > 0);
};

export const legalPlaceholder = { ar: 'سيتم إضافة المحتوى', en: 'Content will be added' };
