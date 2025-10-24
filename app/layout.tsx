import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ChatGPT Pro Media App',
  description:
    'An enhanced ChatGPT-like app supporting image uploads, voice chat and a Firebase-inspired colourful UI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use a light background and dark text by default. Tailwind classes on the body
  // element make it easy to globally set the colour scheme for the app. The
  // Firebase console uses a light grey canvas with colourful accent bars, so
  // this layout reflects that aesthetic by defaulting to a light background.
  return (
    <html lang="en">
      {/* Set a neutral light background and dark text on the body. */}
      <body className="bg-gray-100 text-gray-800 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}