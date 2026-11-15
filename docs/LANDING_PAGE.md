# Task: Landing Page (Arabic / English)

Put this file in the web repo at docs/LANDING_PAGE.md. Read all of it before you start.

## 1. Why

Today, a visitor who opens the website goes straight to login. The client wants a public home page that explains the platform, so that:

- visitors understand what Hemooltak is before they register,
- the payment gateway reviewers can see what the business is,
- the client can share the link in marketing.

The page must work in Arabic and English. Arabic is the default.

## 2. What to build

A public page at / (the home page). It is for visitors who are not logged in.

- If the user is already logged in, / must send him to his dashboard, exactly like today. Do not break this.
- Sign in / Create account buttons go to the existing auth pages. Do not change the auth pages.
- Do not break any existing route or deep link (notification links, trip links, admin).

### Language switch

- A button in the top bar: AR | EN.
- Default is Arabic. Save the choice in localStorage (wrap in try/catch).
- Arabic = dir="rtl" and lang="ar". English = dir="ltr" and lang="en". Set both on the <html> tag.
- First, check how the platform already handles Arabic and RTL today. Reuse it. Do not add a second system. If the platform has no language system, add the smallest one that works, and tell me in your report.

### Look

- Colors: navy #0F2440, amber #FF7A29, light gray #F4F5F7, white #FFFFFF.
- Fonts: Cairo Bold for Arabic, Poppins Bold for English headings.
- Use the logo that is already in the project. Do not draw a new one. If the logo shows the old spelling "Hemola", keep it and tell me.
- Mobile first. Most drivers will open this from a phone. It must look good at 360px width.
- Keep it light: no heavy images, no animation libraries.

### Sections, in this order

A. Top bar: logo, AR | EN switch, "Sign in" button, "Create account" button.

B. Pre-launch banner (shown only when VITE_PRELAUNCH=true, see section 4).

C. Hero: title, subtitle, two buttons (Sign in, Create account).

D. How it works: two columns (stacked on mobile): "For shippers" and "For carriers", 3 steps each.

E. Features: 5 small cards.

F. App section: "Download the app". Two store badges. See section 4.

G. FAQ: 4 questions, open and close on tap.

H. Footer: links to Terms, Privacy, Refund pages. Contact details. Copyright.

## 3. Text (use exactly this)

Do not change the wording and do not add claims of your own. If you think something is wrong, tell me.

| Place | Arabic | English |
|---|---|---|
| Hero title | حمولتك: منصة النقل التي تربط الشاحنين بالناقلين | Hemooltak: the platform that connects shippers and carriers |
| Hero subtitle | انشر شحنتك، استقبل عروض الناقلين، وتابعها خطوة بخطوة حتى التسليم. | Post your shipment, receive carrier offers, and follow it step by step until delivery. |
| Button 1 | تسجيل الدخول | Sign in |
| Button 2 | إنشاء حساب | Create account |
| Pre-launch banner | التسجيل مفتوح حالياً للناقلين. استقبال الشحنات قريباً. | Registration is open for carriers now. Shipment posting is coming soon. |
| How it works title | كيف تعمل المنصة | How it works |
| Shipper column title | للشاحنين | For shippers |
| Shipper step 1 | أنشئ شحنتك وحدد السعر المقترح | Create your shipment and set your proposed price |
| Shipper step 2 | استقبل عروض الناقلين وتفاوض معهم مباشرة | Receive carrier offers and negotiate directly |
| Shipper step 3 | تابع شحنتك على الخريطة حتى التسليم | Track your shipment on the map until delivery |
| Carrier column title | للناقلين | For carriers |
| Carrier step 1 | سجّل وارفع مستنداتك وبيانات شاحنتك | Register and upload your documents and truck details |
| Carrier step 2 | تصفّح الشحنات المناسبة وقدّم عرضك | Browse suitable shipments and submit your offer |
| Carrier step 3 | نفّذ الرحلة واستلم مستحقاتك في محفظتك | Complete the trip and receive your earnings in your wallet |
| Features title | لماذا حمولتك | Why Hemooltak |
| Feature 1 title / text | تتبّع مباشر / موقع الشاحنة على الخريطة أثناء الرحلة. | Live tracking / See the truck's location on the map during the trip. |
| Feature 2 title / text | محفظة المنصة / يُحجز المبلغ عند الاتفاق ويُحرَّر عند التسليم. | Platform wallet / The amount is held when the deal is agreed and released on delivery. |
| Feature 3 title / text | حسابات موثّقة / تُراجع المستندات قبل تفعيل الحسابات. | Verified accounts / Documents are reviewed before accounts are activated. |
| Feature 4 title / text | إثبات التحميل والتسليم / صور موثّقة بالوقت والموقع في مرحلتي التحميل والتسليم. | Proof of loading and delivery / Photos stamped with time and location at loading and delivery. |
| Feature 5 title / text | تقييمات / تقييم بعد كل شحنة مكتملة. | Ratings / A rating after every completed shipment. |
| App section title | حمّل التطبيق | Get the app |
| App section text | قريباً على App Store وGoogle Play. الحساب الذي تنشئه على الموقع هو نفسه الذي تدخل به التطبيق. | Coming soon on the App Store and Google Play. The account you create on the website is the same one you use in the app. |
| FAQ title | أسئلة شائعة | FAQ |
| FAQ 1 question | هل التفاوض على السعر مزاد؟ | Is price negotiation an auction? |
| FAQ 1 answer | لا. الشاحن يحدد سعراً مقترحاً، والناقل يقبله أو يقدّم عرضاً مختلفاً، ويتم الاتفاق مباشرة بين الطرفين. | No. The shipper sets a proposed price. The carrier accepts it or sends a different offer, and the two sides agree directly. |
| FAQ 2 question | من يمكنه التسجيل كناقل؟ | Who can register as a carrier? |
| FAQ 2 answer | أصحاب الشاحنات والسائقون وشركات النقل، بعد رفع المستندات المطلوبة ومراجعتها. | Truck owners, drivers and transport companies, after uploading the required documents and having them reviewed. |
| FAQ 3 question | هل تتولى المنصة التخليص الجمركي؟ | Does the platform handle customs clearance? |
| FAQ 3 answer | لا. المنصة مخصصة للنقل والتوصيل فقط. | No. The platform is for transport and delivery only. |
| FAQ 4 question | متى يتوفر التطبيق؟ | When will the app be available? |
| FAQ 4 answer | قريباً على App Store وGoogle Play. | Coming soon on the App Store and Google Play. |
| Footer links | الشروط والأحكام / سياسة الخصوصية / سياسة الاسترجاع | Terms and Conditions / Privacy Policy / Refund Policy |

