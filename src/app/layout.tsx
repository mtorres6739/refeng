import { Metadata } from 'next';
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster";
import Providers from '@/components/Providers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Referral Engine',
  description: 'Manage and track your referral program',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          httpEquiv="Content-Security-Policy"
          content="frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://fast.wistia.net https://www.loom.com"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
