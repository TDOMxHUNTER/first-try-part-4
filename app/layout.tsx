import type { Metadata } from "next";
import "./globals.css";
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "Monad Profile Card",
  description: "Create and customize your Monad profile card",
  icons: {
    icon: '/monad_logo.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/monad_logo.ico" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}