"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Edit, Trash2, Copy, List, MoveRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card as CardType } from '@/lib/types';
import { getDeckStats, isExtraDeckCard } from '@/lib/deck-utils';
import { useToast } from '@/components/ui/use-toast';

interface SavedDeck {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  cards: CardType[];
  created_at: string;
  updated_at: string;
}

export function MyDecks() {
  const [decks, setDecks] = useState<SavedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importDeckName, setImportDeckName] = useState('');
  const [importMode, setImportMode] = useState<'text' | 'id'>('text');
  const [deckToDelete, setDeckToDelete] = useState<SavedDeck | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = () => {
    setLoading(true);
    try {
      const savedDecks = localStorage.getItem('yugioh_decks');
      if (savedDecks) {
        setDecks(JSON.parse(savedDecks));
      }
    } catch (error) {
      console.error('Error loading decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const editDeck = (deck: SavedDeck) => {
    window.location.href = `/deck-builder?deckId=${deck.id}`;
  };

  const deleteDeck = (deck: SavedDeck) => {
    setDeckToDelete(deck);
  };

  const confirmDelete = () => {
    if (deckToDelete) {
      const updatedDecks = decks.filter(d => d.id !== deckToDelete.id);
      localStorage.setItem('yugioh_decks', JSON.stringify(updatedDecks));
      setDecks(updatedDecks);
      
      if (selectedDeck?.id === deckToDelete.id) {
        setSelectedDeck(null);
      }

      toast({
        title: "Deck Excluído",
        description: `O deck "${deckToDelete.name}" foi excluído com sucesso.`,
      });

      setDeckToDelete(null);
    }
  };

  const duplicateDeck = (deck: SavedDeck) => {
    const newDeck = {
      ...deck,
      id: Date.now().toString(),
      name: `${deck.name} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const updatedDecks = [...decks, newDeck];
    localStorage.setItem('yugioh_decks', JSON.stringify(updatedDecks));
    setDecks(updatedDecks);
  };

  const handleImportDeck = async () => {
    if (!importDeckName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, dê um nome ao seu deck.",
      });
      return;
    }
    
    if (!importText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, cole a lista de cartas.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      let cardIdentifiers: string[] = [];
      
      if (importMode === 'id') {
        // Process YGOPRODeck format
        try {
          const data = JSON.parse(importText);
          if (Array.isArray(data)) {
            cardIdentifiers = data.slice(1);
          }
        } catch (e) {
          if (importText.includes(',')) {
            cardIdentifiers = importText.split(',').map(id => id.trim());
          } else {
            throw new Error('Formato YGOPRODeck inválido');
          }
        }
      } else {
        // Process text format
        const lines = importText.split('\n').map(line => line.trim()).filter(line => line);
        
        for (const line of lines) {
          if (line.startsWith('==') || line.startsWith('//') || line.startsWith('#')) {
            continue;
          }
          
          const match = line.match(/^(\d+)\s+(.+)$/);
          
          if (match) {
            const quantity = parseInt(match[1]);
            const cardName = match[2].trim();
            
            for (let i = 0; i < quantity; i++) {
              cardIdentifiers.push(cardName);
            }
          } else {
            cardIdentifiers.push(line);
          }
        }
      }
      
      // Fetch card data
      const cards: CardType[] = [];
      
      // Process in batches
      const batchSize = 20;
      
      for (let i = 0; i < cardIdentifiers.length; i += batchSize) {
        const batch = cardIdentifiers.slice(i, i + batchSize);
        
        if (importMode === 'id') {
          // Fetch by IDs
          const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${batch.join(',')}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.data && data.data.length > 0) {
              cards.push(...data.data);
            }
          }
        } else {
          // Fetch by names
          for (const name of batch) {
            try {
              const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(name)}`);
              
              if (response.ok) {
                const data = await response.json();
                
                if (data.data && data.data.length > 0) {
                  // Find best match
                  const normalizedSearch = name.toLowerCase().trim();
                  
                  // Try exact match first
                  const exactMatch = data.data.find((card: CardType) => 
                    card.name.toLowerCase() === normalizedSearch
                  );
                  
                  if (exactMatch) {
                    cards.push(exactMatch);
                  } else {
                    // Try partial match
                    const partialMatches = data.data.filter((card: CardType) => 
                      card.name.toLowerCase().includes(normalizedSearch) || 
                      normalizedSearch.includes(card.name.toLowerCase())
                    );
                    
                    if (partialMatches.length > 0) {
                      cards.push(partialMatches.sort((a: CardType, b: CardType) => a.name.length - b.name.length)[0]);
                    }
                  }
                }
              }
            } catch (error) {
              console.error(`Error fetching card "${name}":`, error);
            }
          }
        }
      }
      
      // Create and save deck
      if (cards.length > 0) {
        const newDeck: SavedDeck = {
          id: Date.now().toString(),
          name: importDeckName,
          description: '',
          thumbnail: '',
          cards: cards,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const updatedDecks = [...decks, newDeck];
        localStorage.setItem('yugioh_decks', JSON.stringify(updatedDecks));
        setDecks(updatedDecks);
        
        setIsImportOpen(false);
        setImportText('');
        setImportDeckName('');
        
        toast({
          title: "Sucesso",
          description: `Deck importado com sucesso! Foram encontradas ${cards.length} cartas.`,
        });
      } else {
        toast({
          title: "Erro",
          description: 'Nenhuma carta foi encontrada. Verifique o formato importado.',
        });
      }
    } catch (error) {
      console.error('Error importing deck:', error);
      toast({
        title: "Erro",
        description: `Erro ao importar deck: ${error}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
              <p className="text-muted-foreground">
                {decks.length === 0 
                  ? 'Você ainda não possui decks salvos.'
                  : `${decks.length} deck${decks.length !== 1 ? 's' : ''} encontrado${decks.length !== 1 ? 's' : ''}.`
                }
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsImportOpen(true)}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Importar Deck
              </Button>
              <Button asChild className="gap-2">
                <Link href="/deck-builder">
                  <Plus className="h-4 w-4" />
                  Novo Deck
                </Link>
              </Button>
            </div>
          </div>
          
          {decks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="rounded-full bg-muted p-3">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Sem decks</h3>
                  <p className="text-muted-foreground">
                    Crie um novo deck ou importe um existente.
                  </p>
                  <Button asChild>
                    <Link href="/deck-builder">
                      Criar Deck
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {decks.map((deck) => {
                const cardImg = deck.thumbnail || (deck.cards.length > 0 && deck.cards[0].card_images
                  ? deck.cards[0].card_images[0].image_url
                  : "https://images.ygoprodeck.com/images/cards/back_card.jpg");
                
                const stats = getDeckStats(
                  deck.cards.filter(card => !isExtraDeckCard(card)),
                  deck.cards.filter(card => isExtraDeckCard(card))
                );
                
                return (
                  <Card key={deck.id} className="overflow-hidden">
                    <div 
                      className="aspect-video relative cursor-pointer"
                      onClick={() => setSelectedDeck(deck)}
                    >
                      <Image
                        src={cardImg}
                        alt={deck.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                        <h3 className="text-lg font-bold text-white">
                          {deck.name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {stats.total} cartas ({stats.monsterCount} monstros, {stats.spellCount} mágicas, {stats.trapCount} armadilhas)
                        </p>
                      </div>
                    </div>
                    <CardFooter className="p-2 border-t bg-muted/40 justify-between">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => setSelectedDeck(deck)}
                        title="Ver deck"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => editDeck(deck)}
                        title="Editar deck"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => duplicateDeck(deck)}
                        title="Duplicar deck"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                        onClick={() => deleteDeck(deck)}
                        title="Excluir deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Deck Viewer Dialog */}
          <Dialog open={!!selectedDeck} onOpenChange={(open) => !open && setSelectedDeck(null)}>
            <DialogContent className="sm:max-w-[80vw] max-h-[90vh] overflow-y-auto">
              {selectedDeck && (
                <>
                  <DialogHeader>
                    <DialogTitle>{selectedDeck.name}</DialogTitle>
                    {selectedDeck.description && (
                      <DialogDescription>
                        {selectedDeck.description}
                      </DialogDescription>
                    )}
                  </DialogHeader>
                  
                  <div className="mt-4">
                    <Tabs defaultValue="main" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="main">
                          Main Deck ({selectedDeck.cards.filter(card => !isExtraDeckCard(card)).length})
                        </TabsTrigger>
                        <TabsTrigger value="extra">
                          Extra Deck ({selectedDeck.cards.filter(card => isExtraDeckCard(card)).length})
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="main" className="mt-4">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {selectedDeck.cards
                            .filter(card => !isExtraDeckCard(card))
                            .map((card, index) => (
                              <div 
                                key={`main-${card.id}-${index}`}
                                className="relative border rounded overflow-hidden"
                              >
                                <div className="aspect-[3/4.4] relative">
                                  <Image
                                    src={card.card_images[0].image_url_small || card.card_images[0].image_url}
                                    alt={card.name}
                                    fill
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="p-1">
                                  <p className="text-xs truncate" title={card.name}>
                                    {card.name}
                                  </p>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="extra" className="mt-4">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                          {selectedDeck.cards
                            .filter(card => isExtraDeckCard(card))
                            .map((card, index) => (
                              <div 
                                key={`extra-${card.id}-${index}`}
                                className="relative border rounded overflow-hidden"
                              >
                                <div className="aspect-[3/4.4] relative">
                                  <Image
                                    src={card.card_images[0].image_url_small || card.card_images[0].image_url}
                                    alt={card.name}
                                    fill
                                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 16vw, 12.5vw"
                                    className="object-cover"
                                  />
                                </div>
                                <div className="p-1">
                                  <p className="text-xs truncate" title={card.name}>
                                    {card.name}
                                  </p>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedDeck(null)}
                    >
                      Fechar
                    </Button>
                    <Button 
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (selectedDeck) {
                          duplicateDeck(selectedDeck);
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </Button>
                    <Button 
                      className="gap-2"
                      onClick={() => {
                        if (selectedDeck) {
                          editDeck(selectedDeck);
                        }
                      }}
                    >
                      <MoveRight className="h-4 w-4" />
                      Editar no Deck Builder
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={!!deckToDelete} onOpenChange={(open) => !open && setDeckToDelete(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir Deck</DialogTitle>
                <DialogDescription>
                  Tem certeza que deseja excluir o deck &quot;{deckToDelete?.name}&quot;? Esta ação não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeckToDelete(null)}>
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                >
                  Excluir
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Import Deck Dialog */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Importar Deck</DialogTitle>
                <DialogDescription>
                  Cole a lista de cartas no formato de texto ou IDs.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs 
                defaultValue="text" 
                value={importMode} 
                onValueChange={(value) => setImportMode(value as 'text' | 'id')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Importar por Texto</TabsTrigger>
                  <TabsTrigger value="id">Importar por IDs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Cole a lista de cartas no formato: quantidade + nome da carta (uma por linha)
                  </p>
                  <Textarea 
                    placeholder="1 Blue-Eyes White Dragon&#10;3 Dark Magician&#10;2 Pot of Greed"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                  />
                </TabsContent>
                
                <TabsContent value="id" className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Cole a lista de IDs das cartas (formato YGOPRODeck)
                  </p>
                  <Textarea 
                    placeholder='["Exported from YGOPRODeck","89631139","89631139","38517737",...]'
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    rows={10}
                  />
                </TabsContent>
              </Tabs>
              
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Deck</label>
                  <Input
                    value={importDeckName}
                    onChange={(e) => setImportDeckName(e.target.value)}
                    placeholder="Ex: Blue-Eyes Dragon Deck"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleImportDeck} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Importar Deck'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}