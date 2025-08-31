// shared/formatOrder.test.ts
// Tests for formatOrder helper utility

import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.201.0/assert/mod.ts";

import { formatOrder, OrderPayload } from "./formatOrder.ts";

Deno.test("handles order with zero items", () => {
  const order: OrderPayload = {
    orderId: "0",
    total: 0,
    items: [],
  };

  const result = formatOrder(order);

  // Should pluralize correctly for zero
  assertStringIncludes(result, "Items (0):");
});

Deno.test("formats single item with default quantity", () => {
  const order: OrderPayload = {
    orderId: "1",
    total: 5,
    items: [
      {
        name: "Miso Soup",
      },
    ],
  };

  const result = formatOrder(order);

  // Header should use singular "Item"
  assertStringIncludes(result, "Item (1):");
  // Line for the item should include default quantity 1
  assertStringIncludes(result, "- 1 x Miso Soup");
});

Deno.test("formats multiple items and quantities", () => {
  const order: OrderPayload = {
    orderId: "2",
    total: 30,
    items: [
      { name: "California Roll", quantity: 2 },
      { name: "Edamame", quantity: 3 },
    ],
  };

  const result = formatOrder(order);

  // Total quantity = 5, so plural "Items"
  assertStringIncludes(result, "Items (5):");
  assertStringIncludes(result, "- 2 x California Roll");
  assertStringIncludes(result, "- 3 x Edamame");
});

Deno.test("includes modifiers and special instructions", () => {
  const order: OrderPayload = {
    orderId: "3",
    total: 12.99,
    items: [
      {
        name: "Sushi Combo",
        quantity: 1,
        modifiers: ["Extra Avocado", "Spicy Mayo"],
        special_instructions: "No wasabi",
      },
    ],
  };

  const result = formatOrder(order);
  // Expect modifiers list and instructions to appear in the same line
  assertStringIncludes(result, "[Extra Avocado, Spicy Mayo]");
  assertStringIncludes(result, "(No wasabi)");
});

Deno.test("adds subtotal when provided explicitly", () => {
  const order: OrderPayload = {
    orderId: "4",
    total: 25,
    items: [
      { name: "Salmon Nigiri", quantity: 2 },
    ],
  };

  const subtotal = 20.75;
  const result = formatOrder(order, subtotal);

  assertStringIncludes(result, "Subtotal: $20.75");
});

Deno.test("formats total with two decimal places", () => {
  const order: OrderPayload = {
    orderId: "5",
    total: 15,
    items: [
      { name: "Green Tea" },
    ],
  };

  const result = formatOrder(order);
  assertStringIncludes(result, "Total: $15.00");
});

