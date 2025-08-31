// shared/formatOrder.ts
// Utility to create a human-readable SMS message for a new order.
// The returned string is intended to be delivered to the macOS Messages app.

export interface OrderItem {
  id?: string;
  name: string;
  quantity?: number;
  price?: number;
  modifiers?: string[];
  special_instructions?: string;
}

export interface OrderPayload {
  orderId?: string;
  id?: string;
  customer_name?: string;
  customer_phone?: string;
  order_type?: string;
  type?: string;
  total?: number;
  items?: OrderItem[];
  created_at?: string;
  // catch-all for any additional fields
  [key: string]: unknown;
}

/**
 * Helper function to pluralize text based on quantity
 */
function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? `${singular}s`;
}

/**
 * Build a concise, human-readable summary for the incoming order.
 * This tries to be resilient to various property names coming from upstream.
 * 
 * @param order - The order payload data
 * @param subtotal - Optional subtotal amount to display separately from total
 * @returns Formatted order string
 */
export function formatOrder(order: OrderPayload, subtotal?: number): string {
  const id = (order.orderId ?? order.id ?? "UNKNOWN").toString();
  // Use locale-aware time formatting with fallback
  const created = order.created_at 
    ? new Date(order.created_at).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      })
    : new Date().toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
  const type = (order.order_type ?? order.type ?? "pickup").toString();
  const customer = order.customer_name ? `Customer: ${order.customer_name}` : "";
  const phone = order.customer_phone ? `Phone: ${order.customer_phone}` : "";
  const header = [`New Order #${id}`, `Time: ${created}`, `Type: ${type}`, customer, phone]
    .filter(Boolean)
    .join(" | ");

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const totalItems = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  const itemsHeader = `${pluralize(totalItems, "Item")} (${totalItems}):`;
  
  const lines: string[] = [header, itemsHeader];

  for (const item of items) {
    const qty = item.quantity ?? 1;
    const mods = item.modifiers && item.modifiers.length ? ` [${item.modifiers.join(", ")}]` : "";
    const instr = item.special_instructions ? ` (${item.special_instructions})` : "";
    const qtyText = qty === 1 ? "1" : `${qty}`;
    lines.push(`- ${qtyText} x ${item.name}${mods}${instr}`);
  }

  // Add subtotal if provided
  if (typeof subtotal === "number") {
    lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
  }
  
  // Add total from order data
  const total = typeof order.total === "number" ? order.total.toFixed(2) : undefined;
  if (total) {
    lines.push(`Total: $${total}`);
  }

  return lines.join("\n");
}

