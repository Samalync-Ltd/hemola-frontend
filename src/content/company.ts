// Company details shown in the footer of the public pages.
//
// Leave a field empty until the client sends the real value — the footer
// hides every line whose value is empty. Never fill these in with guesses.
export interface Bilingual {
    ar: string;
    en: string;
}

export interface CompanyDetails {
    legalName: Bilingual;
    commercialRegistrationNumber: string;
    email: string;
    phone: string;
    address: Bilingual;
}

export const company: CompanyDetails = {
    legalName: { ar: '', en: '' },
    commercialRegistrationNumber: '',
    email: '',
    phone: '',
    address: { ar: '', en: '' },
};
