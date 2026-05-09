"use client";

import { type ReactNode, type Ref } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const inputVariants = tv({
  slots: {
    wrapper: [
      "group relative flex w-full items-center",
      "bg-white-a2",
      "border border-gray-a6 border-b-gray-a10",
      "rounded-sm",
      "has-disabled:opacity-50 has-disabled:cursor-not-allowed",
      // Radix Form invalid state — applied when Form.Field sets data-invalid on the input
      "has-data-invalid:border-b-danger-9",
    ],
    before: "flex shrink-0 items-center pl-3 text-sm text-gray-a11",
    after: "flex shrink-0 items-center pr-3 text-sm text-gray-a11",
    input: [
      // Layout & typography
      "peer min-w-0 flex-1 h-8 px-3 text-sm",
      // Colors
      "bg-transparent text-gray-12 placeholder:text-gray-a9",
      // Remove default focus outline; focus is handled by the indicator
      "outline-none",
    ],
    // Animated bottom-border focus indicator (Fluent Design underline)
    indicator: [
      "absolute z-1 top-0 -bottom-px left-0 right-0",
      "[clip-path:inset(calc(100%-2px)_0_0)]",
      "rounded-b-sm",
      "bg-accent-9",
      // Hidden by default; slides in when the sibling input is focused
      "scale-x-0 peer-focus-visible:scale-x-100",
      "transition-transform duration-faster ease-decelerate-mid",
      "pointer-events-none",
      // Radix Form invalid state — switch indicator to danger color
      "group-has-data-invalid:bg-danger-9",
    ],
  },
  variants: {
    hasError: {
      true: {
        wrapper: "border-b-danger-9",
        indicator: "bg-danger-9",
      },
    },
  },
});

export interface InputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>;
  /** Renders the input in an error state with a danger-colored focus indicator. */
  hasError?: boolean;
  /** Content rendered to the left of the input (icon, currency symbol, etc.). */
  before?: ReactNode;
  /** Content rendered to the right of the input (icon, unit label, etc.). */
  after?: ReactNode;
  /** Class applied to the outer wrapper div. */
  wrapperClassName?: string;
}

export function Input({
  className,
  wrapperClassName,
  hasError,
  before,
  after,
  ref,
  ...props
}: InputProps) {
  const {
    wrapper,
    before: beforeCls,
    after: afterCls,
    input,
    indicator,
  } = inputVariants({ hasError });

  return (
    <div className={wrapper({ class: wrapperClassName })}>
      {before && <span className={beforeCls()}>{before}</span>}
      <input
        ref={ref}
        data-error={hasError || undefined}
        className={input({ class: className })}
        {...props}
        onBlur={(e) => e.target.checkValidity()}
      />
      {after && <span className={afterCls()}>{after}</span>}
      <span aria-hidden className={indicator()} />
    </div>
  );
}
