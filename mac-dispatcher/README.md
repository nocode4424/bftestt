# mac-dispatcher

This utility runs on a **local macOS machine** and forwards incoming order alerts to the built-in **Messages.app** by executing a short AppleScript through `osascript`.

---
## 1. AppleScript template

The TypeScript helper in `mac-dispatcher/applescript.ts` exports convenience functions for building a properly-escaped AppleScript string **at runtime**:

```ts
import { createMessagesScript, executeAppleScript } from "./applescript.ts";

const script = createMessagesScript({
  message: "Order #123 – 2x Spicy Tuna Roll",
  phoneNumber: "+13105551234",
});

await executeAppleScript(script);
```

---
## 2. macOS privacy permissions

`osascript` needs permission from macOS to control **Messages.app**. Because we invoke `osascript` from the Deno runtime (or your terminal), you have to grant *either* **Full Disk Access** *or* the more specific **Automation ➜ Messages** entitlement to the binary that launches the script.

### Which binary needs the entitlement?

• **When running with `deno run …`:** grant permissions to **`deno`** (the binary in `/usr/local/bin/deno`, Homebrew path, or wherever you installed it).

• **When running through `npm run dev` or another Node process that eventually shells out to Deno:** grant them to **`Terminal.app`** (or any other terminal emulator you use, e.g. iTerm).

macOS attributes privileges to the top-level process that starts the whole chain, so covering that parent process is sufficient.

### How to grant Automation / Full Disk Access

1. Open **System Settings › Privacy & Security**.
2. Scroll down to **Automation** (or **Full Disk Access** on older macOS versions).
3. Press the **“＋”** button and locate the executable:
   * `/opt/homebrew/bin/deno` (Homebrew on Apple Silicon)
   * `/usr/local/bin/deno` (Homebrew on Intel)
   * Or pick **Terminal.app** / **iTerm.app** if you prefer.
4. Enable the checkbox for **Messages**.
5. Restart the affected app (Terminal or Deno) so the new entitlement is applied.

Without this step the dispatcher will throw an error similar to:

```
osascript: can’t send because Messages.app has not been given permission to send Apple events
```

---
## 3. Testing

Run the dispatcher locally and trigger a test alert:

```sh
# Ensure ORDER_ALERT_SECRET is set first
LISTEN_PORT=7777 deno run --allow-env --allow-run --allow-net mac-dispatcher/dispatcher.ts
```

Then, in a separate shell:

```sh
curl -X POST http://localhost:7777/dispatch \
  -H "Content-Type: application/json" \
  -d '{"secret":"$ORDER_ALERT_SECRET","orderId":"test123","items":[{"qty":1,"name":"California Roll"}]}'
```

You should see the message appear in your Messages.app conversation with the specified number or contact.

