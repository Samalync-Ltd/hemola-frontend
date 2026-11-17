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

export const legalPlaceholder = { ar: 'سيتم إضافة المحتوى', en: 'Content will be added' };
