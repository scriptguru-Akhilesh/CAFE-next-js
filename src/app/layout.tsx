import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AdminAuthProvider } from '../context/AdminAuthContext';

export const metadata: Metadata = {
  title: 'Simple QR Cafe Ordering - Corner Roastery',
  description:
    'Lightweight QR cafe ordering system with customer digital menu in INR, real-time kitchen display, owner dish catalog, and dynamic table creation with printable QR stands.',
  openGraph: {
    title: 'Simple QR Cafe Ordering - Corner Roastery',
    description:
      'Lightweight QR cafe ordering system with customer digital menu in INR, real-time kitchen display, owner dish catalog, and dynamic table creation with printable QR stands.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 antialiased selection:bg-amber-500 selection:text-stone-950">
        <ThemeProvider>
          <AdminAuthProvider>
            {children}
          </AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
