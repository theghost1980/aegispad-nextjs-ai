"use client";

import CustomButton from "@/components/custom-button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHiveAuth } from "@/hooks/use-hive-auth";
import { LogIn, LogOut, User } from "lucide-react"; // Iconos
import { useTranslations } from "next-intl";

export function UserAvatarDropdown() {
  const { isAuthenticated, hiveUsername, logout, isLoading } = useHiveAuth();
  const t = useTranslations("UserAvatarDropdown");

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <CustomButton href="/login" variant="outline">
        <LogIn className="mr-2 h-4 w-4" />
        {t("loginButton")}
      </CustomButton>
    );
  }

  if (!hiveUsername) return null;

  // Obtener las iniciales para el AvatarFallback
  const getInitials = (name: string) => {
    if (!name) return "?";
    const words = name.split(" ");
    if (words.length > 1) {
      return words[0][0].toUpperCase() + words[1][0].toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="User menu"
          className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full"
        >
          <Avatar>
            {/* Podrías añadir una AvatarImage si tuvieras URLs de avatares */}
            {/* <AvatarImage src="https://github.com/shadcn.png" alt={`@${hiveUsername}`} /> */}
            <AvatarFallback>{getInitials(hiveUsername)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {t("signedInAs")}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              @{hiveUsername}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <CustomButton href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>{t("profile")}</span>
          </CustomButton>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
