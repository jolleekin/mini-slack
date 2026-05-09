import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

const spinnerVariants = tv({
  slots: {
    root: "inline-flex items-center",
    container: "relative shrink-0",
    track: "absolute inset-0 rounded-full",
    arc: "absolute inset-0 rounded-full",
    tail: "spinner-tail",
  },
  variants: {
    size: {
      "3xs": { container: "w-4 h-4"   },
      "2xs": { container: "w-5 h-5"   },
      "xs":  { container: "w-6 h-6"   },
      "sm":  { container: "w-7 h-7"   },
      "md":  { container: "w-8 h-8"   },
      "lg":  { container: "w-9 h-9"   },
      "xl":  { container: "w-10 h-10" },
      "2xl": { container: "w-11 h-11" },
    },
    appearance: {
      primary: {
        track: "bg-accent-a4",
        tail: "text-accent-9",
      },
      inverted: {
        track: "bg-accent-contrast/25",
        tail: "text-accent-contrast",
      },
    },
  },
  defaultVariants: {
    size: "md",
    appearance: "primary",
  },
});

const STROKE_WIDTH: Record<NonNullable<SpinnerVariants["size"]>, string> = {
  "3xs": "var(--stroke-width-thick)",
  "2xs": "var(--stroke-width-thick)",
  "xs":  "var(--stroke-width-thick)",
  "sm":  "var(--stroke-width-thick)",
  "md":  "var(--stroke-width-thicker)",
  "lg":  "var(--stroke-width-thicker)",
  "xl":  "var(--stroke-width-thicker)",
  "2xl": "var(--stroke-width-thickest)",
};

type SpinnerVariants = VariantProps<typeof spinnerVariants>;

export interface SpinnerProps extends SpinnerVariants {
  className?: string;
  ref?: React.Ref<HTMLSpanElement>;
}

export function Spinner({ size, appearance, className, ...props }: SpinnerProps) {
  const { root, container, track, arc, tail } = spinnerVariants({ size, appearance });
  const sw = STROKE_WIDTH[size ?? "md"];

  const ringMask = `radial-gradient(closest-side, transparent calc(100% - ${sw} - 1px), white calc(100% - ${sw}) calc(100% - 1px), transparent 100%)`;

  return (
    <span role="status" data-spinner {...props} className={root({ className })}>
      <span aria-hidden="true" className={container()}>

        {/* Track — static faint background ring */}
        <span
          className={track()}
          style={{
            WebkitMaskImage: ringMask,
            maskImage: ringMask,
          }}
        />

        {/* Arc — ring-masked rotating container */}
        <span
          className={arc()}
          style={{
            WebkitMaskImage: ringMask,
            maskImage: ringMask,
            animation: "spinner-rotate 1.5s linear infinite",
          }}
        >
          <span className={tail()} />
        </span>

      </span>
      <span className="sr-only">Loading...</span>
    </span>
  );
}
