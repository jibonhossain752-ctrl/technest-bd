import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'
import './globals.css'
import { CartProvider } from '@/context/CartProvider'
import { AuthProvider } from '@/context/AuthProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import MobileBottomNav from '@/components/MobileBottomNav'
import Toast from '@/components/Toast'
import ScrollToTop from '@/components/ScrollToTop'
import AnalyticsBootstrap from '@/components/AnalyticsBootstrap'
import { META_PIXEL_ID } from '@/lib/meta-pixel'

export const metadata: Metadata = {
  metadataBase: new URL('https://gadgeterea.com'),
  title: {
    default: 'GadgetErea | Your Trusted Tech Store in the USA',
    template: '%s | GadgetErea',
  },
  description:
    'GadgetErea - Shop the latest gadgets, laptops, and accessories in the USA. Genuine products, fast delivery, best prices.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'GadgetErea',
    locale: 'en_US',
    url: 'https://gadgeterea.com',
    title: 'GadgetErea | Your Trusted Tech Store in the USA',
    description:
      'GadgetErea - Shop the latest gadgets, laptops, and accessories in the USA. Genuine products, fast delivery, best prices.',
    images: [
      {
        url: '/images/blog/best-tech-gifts-under-50.jpg',
        width: 1200,
        height: 675,
        alt: 'GadgetErea - trending gadgets and the best Amazon finds',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GadgetErea | Your Trusted Tech Store in the USA',
    description:
      'GadgetErea - Shop the latest gadgets, laptops, and accessories in the USA. Genuine products, fast delivery, best prices.',
    images: ['/images/blog/best-tech-gifts-under-50.jpg'],
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <ScrollToTop />
            <main>{children}</main>
            <Footer />
            <MobileBottomNav />
            <Toast />
            <AnalyticsBootstrap />
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META_PIXEL_ID}');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                alt=""
                src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              />
            </noscript>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
