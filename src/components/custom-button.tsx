"use client";

import { cn } from "@/lib/utils";
import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";

interface CustomButtonProps
  extends Omit<ComponentProps<typeof NextLink>, "href" | "children"> {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "outline";
}

const CustomButton: React.FC<CustomButtonProps> = ({
  href,
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseClasses = "btn";
  const variantClasses = variant === "primary" ? "btn-primary" : "btn-outline";

  return (
    <NextLink
      href={href}
      className={cn(baseClasses, variantClasses, className)}
      {...props}
      suppressHydrationWarning={true}
    >
      {children}
    </NextLink>
  );
};

export default CustomButton;
