# Stripe Test Configuration

## 🧪 Test Mode Setup

### Environment Variables Needed:
```bash
# Frontend (add to .env.local)
# Use the single publishable key variable and set it to your TEST key for test mode
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
VITE_TEST_MODE=true

# Backend (set in Supabase Edge Functions)
# Use ONLY one secret key variable everywhere; set it to your TEST key in test mode
STRIPE_SECRET_KEY=sk_test_your_key_here
```

### How to Get Test Keys:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle to "Test mode" (top right)
3. Go to Developers > API Keys
4. Copy the "Publishable key" and "Secret key"

## 💳 Stripe Test Credit Cards

### ✅ Successful Payments:
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
Name: Any name
ZIP: Any ZIP code
```

### 🔒 3D Secure Authentication:
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
Name: Any name
ZIP: Any ZIP code
```

### ❌ Declined Cards (for testing failures):
```
Generic Decline: 4000 0000 0000 0002
Insufficient Funds: 4000 0000 0000 9995
Lost Card: 4000 0000 0000 9987
Stolen Card: 4000 0000 0000 9979
```

### 🌍 International Cards:
```
Canada: 4000 0012 4000 0000
UK: 4000 0082 6000 0000
France: 4000 0025 0000 0003
```

## 🧪 Test Scenarios

### Basic Payment Test:
1. Use `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC (e.g., 123)
4. Should complete successfully

### 3D Secure Test:
1. Use `4000 0025 0000 3155`
2. Will prompt for authentication
3. Click "Complete authentication"
4. Should complete successfully

### Declined Payment Test:
1. Use `4000 0000 0000 0002`
2. Should show "Your card was declined"
3. Order should not be created

## 🔍 Testing Checklist:
- [ ] Payment intent created successfully
- [ ] Order record created in database  
- [ ] Payment confirmed and order status updated
- [ ] Email notifications sent (check Supabase logs)
- [ ] Kitchen display shows new order
- [ ] Error handling works for declined cards

## 🚨 Important Notes:
- **Never use real card numbers in test mode**
- **Test mode payments won't charge real money**
- **Test webhooks won't work with localhost (use ngrok if needed)**
- **Always test both successful and failed payments**