## 4. Rules for the special parts

### Pre-launch banner and buttons

- Add one env variable: VITE_PRELAUNCH.
- When true: show the banner (section B).
- When false or missing: hide the banner.
- This task does not change who can register or log in. That is a separate task that I will send later. Only the banner is controlled here.

### App store badges

- Add two env variables: VITE_APP_STORE_URL and VITE_PLAY_STORE_URL.
- If a variable is empty or missing: show that badge as disabled, with the label "قريباً" / "Coming soon". It must not be a link.
- If it has a value: the badge opens that URL in a new tab.
- Do not put fake links. Do not copy Apple or Google logos from random websites. Use simple text badges unless the official badge files are already in the project.

### Company details and contact

- Create one file: src/content/company.ts with these fields, in both languages where needed: legalName, commercialRegistrationNumber, email, phone, address.
- I will send you the real values. Do not invent any of them. Until you get them, leave the fields empty and hide any line whose value is empty.
- Show them in the footer.

### Legal pages

- Create three public routes: /terms, /privacy, /refund. The footer links go to them.
- Each page reads its text from a content file (Arabic and English), and has the language switch.
- I will send you the legal text. Do not write legal text yourself. Until then, build the pages with the heading only and the text "Content will be added".
- Do not deploy these pages to production with that placeholder text.

### SEO and sharing

- Page title and meta description, in both languages (use the hero title and subtitle).
- Open Graph tags (og:title, og:description, og:image = the logo) so the link looks good when it is shared on WhatsApp.
- Correct lang and dir on <html>.

### Cloudflare refresh check

The site is hosted on Cloudflare Pages. Pages already serves a single-page app correctly if the project has no top-level 404.html file. So first test it: open /terms, press refresh, it must still work.

- If it works, do nothing.
- If you get 404, check that there is no 404.html in the build output. Remove it if it exists.
- Do not add a _redirects file with /* /index.html 200. Cloudflare reports it as an infinite loop.
- If it still fails, stop and tell me.

## 5. Out of scope. Do not build any of these.

- No backend or Firebase changes.
- No changes to login, register, or the admin dashboard.
- No blocking of shippers or carriers (that is the later pre-launch task).
- No pricing page, blog, contact form, chat widget, or analytics.
- No changes to the mobile app.
- No new libraries unless you really need one. If you do, tell me why.

## 6. When you are done

You are done when all of this works:

1. / shows the landing page for a logged-out visitor, in Arabic by default.
2. The AR | EN switch changes all text and the direction (RTL/LTR), and the choice is remembered after refresh.
3. A logged-in user opening / still goes to his dashboard.
4. Sign in and Create account go to the existing pages and work.
5. Looks correct at 360px (phone) and on desktop, in both languages.
6. VITE_PRELAUNCH=true shows the banner, false hides it.
7. Store badges are disabled when the URLs are empty.
8. Footer links open /terms, /privacy, /refund, and refresh on them does not give 404 (on the Cloudflare preview).
9. Footer hides any contact line that has no value.

How to report: push to a branch (not main). Send me the Cloudflare preview link in Slack. I will review it myself. Do not merge to production until I say so.

## 7. If something is unclear

Stop and ask me. Do not guess. This is especially important for: how the platform handles languages today, the logo files, and anything about company data or legal text.
