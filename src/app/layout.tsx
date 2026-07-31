import type { Metadata } from "next";

import "./globals.css";
import { HOT_ITEMS } from '@/enums';
import pkg from '#/package.json';

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME} - ${process.env.NEXT_PUBLIC_APP_DESC}`, // 网站标题
  description: process.env.NEXT_PUBLIC_APP_DESC, // 网站描述
  applicationName: pkg.name, // 应用名称
  authors: { name: process.env.NEXT_PUBLIC_COPYRIGHT || process.env.NEXT_PUBLIC_APP_NAME }, // 网站作者
  keywords: HOT_ITEMS.items.map(({ raw }) => `${raw.label}${raw.tip}`).join(','), // 网站关键词
  icons: {
    icon: '/icon0.svg',
    shortcut: '/icon0.svg',
    apple: '/apple-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: process.env.NEXT_PUBLIC_APP_NAME,
    description: process.env.NEXT_PUBLIC_APP_DESC,
    siteName: process.env.NEXT_PUBLIC_APP_NAME,
  },
  twitter: {
    card: 'summary',
    title: process.env.NEXT_PUBLIC_APP_NAME,
    description: process.env.NEXT_PUBLIC_APP_DESC,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <meta name="version" content={pkg.version} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              var theme = '${process.env.NEXT_PUBLIC_THEME === 'dark' ? 'dark' : 'light'}';
              var root = document.documentElement;
              root.classList.remove(theme === 'dark' ? 'light' : 'dark');
              root.classList.add(theme === 'light' ? 'light' : 'dark');
            } catch (_) {
              document.documentElement.classList.add('light');
            }
          `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
