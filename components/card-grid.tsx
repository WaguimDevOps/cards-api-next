"use client"

import { useState } from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CardGridProps {
  cards: CardType[];
}

export function CardGrid({ cards }: CardGridProps) {
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden transition-transform hover:scale-105"
            onClick={() => setSelectedCard(card)}
          >
            <div className="aspect-[3/4.4] relative overflow-hidden bg-muted">
              <Image
                src={card.card_images[0].image_url}
                alt={card.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 16vw"
                className="object-cover"
                priority={false}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-medium text-sm px-2 py-1 bg-black/70 rounded">
                  Ver detalhes
                </span>
              </div>
            </div>
            <div className="p-2">
              <h3 className="text-sm font-medium truncate">{card.name}</h3>
              <p className="text-xs text-muted-foreground">{card.type}</p>
            </div>
          </div>
        ))}
      </div>
      
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          {selectedCard && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedCard.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <div className="relative w-full max-w-[240px] aspect-[3/4.4]">
                    <Image
                      src={selectedCard.card_images[0].image_url}
                      alt={selectedCard.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 240px"
                      priority
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Tipo:</span>
                    <span className="text-sm ml-2">{selectedCard.type}</span>
                  </div>
                  
                  {selectedCard.attribute && (
                    <div>
                      <span className="text-sm font-medium">Atributo:</span>
                      <span className="text-sm ml-2">{selectedCard.attribute}</span>
                    </div>
                  )}
                  
                  {selectedCard.level && (
                    <div>
                      <span className="text-sm font-medium">Nível:</span>
                      <span className="text-sm ml-2">{selectedCard.level}</span>
                    </div>
                  )}
                  
                  {selectedCard.race && (
                    <div>
                      <span className="text-sm font-medium">Tipo:</span>
                      <span className="text-sm ml-2">{selectedCard.race}</span>
                    </div>
                  )}
                  
                  {selectedCard.atk !== undefined && (
                    <div>
                      <span className="text-sm font-medium">ATK/DEF:</span>
                      <span className="text-sm ml-2">
                        {selectedCard.atk} / {selectedCard.def !== undefined ? selectedCard.def : '?'}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium">Descrição:</span>
                    <p className="text-sm mt-1">{selectedCard.desc}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setSelectedCard(null)}>
                  Fechar
                </Button>
                <Button asChild>
                  <Link href="/deck-builder">
                    Adicionar ao Deck
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}