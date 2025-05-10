import { MainNav } from '@/components/main-nav';
import { DeckBuilder } from '@/components/deck-builder';

export default function DeckBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="w-full mx-auto px-4 py-6">
          <DeckBuilder />
        </div>
      </main>
    </div>
  );
}