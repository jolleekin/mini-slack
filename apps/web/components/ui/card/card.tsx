import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

const cardVariants = tv({
  base: [
    "[--card-size:8px] [--card-border-radius:6px]",
    "relative flex flex-col gap-(--card-size) p-(--card-size)",
    "border rounded-(--card-border-radius)",
    "transition-colors",
  ],
  variants: {
    appearance: {
      // Shadow + border + filled background (default)
      filled: "bg-gray-2 border-gray-a6 shadow-sm",
      // Slightly darker background for use on white/light surfaces
      "filled-alternative": "bg-gray-3 border-gray-a6 shadow-sm",
      // Transparent background, visible border, no shadow
      outline: "bg-transparent border-gray-a6",
      // No background, no border — interaction states only
      subtle: "bg-transparent border-transparent hover:bg-gray-a2",
    },
    size: {
      small: "[--card-size:8px]",
      medium: "[--card-size:12px]",
      large: "[--card-size:16px]",
    },
    orientation: {
      vertical: "flex-col",
      horizontal: "flex-row items-center",
    },
    selected: {
      true: "border-accent-8 bg-accent-2",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
    },
  },
  compoundVariants: [
    // Selected outline card keeps transparent bg but gets accent border
    {
      appearance: "outline",
      selected: true,
      class: "bg-transparent border-accent-8",
    },
    // Selected subtle card gets a faint accent background
    {
      appearance: "subtle",
      selected: true,
      class: "bg-accent-2 border-transparent",
    },
  ],
  defaultVariants: {
    appearance: "filled",
    size: "medium",
    orientation: "vertical",
  },
});

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  ref?: React.Ref<HTMLDivElement>;
  /** Whether the card is in a selected state. */
  selected?: boolean;
  /** Whether the card is disabled. Adds aria-disabled and suppresses interaction. */
  disabled?: boolean;
}

export function Card({
  className,
  appearance,
  size,
  orientation,
  selected = false,
  disabled = false,
  role = "group",
  ...props
}: CardProps) {
  return (
    <div
      role={role}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      data-selected={selected || undefined}
      className={cardVariants({
        appearance,
        size,
        orientation,
        selected,
        disabled,
        className,
      })}
      {...props}
    />
  );
}
