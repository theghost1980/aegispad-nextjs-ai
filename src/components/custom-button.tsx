"use client";

import { cn } from "@/lib/utils"; // Para combinar clases opcionales
import NextLink from "next/link";
import type { ComponentProps, ReactNode } from "react";

interface CustomButtonProps
  extends Omit<ComponentProps<typeof NextLink>, "href" | "children"> {
  href: string; // La ruta que el Link de next-intl espera (ej. "/editor")
  children: ReactNode;
  className?: string; // Para permitir clases adicionales si es necesario
  variant?: "primary" | "outline"; // Para manejar diferentes estilos
}

const CustomButton: React.FC<CustomButtonProps> = ({
  href,
  children,
  className,
  variant = "primary",
  ...props
}) => {
  const baseClasses = "btn";
  const variantClasses = variant === "primary" ? "btn-primary" : "btn-outline"; // Ajusta btn-outline si tienes otra clase para outline

  return (
    <NextLink
      href={href}
      className={cn(baseClasses, variantClasses, className)} // Aplicar clases base, de variante y opcionales
      {...props}
    >
      {children}
    </NextLink>
  );
};

export default CustomButton;
