'use client';

import Link from 'next/link';
import { Hash } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <Link 
          href="/" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit"
        >
          <div className="h-8 w-8 text-primary">
            <Hash className="h-full w-full" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Tally
          </h1>
        </Link>
      </div>
    </header>
  );
}