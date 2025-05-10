import { MainNav } from '@/components/main-nav';
import { CardSearch } from '@/components/card-search';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold mb-2">Yu-Gi-Oh! Deck Builder</h1>
            <p className="text-muted-foreground">Busque, construa e gerencie seus decks de Yu-Gi-Oh!</p>
          </div>
          
          <CardSearch />
          
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Dados fornecidos pela API YGOPRODeck. Este projeto não é afiliado com Konami ou Yu-Gi-Oh!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}