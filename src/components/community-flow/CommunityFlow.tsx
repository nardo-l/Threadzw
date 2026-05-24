import React, { useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { CommunityHub } from './CommunityHub';
import { QuizView } from './QuizView';
import { QuizResultView } from './QuizResultView';
import { BestDresserMainView } from './BestDresserMainView';
import { BestDresserEntryView } from './BestDresserEntryView';
import { EntrySuccessView } from './EntrySuccessView';
import { BracketView } from './BracketView';
import { HallOfFameView } from './HallOfFameView';
import { ComingSoonScreen } from './ComingSoonScreen';

export const CommunityFlow: React.FC = () => {
  const { communityScreen } = useInventory();

  // Navigation Logic for Bottom Nav should be handled by Layout.tsx/BuyerJourney.tsx
  // based on communityScreen in InventoryContext.

  switch (communityScreen) {
    case 'hub':
      return <CommunityHub />;
    case 'quiz':
      return <QuizView />;
    case 'quizResult':
      return <QuizResultView />;
    case 'bestDresser':
      return <BestDresserMainView />;
    case 'bestDresserEntry':
      return <BestDresserEntryView />;
    case 'entrySuccess':
      return <EntrySuccessView />;
    case 'bracket':
      return <BracketView />;
    case 'hallOfFame':
      return <HallOfFameView />;
    default:
      return <CommunityHub />;
  }
};
