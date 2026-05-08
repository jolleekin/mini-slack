import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { type VariantProps, tv } from "tailwind-variants";

import { Spinner, SpinnerProps } from "@/components/ui/spinner.tsx";

const buttonVariants = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "rounded-md text-sm font-medium",
    "transition-colors",
    "fluent-focus-ring",
    "select-none",
    "cursor-pointer",
  ],
  variants: {
    appearance: {
      default:
        "bg-gray-a3 text-gray-12 border border-gray-a7 hover:bg-gray-a4 active:bg-gray-a5",
      primary:
        "bg-accent-9 text-accent-contrast hover:bg-accent-10 active:bg-accent-11",
      success:
        "bg-success-9 text-success-contrast hover:bg-success-10 active:bg-success-11",
      danger:
        "bg-danger-9 text-danger-contrast hover:bg-danger-10 active:bg-danger-11",
      warning:
        "bg-warning-9 text-warning-contrast hover:bg-warning-10 active:bg-warning-11",
      outline:
        "bg-transparent text-gray-12 border border-gray-a7 hover:bg-gray-a3 active:bg-gray-a4",
      subtle: "bg-transparent text-gray-11 hover:bg-gray-a3 active:bg-gray-a4",
      transparent:
        "bg-transparent text-gray-11 hover:text-accent-10 active:text-accent-11",
      link: "bg-transparent text-accent-10 hover:underline active:text-accent-11 px-0",
    },
    shape: {
      default: "rounded-md",
      square: "rounded-md aspect-square",
      circle: "rounded-full aspect-square",
    },
    size: {
      sm: "h-6 text-xs px-2",
      default: "h-8 text-sm px-3",
      lg: "h-10 text-sm px-4",
    },
    disabled: {
      true: "opacity-50 cursor-not-allowed",
    },
  },
  compoundVariants: [
    // Square and circle shapes must have no horizontal padding regardless of size.
    { shape: "square", size: "sm", class: "px-0" },
    { shape: "square", size: "default", class: "px-0" },
    { shape: "square", size: "lg", class: "px-0" },
    { shape: "circle", size: "sm", class: "px-0" },
    { shape: "circle", size: "default", class: "px-0" },
    { shape: "circle", size: "lg", class: "px-0" },
    {
      disabled: true,
      appearance: "default",
      class: "hover:bg-gray-a3 active:bg-gray-a3",
    },
    {
      disabled: true,
      appearance: "primary",
      class: "hover:bg-accent-9 active:bg-accent-9",
    },
    {
      disabled: true,
      appearance: "success",
      class: "hover:bg-success-9 active:bg-success-9",
    },
    {
      disabled: true,
      appearance: "danger",
      class: "hover:bg-danger-9 active:bg-danger-9",
    },
    {
      disabled: true,
      appearance: "warning",
      class: "hover:bg-warning-9 active:bg-warning-9",
    },
    {
      disabled: true,
      appearance: "outline",
      class: "hover:bg-transparent active:bg-transparent",
    },
    {
      disabled: true,
      appearance: "subtle",
      class: "hover:bg-transparent active:bg-transparent",
    },
    {
      disabled: true,
      appearance: "transparent",
      class: "hover:text-gray-11 active:text-gray-11",
    },
    {
      disabled: true,
      appearance: "link",
      class: "hover:no-underline active:text-accent-11",
    },
  ],
  defaultVariants: {
    appearance: "default",
    shape: "default",
    size: "default",
  },
});

const SPINNER_SIZES: Record<
  NonNullable<ButtonProps["size"]>,
  SpinnerProps["size"]
> = {
  sm: "3xs",
  default: "2xs",
  lg: "sm",
};

const SPINNER_APPEARANCES: Partial<
  Record<NonNullable<ButtonProps["appearance"]>, SpinnerProps["appearance"]>
> = {
  danger: "inverted",
  primary: "inverted",
  success: "inverted",
  warning: "inverted",
};

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

export function Button({
  className,
  appearance = "default",
  shape,
  size = "default",
  isLoading = false,
  asChild = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  disabled ||= isLoading;
  const Comp = asChild ? Slot : "button";

  const content = asChild ? (
    children
  ) : (
    <>
      {isLoading && (
        <Spinner
          size={SPINNER_SIZES[size]}
          appearance={SPINNER_APPEARANCES[appearance] ?? "primary"}
        />
      )}
      {children}
    </>
  );

  return (
    <Comp
      disabled={disabled}
      className={buttonVariants({
        appearance,
        shape,
        size,
        disabled,
        className,
      })}
      {...props}
    >
      {content}
    </Comp>
  );
}
