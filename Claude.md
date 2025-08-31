# Sushi Flow Order - Restaurant Management System

## System Overview

There are three distinct sections:

## 1. 🛒 Menu - Online Ordering Section (Customer-Facing)

### Core Ordering Flow
- **Menu Display**: Product browsing with categories, descriptions, and pricing
- **Cart Management**: Add/remove items with real-time cart updates
- **Item Customization**: Modifier groups, variant selections, special instructions
- **Customer Information**: Name, phone, email collection
- **Delivery Options**: Pickup vs Delivery selection with address input
- **Payment Processing**: Stripe integration with payment intent handling
- **Order Confirmation**: Real-time order status and tracking

### Advanced Features
- **Cart Analytics**: Session tracking, abandonment monitoring
- **Cross-sell Campaigns**: Upsell suggestions based on cart contents
- **Promotional Specials**: Triggered offers and discounts
- **Customer Favorites**: Save frequently ordered items
- **Advance Ordering**: Schedule orders for future times
- **Minimum Order**: Enforcement for delivery/pickup
- **Time-based Availability**: Items available only during specific hours/days

### Technical Implementation
- **Real-time Updates**: Supabase subscriptions for live order status
- **Session Management**: Anonymous cart sessions with persistence
- **Analytics Tracking**: Site visitors, cart events, checkout events
- **Mobile Optimization**: Responsive design for all devices

## 2. 📋 Menu Section (Content Management)

### Product Management
- **Categories**: Hierarchical organization with sort orders
- **Products**: Name, description, base pricing, images
- **Availability Controls**:
  - Time-based (specific hours)
  - Day-based (specific days of week)
  - Menu-based (regular, special events)
- **Product Labels**: Dietary tags, indicators (spicy, vegetarian, etc.)
- **21+ Items**: Age verification for alcohol

### Customization System
- **Modifier Groups**: Required/optional customizations
- **Modifiers**: Individual options with price adjustments
- **Variant Groups**: Size/style options (small/medium/large)
- **Upsell Groups**: Suggested add-ons and upgrades
- **Selection Rules**: Min/max quantities, incompatible combinations

### Advanced Menu Features
- **Additional Menus**: Special event menus, seasonal offerings
- **Daily Limits**: Inventory control for limited items
- **Preparation Time**: Kitchen timing estimates
- **Popularity Scoring**: Data-driven menu optimization
- **Nutritional Info**: Calorie counts, allergen information

### Theme & Presentation
- **Menu Templates**: Pre-designed layout options
- **Theme Configuration**: Colors, fonts, layout styles
- **Custom CSS**: Advanced styling capabilities
- **Image Management**: Product photos with thumbnails

## 3. ⚙️ Admin Section (Restaurant Management)

### Restaurant Configuration
- **Basic Info**: Name, address, phone, hours of operation
- **Owner/Manager Details**: Contact information, roles
- **Brand Customization**: Logo, colors, custom domain
- **Operational Settings**:
  - Online ordering on/off
  - Delivery/pickup availability
  - Tax rates, processing fees
  - Tip percentages, gratuity settings

### Order Management
- **Kitchen Display**: Real-time order board (iPad optimized)
- **Order History**: 7-day detailed transaction log
- **Status Tracking**: NEW → ACKNOWLEDGED → PREPARING → READY
- **Service Controls**: Temporary pause ordering with staff authentication
- **Order Analytics**: Peak times, popular items, sales metrics

### Payment & Financial
- **Stripe Integration**: Connected accounts, payment processing
- **Fee Structure**:
  - Application fees (flat + percentage)
  - Processing fees, delivery fees
  - Tax handling, tip management
- **Transaction Tracking**: Payment attempts, success/failure rates
- **Financial Reporting**: Revenue analytics, fee breakdowns

### Delivery Integration
- **Uber Eats API**: Automated delivery dispatch
- **Delivery Tracking**: Real-time courier location and ETA
- **Quote Management**: Dynamic pricing from delivery partners
- **Delivery Analytics**: Success rates, timing metrics

### Staff & Access Management
- **Restaurant Admins**: Multi-user access control
- **Kitchen Staff Interface**: Simplified order management
- **Notification System**: Email/SMS alerts for new orders
- **Audit Logs**: Service disable tracking, staff actions

### Analytics & Insights
- **Customer Analytics**: Site visitors, conversion rates
- **Cart Analytics**: Abandonment tracking, session data
- **Menu Performance**: Item popularity, upsell success
- **Operational Metrics**: Order volume, peak times
- **Revenue Reporting**: Sales trends, profit analysis

### Advanced Features
- **Kitchen Deployment**: Separate kitchen display system
- **Webhook Integration**: Custom order notifications
- **Custom Domain**: White-label ordering experience
- **API Access**: Integration with POS systems
- **Advance Ordering**: Future order scheduling

## 4. 🍳 Kitchen Management System

### Core Kitchen Interface (/kitchen)
- **iPad-optimized horizontal layout** (16:9 aspect ratio)
- **Real-time order management** with Supabase live updates
- **Maximum volume audio alerts** (no toggle - always on)
- **4-column order workflow**: NEW → ACKNOWLEDGED → PREPARING → READY

### Order Management Features
- **🔥 NEW ORDERS**: Flash/pulse animation until acknowledged
- **Live connection status indicator**
- **Order cards** with customer info, items, special instructions
- **One-tap status updates** with large touch targets
- **Auto-scrolling order lists** for each status column

### Service Controls Section
- **Simplified pause system** with 4 preset options:
  - 30 minutes / 1 hour / 2 hours / Rest of day
- **Staff authentication required** (name + approval checkbox)
- **Reason selection** with custom event descriptions
- **Current time display** for context

### Dashboard & Analytics Section
- **Most Popular Items** (today's data)
- **Peak Order Times** analytics
- **Sales Recommendations** (mobile orders, delivery deals, bundles)
- **7-Day Order History** with clickable details
- **Item pricing** (not subtotals) calculation
- **Real-time metrics** (today's orders, average time, peak hour)

### Technical Features
- **Real-time Supabase sync** with connection monitoring
- **Eastern timezone support** for all timestamps
- **Bold, high-contrast design** for kitchen visibility
- **Touch-optimized buttons** and interfaces
- **Kitchen-specific color system** (high contrast reds, oranges, greens)

## Technical Stack

Each section is built with:
- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Supabase backend services
- **Real-time Updates**: Supabase subscriptions
- **Mobile Optimization**: Responsive design for all devices
- **Architecture**: Scalable, modern web application

## Admin Access

The admin section is at `/menu/admin`. It allows basic menu administration:
- Uploading a picture and a thumbnail tied to an image
- Showing you the restaurants that you have under your ownership
- You log in with the restaurant owner username and password
- Change descriptions, add categories
- **Planned**: Add menu item functionality to create new menu items

## GitHub Setup

For your `.gitignore` file, use "Node" as the language template since this is a React/TypeScript project.

The system is designed for always-on kitchen display use with maximum visibility and minimal interaction complexity!
