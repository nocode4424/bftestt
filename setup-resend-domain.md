# Resend Domain Setup Instructions

## To send emails to all BlueFin customers, you need to verify your domain with Resend:

### 1. **Add Domain to Resend**
- Go to [resend.com/domains](https://resend.com/domains)
- Click "Add Domain"
- Enter: `bluefinwc.com`
- Click "Add Domain"

### 2. **Configure DNS Records**
Resend will provide you with DNS records to add to your domain. You'll need to add these to your domain's DNS settings:

#### **TXT Record for SPF:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### **CNAME Record for DKIM:**
```
Type: CNAME
Name: resend._domainkey
Value: [Resend will provide this value]
```

#### **TXT Record for DMARC:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@bluefinwc.com
```

### 3. **Wait for Verification**
- DNS changes can take up to 24 hours to propagate
- Resend will automatically verify your domain once DNS is configured

### 4. **Update Email Script**
Once verified, update the "from" address in the email scripts:
```javascript
from: 'Bluefin Sushi <noreply@bluefinwc.com>'
```

### 5. **Alternative: Use Resend's API with Domain Verification**
If you prefer not to verify the domain, you can:
- Use Resend's API with a verified domain
- Or use a different email service like SendGrid, Mailgun, etc.

## Current Status
- ✅ Email template created with tracking
- ✅ Darker button styling applied
- ✅ UTM parameters added for click tracking
- ❌ Domain verification needed to send to external recipients

## Next Steps
1. Verify your domain with Resend
2. Update the "from" address in the scripts
3. Run the email campaign again
