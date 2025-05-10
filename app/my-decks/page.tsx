import { MainNav } from '@/components/main-nav';
import { MyDecks } from '@/components/my-decks';

export default function MyDecksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-6">Meus Decks</h1>
          <MyDecks />
        </div>
      </main>
    </div>
  );
}