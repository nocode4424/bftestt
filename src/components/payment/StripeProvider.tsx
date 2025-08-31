import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Use production Stripe key (no more test mode)
const getStripeKey = () => {
  return import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
};

const stripeKey = getStripeKey();

// For development, provide a fallback if Stripe key is missing
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

if (!stripeKey) {
  console.warn('Missing Stripe publishable key. Stripe functionality will be disabled.');
}

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // If Stripe is not available, just render children without Stripe
  if (!stripePromise) {
    return <>{children}</>;
  }

  // Use setup mode to avoid needing amount upfront
  // We'll create payment method and handle payment intent in the checkout flow
  const options = {
    mode: 'payment' as const,
    currency: 'usd',
    amount: 1000, // Placeholder amount - will be updated in payment intent
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: 'hsl(var(--primary))',
        colorBackground: 'hsl(var(--background))',
        colorText: 'hsl(var(--foreground))',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};