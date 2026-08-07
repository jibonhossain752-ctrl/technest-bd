export interface Faq {
  id: string
  question: string
  answer: string
  category: string
}

export const FAQS: Faq[] = [
  {
    id: 'f1',
    question: 'Is the cash on delivery option available?',
    answer:
      'Yes, cash on delivery (COD) is available across the United States. You can pay in cash when your order arrives.',
    category: 'Payment',
  },
  {
    id: 'f2',
    question: 'How long does delivery take?',
    answer:
      'Deliveries typically arrive within 2-5 business days depending on your location. Orders to major cities like New York, Los Angeles and Chicago usually arrive within 2-3 business days.',
    category: 'Delivery',
  },
  {
    id: 'f3',
    question: 'Are your products 100% genuine?',
    answer:
      'Absolutely. Every product is sourced from official distributors and brands. All laptops, phones and gadgets come with official warranty.',
    category: 'Products',
  },
  {
    id: 'f4',
    question: 'What is your return and exchange policy?',
    answer:
      'You can request a return or exchange within 7 days of delivery for unused products in original packaging. Defective items are replaced free of cost.',
    category: 'Returns',
  },
  {
    id: 'f5',
    question: 'Which payment methods do you accept?',
    answer:
      'We accept all major credit/debit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and cash on delivery. Online payments are processed securely.',
    category: 'Payment',
  },
  {
    id: 'f6',
    question: 'How do I check my order status?',
    answer:
      'After placing an order you will receive a confirmation call and SMS. You can also contact our support team or track your order from your account page.',
    category: 'Orders',
  },
  {
    id: 'f7',
    question: 'Do you offer warranty service?',
    answer:
      'Yes, all products come with official brand warranty. For any warranty issue, contact our support team and we will arrange service through the brand service center.',
    category: 'Warranty',
  },
  {
    id: 'f8',
    question: 'Can I cancel my order after placing it?',
    answer:
      'Orders can be cancelled free of charge before they are shipped. Once shipped, you can refuse the parcel or request a return after delivery.',
    category: 'Orders',
  },
]

export const FAQ_CATEGORIES = [...new Set(FAQS.map((f) => f.category))]
