// Landing page text — exactly as written in docs/LANDING_PAGE.md §3. Do not
// reword or add claims here without the client's approval.
export const landing = {
    brand: { ar: 'حمولتك', en: 'Hemooltak' },
    hero: {
        title: {
            ar: 'حمولتك: منصة النقل التي تربط الشاحنين بالناقلين',
            en: 'Hemooltak: the platform that connects shippers and carriers',
        },
        subtitle: {
            ar: 'انشر شحنتك، استقبل عروض الناقلين، وتابعها خطوة بخطوة حتى التسليم.',
            en: 'Post your shipment, receive carrier offers, and follow it step by step until delivery.',
        },
    },
    signIn: { ar: 'تسجيل الدخول', en: 'Sign in' },
    createAccount: { ar: 'إنشاء حساب', en: 'Create account' },
    how: {
        title: { ar: 'كيف تعمل المنصة', en: 'How it works' },
        shippers: {
            title: { ar: 'للشاحنين', en: 'For shippers' },
            steps: [
                { ar: 'أنشئ شحنتك وحدد السعر المقترح', en: 'Create your shipment and set your proposed price' },
                { ar: 'استقبل عروض الناقلين وتفاوض معهم مباشرة', en: 'Receive carrier offers and negotiate directly' },
                { ar: 'تابع شحنتك على الخريطة حتى التسليم', en: 'Track your shipment on the map until delivery' },
            ],
        },
        carriers: {
            title: { ar: 'للناقلين', en: 'For carriers' },
            steps: [
                { ar: 'سجّل وارفع مستنداتك وبيانات شاحنتك', en: 'Register and upload your documents and truck details' },
                { ar: 'تصفّح الشحنات المناسبة وقدّم عرضك', en: 'Browse suitable shipments and submit your offer' },
                { ar: 'نفّذ الرحلة واستلم مستحقاتك في محفظتك', en: 'Complete the trip and receive your earnings in your wallet' },
            ],
        },
    },
    features: {
        title: { ar: 'لماذا حمولتك', en: 'Why Hemooltak' },
        items: [
            {
                title: { ar: 'تتبّع مباشر', en: 'Live tracking' },
                text: { ar: 'موقع الشاحنة على الخريطة أثناء الرحلة.', en: "See the truck's location on the map during the trip." },
            },
            {
                title: { ar: 'محفظة المنصة', en: 'Platform wallet' },
                text: { ar: 'يُحجز المبلغ عند الاتفاق ويُحرَّر عند التسليم.', en: 'The amount is held when the deal is agreed and released on delivery.' },
            },
            {
                title: { ar: 'حسابات موثّقة', en: 'Verified accounts' },
                text: { ar: 'تُراجع المستندات قبل تفعيل الحسابات.', en: 'Documents are reviewed before accounts are activated.' },
            },
            {
                title: { ar: 'إثبات التحميل والتسليم', en: 'Proof of loading and delivery' },
                text: { ar: 'صور موثّقة بالوقت والموقع في مرحلتي التحميل والتسليم.', en: 'Photos stamped with time and location at loading and delivery.' },
            },
            {
                title: { ar: 'تقييمات', en: 'Ratings' },
                text: { ar: 'تقييم بعد كل شحنة مكتملة.', en: 'A rating after every completed shipment.' },
            },
        ],
    },
    app: {
        title: { ar: 'حمّل التطبيق', en: 'Get the app' },
        // «و» is spaced from the English name: an Arabic letter cannot join a
        // Latin one, and without the space it reads as "Google Playg".
        text: {
            ar: 'قريباً على App Store و Google Play. الحساب الذي تنشئه على الموقع هو نفسه الذي تدخل به التطبيق.',
            en: 'Coming soon on the App Store and Google Play. The account you create on the website is the same one you use in the app.',
        },
        comingSoon: { ar: 'قريباً', en: 'Coming soon' },
    },
    faq: {
        title: { ar: 'أسئلة شائعة', en: 'FAQ' },
        items: [
            {
                q: { ar: 'هل التفاوض على السعر مزاد؟', en: 'Is price negotiation an auction?' },
                a: {
                    ar: 'لا. الشاحن يحدد سعراً مقترحاً، والناقل يقبله أو يقدّم عرضاً مختلفاً، ويتم الاتفاق مباشرة بين الطرفين.',
                    en: 'No. The shipper sets a proposed price. The carrier accepts it or sends a different offer, and the two sides agree directly.',
                },
            },
            {
                q: { ar: 'من يمكنه التسجيل كناقل؟', en: 'Who can register as a carrier?' },
                a: {
                    ar: 'أصحاب الشاحنات والسائقون وشركات النقل، بعد رفع المستندات المطلوبة ومراجعتها.',
                    en: 'Truck owners, drivers and transport companies, after uploading the required documents and having them reviewed.',
                },
            },
            {
                q: { ar: 'هل تتولى المنصة التخليص الجمركي؟', en: 'Does the platform handle customs clearance?' },
                a: { ar: 'لا. المنصة مخصصة للنقل والتوصيل فقط.', en: 'No. The platform is for transport and delivery only.' },
            },
            {
                q: { ar: 'متى يتوفر التطبيق؟', en: 'When will the app be available?' },
                a: { ar: 'قريباً على App Store و Google Play.', en: 'Coming soon on the App Store and Google Play.' },
            },
        ],
    },
    // Added with the design pass (team lead's request): the call-to-action
    // band before the footer, and the footer's column headings.
    cta: { title: { ar: 'ابدأ الآن', en: 'Get started' } },
    footer: {
        platform: { ar: 'المنصة', en: 'Platform' },
        legal: { ar: 'روابط قانونية', en: 'Legal' },
    },
    // Alt text for the real platform screenshots in the hero.
    screens: {
        shipments: { ar: 'قائمة الشحنات في منصة حمولتك', en: 'The shipments list on the Hemooltak platform' },
        tripMap: { ar: 'متابعة الرحلة على الخريطة في منصة حمولتك', en: 'Following a trip on the map on the Hemooltak platform' },
    },
};

/** Links to the landing page's sections (header on wide screens, and footer). */
export const sectionLinks = [
    { href: '/#how', label: landing.how.title },
    { href: '/#features', label: landing.features.title },
    { href: '/#app', label: landing.app.title },
    { href: '/#faq', label: landing.faq.title },
];

/** Footer links — the same names are the headings of the legal pages. */
export const legalLinks = [
    { page: 'terms', path: '/terms', label: { ar: 'الشروط والأحكام', en: 'Terms and Conditions' } },
    { page: 'privacy', path: '/privacy', label: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' } },
    { page: 'refund', path: '/refund', label: { ar: 'سياسة الاسترجاع', en: 'Refund Policy' } },
];

/** Labels for the footer's contact lines (the values live in company.ts). */
export const contactLabels = {
    title: { ar: 'تواصل معنا', en: 'Contact' },
    registration: { ar: 'السجل التجاري', en: 'Commercial registration' },
    email: { ar: 'البريد الإلكتروني', en: 'Email' },
    phone: { ar: 'الهاتف', en: 'Phone' },
    address: { ar: 'العنوان', en: 'Address' },
};
