import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Initialize Supabase client
const supabaseUrl = 'https://kbgzetvmczooddjhzpqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3pldHZtY3pvb2Rkamh6cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MTUxMzQsImV4cCI6MjA2NjQ5MTEzNH0.Xbs-OQY5VGsIiiXBOcI3ANXH0jCdAEXmee3Wmcy374w';
const supabase = createClient(supabaseUrl, supabaseKey);

async function prepareEmailData() {
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

        // Create email data for different services
        const emailData = {
            subject: "Free Fried Oreos from Bluefin",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Free Fried Oreos from Bluefin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2671BC;
            margin-bottom: 10px;
        }
        .offer {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2671BC;
        }
        .cta-button {
            display: inline-block;
            background-color: #1a4a8a;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
        }
        .emoji {
            font-size: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🍣 Bluefin Sushi</div>
        </div>
        
        <h1 style="font-size: 32px; margin-bottom: 20px;">Happy Labor Day! 🌞</h1>
        
        <p style="font-size: 18px; line-height: 1.6;">At Bluefin Sushi, we're beyond grateful for you, our amazing customers. To make your holiday weekend extra delicious, we're serving up a sweet deal and introducing our brand-new Fried Oreos! 😋</p>
        
        <h2 style="font-size: 24px; margin: 30px 0 20px 0;">Celebrate with us:</h2>
        
        <div class="offer" style="font-size: 18px;">
            <p><span class="emoji">🎁</span> Use code <strong>LABORDAY</strong> for $5 off your entire order AND get a free order of 3 Fried Oreos—a crispy, indulgent dessert that's pure joy!</p>
        </div>
        
        <p style="font-size: 18px;">Head to <a href="https://menu.bluefinwc.com">menu.bluefinwc.com</a> to order online and satisfy your sushi and dessert cravings. This offer is valid through September 1st at 10 PM EST, so don't wait! ⏰</p>
        
        <a href="https://menu.bluefinwc.com" class="cta-button">Order Now 🍣</a>
        
        <p style="font-size: 18px;">Thank you for choosing Bluefin Sushi. Wishing you a fantastic holiday weekend! 🌟</p>
        
        <p>Warmest wishes,<br>
        The Bluefin Sushi Team</p>
        
        <div class="footer">
            <p>This is a promotional offer with no cash value, available online only, and may be withdrawn at any time. Valid through September 1, 2025, at 10 PM EST.</p>
        </div>
    </div>
</body>
</html>`,
            text: `
Happy Labor Day! 🌞

At Bluefin Sushi, we're beyond grateful for you, our amazing customers. To make your holiday weekend extra delicious, we're serving up a sweet deal and introducing our brand-new Fried Oreos! 😋

Celebrate with us:

🎁 Use code LABORDAY for $5 off your entire order AND get a free order of 3 Fried Oreos—a crispy, indulgent dessert that's pure joy!

Head to menu.bluefinwc.com to order online and satisfy your sushi and dessert cravings. This offer is valid through September 1st at 10 PM EST, so don't wait! ⏰

Thank you for choosing Bluefin Sushi. Wishing you a fantastic holiday weekend! 🌟

Warmest wishes,
The Bluefin Sushi Team

This is a promotional offer with no cash value, available online only, and may be withdrawn at any time. Valid through September 1, 2025, at 10 PM EST.`,
            customers: uniqueCustomers
        };

        // Save email data for different services
        fs.writeFileSync('email-campaign-data.json', JSON.stringify(emailData, null, 2));
        
        // Create CSV for import
        const csvData = [
            ['Name', 'Email', 'Subject', 'HTML', 'Text'],
            ...uniqueCustomers.map(customer => [
                customer.customer_name,
                customer.customer_email,
                emailData.subject,
                emailData.html.replace(/"/g, '""'),
                emailData.text.replace(/"/g, '""')
            ])
        ];

        const csvContent = csvData.map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');

        fs.writeFileSync('email-campaign-import.csv', csvContent);

        console.log(`\n📧 Email Campaign Data Ready!`);
        console.log(`📊 Total customers: ${uniqueCustomers.length}`);
        console.log(`📄 Files created:`);
        console.log(`   - email-campaign-data.json (for API services)`);
        console.log(`   - email-campaign-import.csv (for import to email services)`);
        
        console.log(`\n🚀 Quick Email Sending Options:`);
        console.log(`\n1. 📧 Mailchimp (Free up to 2,000 subscribers):`);
        console.log(`   - Import email-campaign-import.csv`);
        console.log(`   - Use the HTML template from email-campaign-data.json`);
        
        console.log(`\n2. 📧 SendGrid (Free 100 emails/day):`);
        console.log(`   - Use the API with email-campaign-data.json`);
        
        console.log(`\n3. 📧 ConvertKit (Free tier available):`);
        console.log(`   - Import email-campaign-import.csv`);
        
        console.log(`\n4. 📧 Gmail (Manual send):`);
        console.log(`   - Use send-emails-via-gmail.js (requires setup)`);
        
        console.log(`\n5. 📧 Outlook/Hotmail (Manual send):`);
        console.log(`   - Use send-emails-via-gmail.js with Outlook settings`);

        // Show customer list
        console.log(`\n📋 Customer List:`);
        uniqueCustomers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.customer_name} - ${customer.customer_email}`);
        });

    } catch (error) {
        console.error('Error preparing email data:', error);
    }
}

// Run the function
prepareEmailData();
