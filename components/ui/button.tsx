import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex h-9 items-center justify-center gap-2 border px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00d4aa] disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "border-[#00d4aa] bg-[#00d4aa] text-[#061511] hover:bg-[#28e7c0]",
        secondary: "border-[#363636] bg-[#171717] text-[#d8d8d8] hover:border-[#666] hover:text-white",
        danger: "border-[#ff4757] bg-transparent text-[#ff6a77] hover:bg-[#ff4757]/10",
        ghost: "border-transparent bg-transparent text-[#888] hover:text-white",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-7 px-2 text-[10px]",
        lg: "h-11 px-5 text-xs",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  },
)

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
