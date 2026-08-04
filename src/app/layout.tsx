import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { CartProvider } from '@/context/CartProvider'
import { AuthProvider } from '@/context/AuthProvider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Toast from '@/components/Toast'

export const metadata: Metadata = {
  title: {
    default: 'TechNest BD | Your Trusted Tech Store in Bangladesh',
    template: '%s | TechNest BD',
  },
  description:
    'TechNest BD - Shop the latest gadgets, laptops, and accessories in Bangladesh. Genuine products, fast delivery, best prices.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <Toast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
