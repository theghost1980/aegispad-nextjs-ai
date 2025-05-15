import AegisPadLogoIcon from "@/components/aegis-pad-logo-icon";
import type { FC } from "react";

interface LoaderProps {
  message?: string;
}

const SpinLoader: FC<LoaderProps> = ({ message = "Cargando..." }) => (
  <div className="flex flex-col items-center justify-center p-4">
    <AegisPadLogoIcon className="w-12 h-12 animate-spin text-primary" />
    <p className="mt-3 text-sm text-muted-foreground">{message}</p>
  </div>
);

export default SpinLoader;
