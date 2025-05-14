import type { FC } from "react";
import AegisPadLogoIcon from "./aegis-pad-logo-icon"; // Import the new logo
import LanguageSwitcher from "./language-switcher"; // Importar el LanguageSwitcher

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <AegisPadLogoIcon className="mr-3" /> {/* Use the new logo */}
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        <div>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
};

export default Header;
