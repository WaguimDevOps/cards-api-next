"use client"

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { CardGrid } from '@/components/card-grid';

export function CardSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    attribute: 'all',
    level: 'all',
    race: 'all',
  });
  
  // Busca inicial quando o componente montar
  useEffect(() => {
    searchCards();
  }, []);

  // Busca quando os filtros ou página mudarem
  useEffect(() => {
    searchCards();
  }, [filters, page]);

  // Busca quando o termo de busca mudar (com debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      searchCards();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);
  
  const searchCards = async () => {
    setLoading(true);
    
    try {
      let url = 'https://db.ygoprodeck.com/api/v7/cardinfo.php?';
      
      // Add pagination
      url += `num=20&offset=${(page - 1) * 20}`;
      
      // Add search term if present
      if (searchTerm) {
        url += `&fname=${encodeURIComponent(searchTerm)}`;
      }
      
      // Add filters if present
      if (filters.type !== 'all') {
        url += `&type=${encodeURIComponent(filters.type)}`;
      }
      
      if (filters.attribute !== 'all') {
        url += `&attribute=${encodeURIComponent(filters.attribute)}`;
      }
      
      if (filters.level !== 'all') {
        url += `&level=${encodeURIComponent(filters.level)}`;
      }
      
      if (filters.race !== 'all') {
        url += `&race=${encodeURIComponent(filters.race)}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      setCards(data.data || []);
      setTotalCards(data.meta?.total_rows || 0);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-2xl font-bold mb-4">Buscar Cartas</h2>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nome da carta..."
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Buscar
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={filters.type}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="Effect Monster">Monstro de Efeito</SelectItem>
                  <SelectItem value="Normal Monster">Monstro Normal</SelectItem>
                  <SelectItem value="Fusion Monster">Monstro de Fusão</SelectItem>
                  <SelectItem value="Synchro Monster">Monstro Sincro</SelectItem>
                  <SelectItem value="XYZ Monster">Monstro XYZ</SelectItem>
                  <SelectItem value="Link Monster">Monstro Link</SelectItem>
                  <SelectItem value="Spell Card">Carta Mágica</SelectItem>
                  <SelectItem value="Trap Card">Carta Armadilha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Atributo</label>
              <Select
                value={filters.attribute}
                onValueChange={(value) => handleFilterChange('attribute', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Atributos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Atributos</SelectItem>
                  <SelectItem value="DARK">DARK</SelectItem>
                  <SelectItem value="LIGHT">LIGHT</SelectItem>
                  <SelectItem value="EARTH">EARTH</SelectItem>
                  <SelectItem value="WATER">WATER</SelectItem>
                  <SelectItem value="FIRE">FIRE</SelectItem>
                  <SelectItem value="WIND">WIND</SelectItem>
                  <SelectItem value="DIVINE">DIVINE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Nível</label>
              <Select
                value={filters.level}
                onValueChange={(value) => handleFilterChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Níveis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Monstro</label>
              <Select
                value={filters.race}
                onValueChange={(value) => handleFilterChange('race', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="Aqua">Aqua</SelectItem>
                  <SelectItem value="Beast">Besta</SelectItem>
                  <SelectItem value="Beast-Warrior">Besta-Guerreiro</SelectItem>
                  <SelectItem value="Cyberse">Cibernético</SelectItem>
                  <SelectItem value="Dinosaur">Dinossauro</SelectItem>
                  <SelectItem value="Divine-Beast">Besta Divina</SelectItem>
                  <SelectItem value="Dragon">Dragão</SelectItem>
                  <SelectItem value="Fairy">Fada</SelectItem>
                  <SelectItem value="Fiend">Demônio</SelectItem>
                  <SelectItem value="Fish">Peixe</SelectItem>
                  <SelectItem value="Insect">Inseto</SelectItem>
                  <SelectItem value="Machine">Máquina</SelectItem>
                  <SelectItem value="Plant">Planta</SelectItem>
                  <SelectItem value="Psychic">Psíquico</SelectItem>
                  <SelectItem value="Pyro">Piro</SelectItem>
                  <SelectItem value="Reptile">Réptil</SelectItem>
                  <SelectItem value="Rock">Rocha</SelectItem>
                  <SelectItem value="Sea Serpent">Serpente Marinha</SelectItem>
                  <SelectItem value="Spellcaster">Mago</SelectItem>
                  <SelectItem value="Thunder">Trovão</SelectItem>
                  <SelectItem value="Warrior">Guerreiro</SelectItem>
                  <SelectItem value="Winged Beast">Besta Alada</SelectItem>
                  <SelectItem value="Zombie">Zumbi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : cards.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {totalCards} cartas encontradas
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (page > 1) {
                    setPage(p => p - 1);
                    searchCards();
                  }
                }}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <div className="text-sm">
                Página {page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPage(p => p + 1);
                  searchCards();
                }}
                disabled={page * 20 >= totalCards}
              >
                Próxima
              </Button>
            </div>
          </div>
          
          <CardGrid cards={cards} />
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Busque cartas para começar a construir seu deck.
          </p>
        </div>
      )}
    </div>
  );
}