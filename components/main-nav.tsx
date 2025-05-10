"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function MainNav() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Yu-Gi-Oh! Deck Builder
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              Buscar Cartas
            </Link>
            <Link 
              href="/deck-builder" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/deck-builder' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              Deck Builder
            </Link>
            <Link 
              href="/my-decks" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === '/my-decks' 
                  ? 'text-foreground' 
                  : 'text-muted-foreground'
              }`}
            >
              Meus Decks
            </Link>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}