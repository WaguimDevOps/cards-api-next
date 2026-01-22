"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import Image from 'next/image';
import { Loader2, ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { isExtraDeckCard, getDeckStats } from '@/lib/deck-utils';
import { useSearchParams } from 'next/navigation';

interface SavedDeck {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  cards: Card[];
  created_at: string;
  updated_at: string;
}

interface DeckBuilderProps {
  deckId?: string;
}

export function DeckBuilder() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deckId');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState<Card[]>([]);
  const [mainDeck, setMainDeck] = useState<Card[]>([]);
  const [extraDeck, setExtraDeck] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [limitedCards, setLimitedCards] = useState<string[]>([]);
  const [semiLimitedCards, setSemiLimitedCards] = useState<string[]>([]);
  const [forbiddenCards, setForbiddenCards] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalCards, setTotalCards] = useState(0);
  const [filters, setFilters] = useState({
    type: 'all',
    attribute: 'all',
    level: 'all',
    race: 'all',
    linkval: 'all',
    scale: 'all',
  });
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [selectedThumbnail, setSelectedThumbnail] = useState<string>('');
  const [savedDecks, setSavedDecks] = useState<SavedDeck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [decksLoaded, setDecksLoaded] = useState(false); // Novo estado para controlar se os decks foram carregados

  useEffect(() => {
    loadBanlist();
    loadSavedDecks();
  }, []);

  // Modificar este useEffect para depender de decksLoaded
  useEffect(() => {
    if (decksLoaded && deckId && deckId !== 'new') {
      loadDeck(deckId);
    } else if (decksLoaded) {
      // Reset to new deck state
      setDeckName('');
      setDeckDescription('');
      setSelectedThumbnail('');
      setMainDeck([]);
      setExtraDeck([]);
      setSelectedDeckId('');
    }
  }, [deckId, decksLoaded]);

  useEffect(() => {
    searchCards();
  }, [filters, page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      searchCards();
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadBanlist = async () => {
    try {
      const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=tcg');
      const data = await response.json();
      
      if (data && data.data) {
        const limited: string[] = [];
        const semiLimited: string[] = [];
        const forbidden: string[] = [];
        
        data.data.forEach((card: Card) => {
          if (card.banlist_info && card.banlist_info.ban_tcg) {
            switch (card.banlist_info.ban_tcg) {
              case 'Limited':
                limited.push(card.id.toString());
                break;
              case 'Semi-Limited':
                semiLimited.push(card.id.toString());
                break;
              case 'Forbidden':
                forbidden.push(card.id.toString());
                break;
            }
          }
        });
        
        setLimitedCards(limited);
        setSemiLimitedCards(semiLimited);
        setForbiddenCards(forbidden);
      }
    } catch (error) {
      console.error('Error loading banlist:', error);
    }
  };

  const loadSavedDecks = () => {
    try {
      const decks = JSON.parse(localStorage.getItem('yugioh_decks') || '[]');
      setSavedDecks(decks);
      setDecksLoaded(true); // Marcar que os decks foram carregados
    } catch (error) {
      console.error('Error loading saved decks:', error);
      setDecksLoaded(true); // Mesmo em caso de erro, marcar como carregado
    }
  };

  const loadDeck = (deckId: string) => {
    const deck = savedDecks.find(d => d.id === deckId);
    if (deck) {
      setSelectedDeckId(deck.id);
      setDeckName(deck.name);
      setDeckDescription(deck.description);
      setSelectedThumbnail(deck.thumbnail || '');
      
      const mainCards = deck.cards.filter(card => !isExtraDeckCard(card));
      const extraCards = deck.cards.filter(card => isExtraDeckCard(card));
      
      setMainDeck(mainCards);
      setExtraDeck(extraCards);
    } else {
      // Se o deck não for encontrado, exibir uma mensagem
      toast({
        variant: "destructive",
        title: "Deck não encontrado",
        description: "O deck que você está tentando editar não foi encontrado.",
      });
    }
  };

  const getCardLimit = (cardId: string) => {
    if (forbiddenCards.includes(cardId)) {
      return 0;
    } else if (limitedCards.includes(cardId)) {
      return 1;
    } else if (semiLimitedCards.includes(cardId)) {
      return 2;
    } else {
      return 3;
    }
  };

  const countCardCopies = (cardName: string) => {
    const mainDeckCopies = mainDeck.filter(card => card.name === cardName).length;
    const extraDeckCopies = extraDeck.filter(card => card.name === cardName).length;
    return mainDeckCopies + extraDeckCopies;
  };

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
      
      if (filters.linkval !== 'all') {
        url += `&linkval=${encodeURIComponent(filters.linkval)}`;
      }
      
      if (filters.scale !== 'all') {
        url += `&scale=${encodeURIComponent(filters.scale)}`;
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

  const addCardToDeck = (card: Card) => {
    // Check if card is forbidden
    const cardLimit = getCardLimit(card.id.toString());
    if (cardLimit === 0) {
      toast({
        variant: "destructive",
        title: "Carta Proibida",
        description: `A carta "${card.name}" está proibida e não pode ser adicionada ao deck!`,
      });
      return;
    }

    // Check if it's an Extra Deck card
    if (isExtraDeckCard(card)) {
      // Check Extra Deck limit
      if (extraDeck.length >= 15) {
        toast({
          variant: "destructive",
          title: "Limite do Extra Deck",
          description: "O Extra Deck não pode ter mais de 15 cartas!",
        });
        return;
      }
      
      // Check copy limit
      const copiesInDeck = countCardCopies(card.name);
      
      if (copiesInDeck >= cardLimit) {
        toast({
          variant: "destructive",
          title: "Limite de Cópias",
          description: `Você já tem ${copiesInDeck} cópias de "${card.name}" no deck! O limite para esta carta é ${cardLimit}.`,
        });
        return;
      }
      
      setExtraDeck(prev => [...prev, card]);
      toast({
        title: "Carta Adicionada",
        description: `${card.name} foi adicionada ao Extra Deck.`,
      });
    } else {
      // Check Main Deck limit
      if (mainDeck.length >= 60) {
        toast({
          variant: "destructive",
          title: "Limite do Main Deck",
          description: "O Main Deck não pode ter mais de 60 cartas!",
        });
        return;
      }
      
      // Check copy limit
      const copiesInDeck = countCardCopies(card.name);
      
      if (copiesInDeck >= cardLimit) {
        toast({
          variant: "destructive",
          title: "Limite de Cópias",
          description: `Você já tem ${copiesInDeck} cópias de "${card.name}" no deck! O limite para esta carta é ${cardLimit}.`,
        });
        return;
      }
      
      setMainDeck(prev => [...prev, card]);
      toast({
        title: "Carta Adicionada",
        description: `${card.name} foi adicionada ao Main Deck.`,
      });
    }
  };

  const removeCardFromDeck = (card: Card, isMain: boolean) => {
    if (isMain) {
      setMainDeck(prev => {
        const index = prev.findIndex(c => c.id === card.id);
        if (index >= 0) {
          const newDeck = [...prev];
          newDeck.splice(index, 1);
          toast({
            title: "Carta Removida",
            description: `${card.name} foi removida do Main Deck.`,
          });
          return newDeck;
        }
        return prev;
      });
    } else {
      setExtraDeck(prev => {
        const index = prev.findIndex(c => c.id === card.id);
        if (index >= 0) {
          const newDeck = [...prev];
          newDeck.splice(index, 1);
          toast({
            title: "Carta Removida",
            description: `${card.name} foi removida do Extra Deck.`,
          });
          return newDeck;
        }
        return prev;
      });
    }
  };

  const saveDeck = () => {
    if (!deckName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, dê um nome ao seu deck.",
      });
      return;
    }

    const deck: SavedDeck = {
      id: selectedDeckId || Date.now().toString(),
      name: deckName,
      description: deckDescription,
      thumbnail: selectedThumbnail,
      cards: [...mainDeck, ...extraDeck],
      created_at: selectedDeckId ? localStorage.getItem('deck_created') || new Date().toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updatedDecks = selectedDeckId
      ? savedDecks.map(d => d.id === selectedDeckId ? deck : d)
      : [...savedDecks, deck];

    localStorage.setItem('yugioh_decks', JSON.stringify(updatedDecks));
    setSavedDecks(updatedDecks);

    toast({
      title: "Sucesso",
      description: `Deck ${selectedDeckId ? 'atualizado' : 'criado'} com sucesso!`,
    });

    // Redirect to my-decks page after saving
    //window.location.href = '/my-decks/';
  };

  const clearDeck = () => {
    setMainDeck([]);
    setExtraDeck([]);
    toast({
      title: "Deck Limpo",
      description: "Seu deck foi limpo com sucesso.",
    });
  };

  const stats = getDeckStats(mainDeck, extraDeck);

  // Adicionar função para agrupar cartas por tipo
  const groupCardsByType = (cards: Card[]) => {
    const groups: { [key: string]: Card[] } = {};
    cards.forEach(card => {
      const type = card.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(card);
    });
    return groups;
  };

  // Adicionar função para contar cartas por tipo
  const countCardsByType = (cards: Card[]) => {
    const counts: { [key: string]: number } = {};
    cards.forEach(card => {
      const type = card.type;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon">
            <Link href="/my-decks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Deck Builder</h1>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={clearDeck}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Limpar
          </Button>
          <Button 
            onClick={saveDeck}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>
      
      <div className="rounded-lg border bg-card p-4">
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Deck *</label>
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Ex: Blue-Eyes Deck"
                required
              />
            </div>
   
            <div className="space-y-2">
              <label className="text-sm font-medium">Thumbnail do Deck *</label>
              <Select
                value={selectedThumbnail}
                onValueChange={setSelectedThumbnail}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma carta para thumbnail" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Map([...mainDeck, ...extraDeck].map(card => [card.id, card])).values()).map((card) => {
                    const thumbnailUrl = card.card_images[0].image_url_cropped || card.card_images[0].image_url;
                    const previewUrl = card.card_images[0].image_url_cropped || card.card_images[0].image_url_small || card.card_images[0].image_url;
                    return (
                      <SelectItem key={card.id} value={thumbnailUrl}>
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8">
                            <Image
                              src={previewUrl}
                              alt={card.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <span>{card.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <h3 className="font-semibold">Estatísticas do Deck</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-muted p-2">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">{stats.total}/60</p>
              </div>
              <div className="rounded bg-muted p-2">
                <p className="text-xs text-muted-foreground">Extra Deck</p>
                <p className="text-lg font-semibold">{stats.extraCount}/15</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded bg-muted p-2">
                <p className="text-xs text-muted-foreground">Monstros</p>
                <p className="text-lg font-semibold">{stats.monsterCount}</p>
              </div>
              <div className="rounded bg-muted p-2">
                <p className="text-xs text-muted-foreground">Mágicas</p>
                <p className="text-lg font-semibold">{stats.spellCount}</p>
              </div>
              <div className="rounded bg-muted p-2">
                <p className="text-xs text-muted-foreground">Armadilhas</p>
                <p className="text-lg font-semibold">{stats.trapCount}</p>
              </div>
            </div>
            {stats.total < 40 && (
              <p className="text-amber-500 text-sm">
                Um deck deve ter no mínimo 40 cartas no Main Deck.
              </p>
            )}
            {stats.total > 60 && (
              <p className="text-amber-500 text-sm">
                Um deck não pode ter mais de 60 cartas no Main Deck.
              </p>
            )}
            {stats.extraCount > 15 && (
              <p className="text-amber-500 text-sm">
                O Extra Deck não pode ter mais de 15 cartas.
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card info panel */}
        <div className="lg:col-span-2 rounded-lg border bg-card p-4">
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-1 mb-4">
              <TabsTrigger value="info">Carta</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4">
              <div className="flex justify-center">
                <div className="relative w-full max-w-[240px] aspect-[3/4.4]">
                  <Image
                    src={selectedCard?.card_images?.[0]?.image_url || "https://cdn.ygorganization.com/2023/02/RUSH_CardBack.png"}
                    alt={selectedCard?.name || "Card Back"}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 240px"
                    priority
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{selectedCard?.name || "Selecione uma carta"}</h3>
                {selectedCard ? (
                  <div className="space-y-2 text-sm">
                    <p><strong>Tipo:</strong> {selectedCard.type}</p>
                    {selectedCard.attribute && (
                      <p><strong>Atributo:</strong> {selectedCard.attribute}</p>
                    )}
                    {selectedCard.level && (
                      <p><strong>Nível:</strong> {selectedCard.level}</p>
                    )}
                    {selectedCard.race && (
                      <p><strong>Tipo:</strong> {selectedCard.race}</p>
                    )}
                    {selectedCard.atk !== undefined && (
                      <p>
                        <strong>ATK/DEF:</strong> {selectedCard.atk} / {selectedCard.def !== undefined ? selectedCard.def : '?'}
                      </p>
                    )}
                    <p><strong>Descrição:</strong></p>
                    <p className="text-muted-foreground">{selectedCard.desc}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Clique em uma carta para ver seus detalhes.</p>
                )}
              </div>
              {selectedCard && (
                <Button 
                  className="w-full" 
                  onClick={() => addCardToDeck(selectedCard)}
                >
                  Adicionar ao Deck
                </Button>
              )}
            </TabsContent>
          </Tabs>
        </div>

            {/* Deck panel */}
        <div className="lg:col-span-6 rounded-lg border bg-card p-4">
          <Tabs defaultValue="main">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="main">Main Deck ({mainDeck.length})</TabsTrigger>
              <TabsTrigger value="extra">Extra Deck ({extraDeck.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="main">
             {mainDeck.length > 0 ? (
  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-10 lg:grid-cols-10 gap-2">
    {mainDeck.map((card, index) => (
      <div
        key={`main-${card.id}-${index}`}
        className="relative cursor-pointer border rounded overflow-hidden transition-all hover:ring-2 hover:ring-primary"
        onClick={() => setSelectedCard(card)}
        onDoubleClick={() => removeCardFromDeck(card, true)}
      >
        <div className="aspect-[3/4.4] relative">
          <Image
            src={card.card_images[0].image_url_small || card.card_images[0].image_url}
            alt={card.name}
            fill
            sizes="(max-width: 768px) 25vw, 16vw"
            className="object-cover"
          />
        </div>
        <div className="p-1 bg-background/80 backdrop-blur-sm">
          <p className="text-xs truncate" title={card.name}>
            {card.name}
          </p>
        </div>
      </div>
    ))}

  </div>

) : (
  <div className="flex flex-col items-center justify-center py-8">
    <p className="text-muted-foreground text-center">
      Seu main deck está vazio. Adicione cartas a partir da busca.
    </p>
  </div>
)}

<div>
{/* testando */}
{extraDeck.length > 0 ? (
                <div className="space-y-4">
                 
                    <div  className="space-y-2">
                   
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-10 lg:grid-cols-10 gap-2">
                      {extraDeck.map((card, index) => (
      <div
        key={`main-${card.id}-${index}`}
        className="relative cursor-pointer border rounded overflow-hidden transition-all hover:ring-2 hover:ring-primary"
        onClick={() => setSelectedCard(card)}
        onDoubleClick={() => removeCardFromDeck(card, true)}
      >
        <div className="aspect-[3/4.4] relative">
          <Image
            src={card.card_images[0].image_url_small || card.card_images[0].image_url}
            alt={card.name}
            fill
            sizes="(max-width: 768px) 25vw, 16vw"
            className="object-cover"
          />
        </div>
        <div className="p-1 bg-background/80 backdrop-blur-sm">
          <p className="text-xs truncate" title={card.name}>
            {card.name}
          </p>
        </div>
      </div>
    ))}
                      </div>
                    </div>
                
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground text-center">
                    Seu extra deck está vazio. Adicione cartas a partir da busca.
                  </p>
                </div>
              )}
</div>
{/* testando */}
            </TabsContent>
            
            <TabsContent value="extra">
              {extraDeck.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(groupCardsByType(extraDeck)).map(([type, cards]) => (
                    <div key={type} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">
                        {type} ({cards.length})
                      </h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {cards.map((card, index) => (
                          <div
                            key={`extra-${card.id}-${index}`}
                            className="relative cursor-pointer border rounded overflow-hidden transition-all hover:ring-2 hover:ring-primary"
                            onClick={() => setSelectedCard(card)}
                            onDoubleClick={() => removeCardFromDeck(card, false)}
                          >
                            <div className="aspect-[3/4.4] relative">
                              <Image
                                src={card.card_images[0].image_url_small || card.card_images[0].image_url}
                                alt={card.name}
                                fill
                                sizes="(max-width: 768px) 25vw, 16vw"
                                className="object-cover"
                              />
                            </div>
                            <div className="p-1 bg-background/80 backdrop-blur-sm">
                              <p className="text-xs truncate" title={card.name}>
                                {card.name}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground text-center">
                    Seu extra deck está vazio. Adicione cartas a partir da busca.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Card search & pool panel */}
        <div className="lg:col-span-4 rounded-lg border bg-card p-4">
          <h2 className="text-xl font-semibold mb-3">Buscar Cartas</h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome da carta..."
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <div>
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
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
              
              <div>
                <Select
                  value={filters.attribute}
                  onValueChange={(value) => handleFilterChange('attribute', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Atributo" />
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

              <div>
                <Select
                  value={filters.level}
                  onValueChange={(value) => handleFilterChange('level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Níveis</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((level) => (
                      <SelectItem key={level} value={level.toString()}>
                        Nível {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.race}
                  onValueChange={(value) => handleFilterChange('race', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Raça" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Raças</SelectItem>
                    <SelectItem value="Warrior">Guerreiro</SelectItem>
                    <SelectItem value="Spellcaster">Mago</SelectItem>
                    <SelectItem value="Fairy">Fada</SelectItem>
                    <SelectItem value="Fiend">Demônio</SelectItem>
                    <SelectItem value="Zombie">Zumbi</SelectItem>
                    <SelectItem value="Machine">Máquina</SelectItem>
                    <SelectItem value="Aqua">Aquático</SelectItem>
                    <SelectItem value="Pyro">Piro</SelectItem>
                    <SelectItem value="Rock">Rocha</SelectItem>
                    <SelectItem value="Winged Beast">Besta Alada</SelectItem>
                    <SelectItem value="Plant">Planta</SelectItem>
                    <SelectItem value="Insect">Inseto</SelectItem>
                    <SelectItem value="Thunder">Trovão</SelectItem>
                    <SelectItem value="Dragon">Dragão</SelectItem>
                    <SelectItem value="Beast">Besta</SelectItem>
                    <SelectItem value="Beast-Warrior">Besta-Guerreira</SelectItem>
                    <SelectItem value="Dinosaur">Dinossauro</SelectItem>
                    <SelectItem value="Fish">Peixe</SelectItem>
                    <SelectItem value="Sea Serpent">Serpente Marinha</SelectItem>
                    <SelectItem value="Reptile">Réptil</SelectItem>
                    <SelectItem value="Psychic">Psíquico</SelectItem>
                    <SelectItem value="Divine-Beast">Besta Divina</SelectItem>
                    <SelectItem value="Creator God">Deus Criador</SelectItem>
                    <SelectItem value="Wyrm">Wyrm</SelectItem>
                    <SelectItem value="Cyberse">Cyberse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.linkval}
                  onValueChange={(value) => handleFilterChange('linkval', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Link Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Ratings</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        Link {rating}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select
                  value={filters.scale}
                  onValueChange={(value) => handleFilterChange('scale', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escala Pendulum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Escalas</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((scale) => (
                      <SelectItem key={scale} value={scale.toString()}>
                        Escala {scale}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
          
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalCards > 0 ? `${totalCards} cartas encontradas` : 'Busque cartas...'}
            </span>
            
            {totalCards > 0 && (
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
                  disabled={page === 1 || loading}
                >
                  Anterior
                </Button>
                <span>
                  Página {page}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage(p => p + 1);
                    searchCards();
                  }}
                  disabled={page * 20 >= totalCards || loading}
                >
                  Próxima
                </Button>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 mt-4 pb-4 max-h-[500px] overflow-y-auto">
              {cards.map((card) => {
                const cardLimit = getCardLimit(card.id.toString());
                const copiesInDeck = countCardCopies(card.name);
                const remainingCopies = cardLimit - copiesInDeck;
                
                return (
                  <div
                    key={card.id}
                    className={`relative cursor-pointer border rounded overflow-hidden transition-all hover:ring-2 hover:ring-primary ${
                      cardLimit === 0 
                        ? 'opacity-40' 
                        : remainingCopies <= 0 
                          ? 'opacity-60' 
                          : ''
                    }`}
                    onClick={() => setSelectedCard(card)}
                    onDoubleClick={() => {
                      if (cardLimit > 0 && remainingCopies > 0) {
                        addCardToDeck(card);
                      }
                    }}
                  >
                    <div className="aspect-[3/4.4] relative">
                      <Image
                        src={card.card_images[0].image_url_small || card.card_images[0].image_url}
                        alt={card.name}
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover"
                      />
                      
                      {cardLimit === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl">🚫</span>
                        </div>
                      )}
                      
                      <div className={`absolute bottom-1 right-1 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold ${
                        cardLimit === 0 
                          ? 'bg-red-600 text-white' 
                          : remainingCopies <= 0 
                            ? 'bg-amber-600 text-white' 
                            : 'bg-green-600 text-white'
                      }`}>
                        {cardLimit === 0 ? 'X' : remainingCopies}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground text-center">
                Busque cartas para adicionar ao seu deck.
              </p>
            </div>
          )}
        </div>
        
    
      </div>
      <Toaster />
    </div>
  );
}