// Type-only aliases for Stripe types used in the app without importing the runtime SDK
// This is useful when you receive Stripe-shaped objects from Supabase and want
// to satisfy the linter without changing runtime behavior.

import type StripeType from 'stripe';

export type PaymentIntent = StripeType.PaymentIntent;
export type SetupIntent = StripeType.SetupIntent;
export type PaymentMethod = StripeType.PaymentMethod;
export type Customer = StripeType.Customer;

