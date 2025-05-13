import type { FC } from 'react';
import { BookMarked } from 'lucide-react';

interface HeaderProps {
  title: string;
}

const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center">
        <BookMarked className="h-7 w-7 mr-3 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
