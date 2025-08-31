# Resend Domain Verification Setup

## 🚀 To Send Emails to All Customers, You Need to Verify Your Domain

### **Current Status:**
- ✅ Test email sent successfully to jeffagordon@gmail.com
- ❌ Cannot send to other customers without domain verification
- 📧 40 customers waiting for Labor Day promotion

### **Step-by-Step Domain Verification:**

#### **1. Go to Resend Dashboard**
- Visit: https://resend.com/domains
- Sign in with your account

#### **2. Add Your Domain**
- Click "Add Domain"
- Enter: `bluefinwc.com`
- Click "Add Domain"

#### **3. Add DNS Records**
Resend will provide you with DNS records to add to your domain provider. You'll need to add these records:

**For Bluefin Sushi (bluefinwc.com):**

**TXT Record for SPF:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**CNAME Record for DKIM:**
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
TTL: 3600
```

**TXT Record for DMARC:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@bluefinwc.com
TTL: 3600
```

#### **4. Wait for Verification**
- DNS changes can take up to 24 hours
- Resend will show verification status
- You'll receive an email when verified

#### **5. Update Email Script**
Once verified, update the `from` address in `send-emails-resend.js`:

```javascript
from: 'Bluefin Sushi <orders@bluefinwc.com>', // or any email@bluefinwc.com
```

#### **6. Send All Emails**
Run the script again:
```bash
node send-emails-resend.js
```

### **Alternative Quick Solutions:**

#### **Option A: Use Gmail (Immediate)**
1. Set up Gmail app password
2. Update `send-emails-via-gmail.js` with your credentials
3. Run: `node send-emails-via-gmail.js`

#### **Option B: Use Mailchimp (Immediate)**
1. Import `email-campaign-import.csv` to Mailchimp
2. Use the HTML template from `email-campaign-data.json`
3. Send to all 40 customers

#### **Option C: Use SendGrid (Immediate)**
1. Create free SendGrid account
2. Use API with `email-campaign-data.json`
3. Send in batches of 100

### **Current Email Campaign Status:**
- 📧 **40 customers** ready to receive emails
- 🎁 **Labor Day promotion** with $5 off + free Fried Oreos
- ⏰ **Valid through September 1st** at 10 PM EST
- 🔗 **Link**: menu.bluefinwc.com

### **Next Steps:**
1. **Choose your preferred method** (domain verification or alternative service)
2. **Set up the chosen method**
3. **Send all 40 emails** with the Labor Day promotion

**The email template and customer list are ready - just need to choose your sending method!** 🚀
