import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://kbgzetvmczooddjhzpqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3pldHZtY3pvb2Rkamh6cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MTUxMzQsImV4cCI6MjA2NjQ5MTEzNH0.Xbs-OQY5VGsIiiXBOcI3ANXH0jCdAEXmee3Wmcy374w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createSimpleEmailFiles() {
    try {
        // Get all customers for BlueFin Sushi (excluding Lawrence, Vance, and Jeff)
        const { data: customers, error } = await supabase
            .from('orders')
            .select('customer_name, customer_email')
            .eq('restaurant_id', '3b29861a-5ade-4800-b269-d0a03c351eb6')
            .not('customer_email', 'is', null)
            .neq('customer_email', '')
            .not('customer_name', 'ilike', '%lawrence%')
            .not('customer_name', 'ilike', '%vance%')
            .not('customer_name', 'ilike', '%jeff%')
            .not('customer_name', 'ilike', '%jg%');

        if (error) {
            console.error('Error fetching customers:', error);
            return;
        }

        // Remove duplicates and filter out invalid emails
        const uniqueCustomers = customers
            .filter(customer => customer.customer_email && customer.customer_email.includes('@'))
            .filter((customer, index, self) => 
                index === self.findIndex(c => c.customer_email === customer.customer_email)
            );

        console.log(`Found ${uniqueCustomers.length} unique customers to email`);

        // Create simple email list
        const emailList = uniqueCustomers.map(customer => ({
            name: customer.customer_name,
            email: customer.customer_email
        }));

        // Save email list
        fs.writeFileSync('customer-email-list.json', JSON.stringify(emailList, null, 2));

        // Create simple text file for easy copying
        const emailText = uniqueCustomers.map(c => `${c.customer_name} - ${c.customer_email}`).join('\n');
        fs.writeFileSync('customer-emails.txt', emailText);

        // Create email template
        const emailTemplate = `
Subject: Free Fried Oreos from Bluefin

Happy Labor Day! 🌞

At Bluefin Sushi, we're beyond grateful for you, our amazing customers. To make your holiday weekend extra delicious, we're serving up a sweet deal and introducing our brand-new Fried Oreos! 😋

Celebrate with us:

🎁 Use code LABORDAY for $5 off your entire order AND get a free order of 3 Fried Oreos—a crispy, indulgent dessert that's pure joy!

Head to menu.bluefinwc.com to order online and satisfy your sushi and dessert cravings. This offer is valid through September 1st at 10 PM EST, so don't wait! ⏰

Thank you for choosing Bluefin Sushi. Wishing you a fantastic holiday weekend! 🌟

Warmest wishes,
The Bluefin Sushi Team

This is a promotional offer with no cash value, available online only, and may be withdrawn at any time. Valid through September 1, 2025, at 10 PM EST.
        `.trim();

        fs.writeFileSync('email-template.txt', emailTemplate);

        console.log(`
🎉 SUPER EASY EMAIL CAMPAIGN READY!

📧 ${uniqueCustomers.length} customers ready to receive emails
📄 Files created:
   - customer-email-list.json (for import to any email service)
   - customer-emails.txt (simple list for copying)
   - email-template.txt (email content)

🚀 EASIEST WAYS TO SEND:

1. 📧 Gmail (Manual - Copy/Paste):
   - Copy emails from customer-emails.txt
   - Copy content from email-template.txt
   - Send to all customers

2. 📧 Mailchimp (Free):
   - Import customer-email-list.json
   - Use email-template.txt content
   - Send to all 40 customers

3. 📧 SendGrid (Free 100/day):
   - Use customer-email-list.json
   - Use email-template.txt content

4. 📧 Outlook/Hotmail:
   - Copy emails from customer-emails.txt
   - Copy content from email-template.txt
   - Send to all customers

📋 Customer List:
${uniqueCustomers.map((c, i) => `${i + 1}. ${c.customer_name} - ${c.customer_email}`).join('\n')}

🎁 Campaign Details:
- Subject: "Free Fried Oreos from Bluefin"
- Offer: LABORDAY code for $5 off + free Fried Oreos
- Valid: Through September 1st at 10 PM EST
- Link: menu.bluefinwc.com

Just pick your preferred method and send! 🚀
        `);

    } catch (error) {
        console.error('Error creating email files:', error);
    }
}

// Run it
createSimpleEmailFiles();
