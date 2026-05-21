import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const SITE_URL = "https://hiredjo.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hired.jo — AI Career Copilot for Jordanian Graduates",
    template: "%s | Hired.jo",
  },
  description:
    "Build an ATS-ready CV in 5 minutes, match with real Jordan jobs from 10 boards, and learn what to study next. Free AI career copilot for Jordanian graduates.",
  applicationName: "Hired.jo",
  authors: [{ name: "Hired.jo" }],
  generator: "Next.js",
  keywords: [
    "jobs in jordan",
    "wazaif jordan",
    "cv builder jordan",
    "resume builder arabic",
    "graduate jobs amman",
    "akhtaboot",
    "bayt jordan",
    "wuzzuf jordan",
    "hired score",
    "ai career copilot",
    "ats cv",
    "jordanian graduate jobs",
    "وظيفة",
    "وظائف",
    "وظائف الاردن",
    "وظائف عمان",
    "وظائف للخريجين",
    "وظيفة الاردن",
    "وضائف الاردن",
    "وضيفة",
    "ابحث عن عمل",
    "فرص عمل الاردن",
    "سيرة ذاتية",
    "بناء سيرة ذاتية",
    "سيرة ذاتية احترافية",
    "وظائف عمان الاردن",
    "وظائف خريجين الاردن",
    "شغل الاردن",
    "فرص عمل عمان",
    "اخترنا",
    "وظائف تقنية الاردن",
    "وظائف برمجة الاردن",
    "وظائف تسويق الاردن",
    "وظائف هندسة الاردن",
    "وظائف بدون خبرة الاردن",
    "سيرة ذاتية عربي",
    "نموذج سيرة ذاتية",
    "سيرة ذاتية جاهزة",
    "كيف اكتب سيرة ذاتية",
    "رسالة تغطية",
    "رسالة تقديم وظيفة",
    "اختبوت",
    "بيت كوم الاردن",
    "وظفني الاردن",
    "منصة توظيف الاردن",
    "ذكاء اصطناعي وظائف",
  ],
  referrer: "origin-when-cross-origin",
  creator: "Hired.jo",
  publisher: "Hired.jo",
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Hired.jo",
    title: "Hired.jo — From graduate to hired.",
    description:
      "Build an ATS-ready CV in 5 minutes, match with real Jordan jobs, get your Hired Score. Free AI career copilot for Jordanian graduates.",
    images: [{ url: "/opengraph-image.jpg", width: 1280, height: 720, alt: "Hired.jo" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hired.jo — From graduate to hired.",
    description:
      "AI career copilot for Jordanian graduates. Build a CV, match with real jobs, get your Hired Score.",
    images: ["/opengraph-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0716",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#org`,
      name: "Hired.jo",
      url: SITE_URL,
      logo: `${SITE_URL}/opengraph-image.jpg`,
      description: "AI career copilot for Jordanian graduates.",
      areaServed: { "@type": "Country", name: "Jordan" },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "Hired.jo",
      publisher: { "@id": `${SITE_URL}#org` },
      inLanguage: "en",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/jobs?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}#app`,
      name: "Hired.jo",
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Build an ATS-ready CV in 5 minutes, match with real Jordan jobs from 10 boards, get your Hired Score, and learn what to study next.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "JOD" },
      featureList: [
        "AI CV builder",
        "Live job matching",
        "Hired Score",
        "Co-founder matching",
        "CV roast",
        "Cover letter generator",
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <meta name="msvalidate.01" content="96D2C728256F16B205F04A30247E2A8F" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col grain">{children}<Footer /></body>
    </html>
  );
}
