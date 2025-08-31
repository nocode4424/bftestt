# Bluefin Sushi – Order Online

Order fresh sushi and Japanese cuisine online from Bluefin Sushi. Fast pickup and delivery available.

## Architecture

This project consists of:
- **Frontend**: React/TypeScript web application with 3 domain interfaces:
  - **menu.bluefinwc.com**: Customer ordering interface
  - **admin.bluefinwc.com**: Analytics dashboard (NEW!)
  - **orders.bluefinwc.com**: Kitchen display system
- **Order Alert Server**: Deno-based HTTP service that receives order webhooks
- **Mac Dispatcher**: macOS service that forwards alerts to Messages.app

## Required Environment Variables

### For Order Alert Server (server/order-alert.ts)
```sh
ORDER_ALERT_SECRET=your-shared-secret-here
MAC_DISPATCH_URL=http://192.168.1.100:7777
PORT=8000
```

### For Mac Dispatcher (mac-dispatcher/dispatcher.ts)
```sh
ORDER_ALERT_SECRET=your-shared-secret-here
LISTEN_PORT=7777
```

### For Frontend (src/.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_WEBHOOK_URL=https://YOUR-WEBHOOK-SERVER/orders    # will receive POSTs with order JSON, including restaurantId
```

## Local Development

### Frontend
```sh
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

### Order Alert Server
```sh
deno run --allow-net --allow-env server/order-alert.ts
```

### Mac Dispatcher
```sh
deno run --allow-net --allow-run --allow-env --allow-read mac-dispatcher/dispatcher.ts
```

## Deployment

### Cloud Deployment (Fly.io)

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Create app**: `fly launch`
3. **Set secrets**:
   ```sh
   fly secrets set ORDER_ALERT_SECRET=your-secret-here
   fly secrets set MAC_DISPATCH_URL=http://your-mac-ip:7777
   ```
4. **Deploy**: `fly deploy`
5. **Get public URL**: `fly info` - note the hostname for webhook configuration

### Systemd Services (Linux)

1. Copy systemd files:
   ```sh
   sudo cp systemd/order-alert.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable order-alert
   sudo systemctl start order-alert
   ```

2. For Mac dispatcher (on macOS):
   ```sh
   # Edit the service file to match your paths
   sudo cp systemd/mac-dispatcher.service /etc/systemd/system/
   sudo systemctl enable mac-dispatcher
   sudo systemctl start mac-dispatcher
   ```

## Firewall Configuration

### Order Alert Server
- **Incoming**: Allow TCP port 8000 (or your PORT value) from webhook sources
- **Outgoing**: Allow HTTPS (443) for external webhooks, HTTP to Mac dispatcher

### Mac Dispatcher
- **Incoming**: Allow TCP port 7777 (or your LISTEN_PORT) from order alert server
- **Outgoing**: No special requirements (local system calls only)

### Example iptables rules (Linux):
```sh
# Allow incoming on order alert port
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT

# Allow incoming on mac dispatcher port (if running on Linux)
sudo iptables -A INPUT -p tcp --dport 7777 -s YOUR_ORDER_SERVER_IP -j ACCEPT
```

### Example macOS firewall:
1. System Preferences → Security & Privacy → Firewall
2. Enable firewall and allow incoming connections for Terminal/Deno

## Testing

### Test Order Alert Server
```sh
curl -X POST http://localhost:8000/order-alert \
  -H "X-SHARED-SECRET: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test123",
    "items": [
      {"qty": 2, "name": "Spicy Tuna Roll"},
      {"qty": 1, "name": "California Roll"}
    ],
    "total": 24.99,
    "customerName": "John Doe",
    "customerPhone": "+13105551234"
  }'
```

### Test Mac Dispatcher
```sh
curl -X POST http://localhost:7777/dispatch \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-secret-here",
    "orderId": "test456",
    "items": [{"qty": 1, "name": "Salmon Teriyaki"}]
  }'
```

### Test Public Deployment
Replace `your-app.fly.dev` with your actual Fly.io hostname:
```sh
curl -X POST https://your-app.fly.dev/order-alert \
  -H "X-SHARED-SECRET: your-secret-here" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "prod-test-789",
    "items": [{"qty": 1, "name": "Dragon Roll"}]
  }'
```

## Technologies

- **Frontend**: Vite, TypeScript, React, shadcn-ui, Tailwind CSS
- **Backend**: Deno, Oak framework
- **Deployment**: Fly.io, systemd
- **Integration**: AppleScript, Messages.app
