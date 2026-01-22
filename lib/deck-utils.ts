import { Card } from '@/lib/types';

export function isExtraDeckCard(card: Card) {
  const extraDeckTypes = [
    'Fusion Monster', 
    'Synchro Monster', 
    'XYZ Monster', 
    'Link Monster'
  ];
  
  return extraDeckTypes.some(type => card.type && card.type.includes(type));
}

export function getDeckStats(mainDeck: Card[], extraDeck: Card[]) {
  // Count card types
  const monsterCount = mainDeck.filter(card => card.type && card.type.includes('Monster') && !isExtraDeckCard(card)).length;
  const spellCount = mainDeck.filter(card => card.type === 'Spell Card').length;
  const trapCount = mainDeck.filter(card => card.type === 'Trap Card').length;
  const extraCount = extraDeck.length;
  const total = mainDeck.length;
  
  return {
    monsterCount,
    spellCount,
    trapCount,
    extraCount,
    total,
  };
}

export function countCardCopies(cards: Card[], cardName: string) {
  return cards.filter(card => card.name === cardName).length;
}

