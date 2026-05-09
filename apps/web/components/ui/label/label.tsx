import { type JSX, type Ref } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const labelVariants = tv({
  slots: {
    base: "inline-flex items-center text-gray-12 font-medium",
    indicator: "text-danger-9 ml-0.5",
  },
  variants: {
    size: {
      sm: { base: "text-xs" },
      default: { base: "text-sm" },
      lg: { base: "text-base" },
    },
    disabled: {
      true: { base: "opacity-50 cursor-not-allowed" },
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface LabelProps
  extends
    React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  ref?: Ref<HTMLLabelElement>;
  /**
   * Marks the field as required and renders an indicator after the label text.
   * - `true` — renders a red asterisk (`*`) using the `text-danger-9` token.
   * - `string` — renders the string as the indicator.
   * - `JSX.Element` — renders the element as the indicator.
   * - `false` / omitted — renders no indicator.
   */
  required?: boolean | string | JSX.Element;
  /** Additional class names merged into the required indicator span via `tailwind-variants`. */
  requiredClassName?: string;
  /** Dims the label to `opacity-50` and sets `cursor-not-allowed` to match a disabled input. */
  disabled?: boolean;
  /** Controls the font size. Defaults to `"default"` (`text-sm`). */
  size?: "sm" | "default" | "lg";
}

export function Label({
  className,
  size,
  disabled,
  required,
  requiredClassName,
  children,
  ...props
}: LabelProps) {
  const { base, indicator } = labelVariants({ size, disabled });

  const requiredIndicator =
    required === true ? (
      <span className={indicator({ class: requiredClassName })}>*</span>
    ) : required ? (
      <span className={indicator({ class: requiredClassName })}>{required}</span>
    ) : null;

  return (
    <label className={base({ className })} {...props}>
      {children}
      {requiredIndicator}
    </label>
  );
}
