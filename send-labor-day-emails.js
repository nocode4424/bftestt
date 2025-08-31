import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize Resend
const resend = new Resend('re_9Wu7pNds_DPRvVBzgTRcTDcgG6eXo2Cro');

// Initialize Supabase client
const supabaseUrl = 'https://kbgzetvmczooddjhzpqc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiZ3pldHZtY3pvb2Rkamh6cHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MTUxMzQsImV4cCI6MjA2NjQ5MTEzNH0.Xbs-OQY5VGsIiiXBOcI3ANXH0jCdAEXmee3Wmcy374w';
const supabase = createClient(supabaseUrl, supabaseKey);

const emailSubject = "Free Fried Oreos from Bluefin";

const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Happy Labor Day from Bluefin Sushi!</title>
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
        
        <p style="font-size: 18px;">Head to <a href="https://menu.bluefinwc.com?utm_source=email&utm_medium=promo&utm_campaign=labor_day_2025">menu.bluefinwc.com</a> to order online and satisfy your sushi and dessert cravings. This offer is valid through September 1st at 10 PM EST, so don't wait! ⏰</p>
        
        <a href="https://menu.bluefinwc.com?utm_source=email&utm_medium=promo&utm_campaign=labor_day_2025" class="cta-button">Order Now 🍣</a>
        
        <!-- Email tracking pixel -->
        <img src="https://api.resend.com/track/email/open" width="1" height="1" style="display:none;" alt="" />
        
        <p style="font-size: 18px;">Thank you for choosing Bluefin Sushi. Wishing you a fantastic holiday weekend! 🌟</p>
        
        <p>Warmest wishes,<br>
        The Bluefin Sushi Team</p>
        
        <div class="footer">
            <p>This is a promotional offer with no cash value, available online only, and may be withdrawn at any time. Valid through September 1, 2025, at 10 PM EST.</p>
        </div>
    </div>
</body>
</html>
`;

const emailText = `
Happy Labor Day! 🌞

At Bluefin Sushi, we're beyond grateful for you, our amazing customers. To make your holiday weekend extra delicious, we're serving up a sweet deal and introducing our brand-new Fried Oreos! 😋

Celebrate with us:

🎁 Use code LABORDAY for $5 off your entire order AND get a free order of 3 Fried Oreos—a crispy, indulgent dessert that's pure joy!

Head to menu.bluefinwc.com to order online and satisfy your sushi and dessert cravings. This offer is valid through September 1st at 10 PM EST, so don't wait! ⏰

Thank you for choosing Bluefin Sushi. Wishing you a fantastic holiday weekend! 🌟

Warmest wishes,
The Bluefin Sushi Team

This is a promotional offer with no cash value, available online only, and may be withdrawn at any time. Valid through September 1, 2025, at 10 PM EST.
`;

async function sendLaborDayEmails() {
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

        let successCount = 0;
        let errorCount = 0;

        // Send emails to each customer
        for (const customer of uniqueCustomers) {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'Bluefin Sushi <onboarding@resend.dev>', // Using Resend's default domain for testing
                    to: [customer.customer_email],
                    subject: emailSubject,
                    html: emailHtml,
                    text: emailText,
                });

                if (error) {
                    console.error(`Error sending email to ${customer.customer_email}:`, error);
                    errorCount++;
                } else {
                    console.log(`✅ Email sent successfully to ${customer.customer_name} (${customer.customer_email})`);
                    successCount++;
                }

                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));

            } catch (err) {
                console.error(`Error sending email to ${customer.customer_email}:`, err);
                errorCount++;
            }
        }

        console.log(`\n📧 Email Campaign Complete!`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total: ${uniqueCustomers.length}`);

    } catch (error) {
        console.error('Error in email campaign:', error);
    }
}

// Run the email campaign
sendLaborDayEmails();
