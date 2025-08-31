import React from "react"
import { cn } from "@/lib/utils"

export interface OrderTypeOptionProps {
  /**
   * The order type this option represents.
   */
  type: "pickup" | "delivery"
  /**
   * Whether this option is currently selected.
   */
  selected: boolean
  /**
   * Whether this option should be disabled (non-interactive).
   */
  disabled?: boolean
  /**
   * Callback invoked when the user selects this option.
   */
  onSelect: () => void
}

/**
 * OrderTypeOption displays a clickable square that allows the user to
 * choose between "Pickup" and "Delivery" order types. It visually updates
 * based on the `selected` prop and communicates selection via `onSelect`.
 */
export default function OrderTypeOption({
  type,
  selected,
  disabled = false,
  onSelect,
}: OrderTypeOptionProps) {
  // Custom icons for pickup and delivery
  const iconUrl = type === "pickup" 
    ? "https://kbgzetvmczooddjhzpqc.supabase.co/storage/v1/object/sign/restaurant-assets/icons/Untitled%20design%20(6).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YjRiYmM1ZS1iMzIyLTQwMjctOWIyMC0zMDIwMzM0ZDI0NzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXN0YXVyYW50LWFzc2V0cy9pY29ucy9VbnRpdGxlZCBkZXNpZ24gKDYpLnBuZyIsImlhdCI6MTc1NDc2ODIwMSwiZXhwIjoxNzg2MzA0MjAxfQ.sfIuuFoYJvmctJ5BtYPwgDgpjWgPlQ0KJlZ8fgNqxow"
    : "https://kbgzetvmczooddjhzpqc.supabase.co/storage/v1/object/sign/restaurant-assets/icons/Untitled%20design%20(7).png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV84YjRiYmM1ZS1iMzIyLTQwMjctOWIyMC0zMDIwMzM0ZDI0NzIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJyZXN0YXVyYW50LWFzc2V0cy9pY29ucy9VbnRpdGxlZCBkZXNpZ24gKDcpLnBuZyIsImlhdCI6MTc1NDc2ODIzOSwiZXhwIjoxNzg2MzA0MjM5fQ.ifAMpkHCWoHoT3toEGcpD2tW5jqIlXHMQWV1aPG_P98"; 
  // Keyboard accessibility: trigger `onSelect` when the user presses
  // Space or Enter while the component is focused.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onClick={() => {
        if (!disabled) {
          onSelect()
        }
      }}
      onKeyDown={handleKeyDown}
      style={{
        padding: '16px',
        border: `3px solid ${selected ? '#E97700' : 'rgba(233, 119, 0, 0.3)'}`,
        borderRadius: '8px',
        background: selected ? 'rgba(233, 119, 0, 0.1)' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: selected ? '0 4px 12px rgba(233, 119, 0, 0.25)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
        <img 
          src={iconUrl}
          alt={type === "pickup" ? "Pickup" : "Delivery"}
          style={{ 
            width: '60px', 
            height: '60px', 
            objectFit: 'contain'
          }}
        />
      </div>
      <span style={{ 
        fontSize: '16px', 
        fontWeight: '700',
        color: selected ? '#E97700' : '#2671BC',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {type === "pickup" ? "Pickup" : "Delivery"}
      </span>
    </div>
  )
}

