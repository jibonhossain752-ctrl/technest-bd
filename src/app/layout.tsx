import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { CartProvider } from '@/context/CartProvider'
import { AuthProvider } from '@/context/AuthProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'
import ScrollToTop from '@/components/ScrollToTop'

export const metadata: Metadata = {
  title: {
    default: 'TechNest US | Your Trusted Tech Store in the USA',
    template: '%s | TechNest US',
  },
  description:
    'TechNest US - Shop the latest gadgets, laptops, and accessories in the USA. Genuine products, fast delivery, best prices.',
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
            <Toast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
