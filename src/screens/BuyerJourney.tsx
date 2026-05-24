import React, { useEffect } from 'react';
import { useLocation, useParams, Navigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { OnboardingView } from '../components/buyer-flow/OnboardingView';
import { HomeFeedView } from '../components/buyer-flow/HomeFeedView';
import { ShopsView } from '../components/buyer-flow/ShopsView';
import { ShopProfileView } from '../components/buyer-flow/ShopProfileView';
import { WishlistView } from '../components/buyer-flow/WishlistView';
import { NotificationsView } from '../components/buyer-flow/NotificationsView';
import { CommunityFlow } from '../components/community-flow/CommunityFlow';
import { BestDresserEntryView } from '../components/community-flow/BestDresserEntryView';
import { QuizView } from '../components/community-flow/QuizView';
import { QuizResultView } from '../components/community-flow/QuizResultView';
import { MusifyView } from '../components/musify/MusifyView';
import { EventsView } from '../components/culture-flow/EventsView';
import { FashionFeedView } from '../components/culture-flow/FashionFeedView';
import { BuildAFitView } from '../components/culture-flow/BuildAFitView';
import { ProductDetail } from './ProductDetail';
import { Search } from './Search';

export const BuyerJourney: React.FC = () => {
  const { 
    buyerFlowState, 
    setBuyerFlowState, 
    setCurrentProductId, 
    setCurrentShopId, 
    setCommunityScreen,
    communityScreen,
    currentShopId,
    currentProductId
  } = useInventory();
  const { session, isGuest } = useAuth();
  const location = useLocation();
  const params = useParams();

  const slidesDone = localStorage.getItem('onboarding_slides_done') === 'true';

  // Sync state with routes for deep links
  useEffect(() => {
    // Only override to 'home' if we're not currently in onboarding mode at root
    if (location.pathname === '/' && buyerFlowState !== 'home' && buyerFlowState !== 'onboarding') {
      setBuyerFlowState('home');
    }
    else if (location.pathname === '/shops' && buyerFlowState !== 'shops') {
      setBuyerFlowState('shops');
    }
    else if (location.pathname === '/search' && buyerFlowState !== 'search') {
      setBuyerFlowState('search');
    }
    else if (location.pathname === '/saved-items' && buyerFlowState !== 'wishlist') {
      setBuyerFlowState('wishlist');
    }
    else if (location.pathname === '/notifications' && buyerFlowState !== 'notifications') {
      setBuyerFlowState('notifications');
    }
    else if (location.pathname === '/musify') {
      if (buyerFlowState !== 'musify') setBuyerFlowState('musify');
    }
    else if (location.pathname === '/culture') {
      if (buyerFlowState !== 'feed') setBuyerFlowState('feed');
    }
    else if (location.pathname === '/feed') {
      if (buyerFlowState !== 'feed') setBuyerFlowState('feed');
    }
    else if (location.pathname === '/events') {
      if (buyerFlowState !== 'events') setBuyerFlowState('events');
    }
    else if (location.pathname === '/build-a-fit') {
      if (buyerFlowState !== 'build-a-fit') setBuyerFlowState('build-a-fit');
    }
    else if (location.pathname === '/quiz') {
       if (buyerFlowState !== 'quiz' && buyerFlowState !== 'quizResult') {
         setBuyerFlowState('quiz');
       }
    }
    else if (location.pathname.startsWith('/shop/') && params.id) {
       if (currentShopId !== params.id) setCurrentShopId(params.id);
       if (buyerFlowState !== 'shopProfile') setBuyerFlowState('shopProfile');
    }
    else if (location.pathname.startsWith('/product/') && params.id) {
       if (currentProductId !== params.id) setCurrentProductId(params.id);
       if (buyerFlowState !== 'productDetail') setBuyerFlowState('productDetail');
    }
  }, [location.pathname, params.id, buyerFlowState, currentShopId, currentProductId, setBuyerFlowState, setCurrentProductId, setCurrentShopId, setCommunityScreen]);

  switch (buyerFlowState) {
    case 'onboarding':
      return <OnboardingView />;
    case 'home':
      return <HomeFeedView />;
    case 'shops':
      return <ShopsView />;
    case 'shopProfile':
      return <ShopProfileView />;
    case 'wishlist':
      return <WishlistView />;
    case 'bestDresser':
      return <CommunityFlow />;
    case 'bestDresserEntry':
      return <BestDresserEntryView />;
    case 'quiz':
      return <QuizView />;
    case 'quizResult':
      return <QuizResultView />;
    case 'musify':
      return <MusifyView />;
    case 'events':
      return <EventsView />;
    case 'feed':
      return <FashionFeedView />;
    case 'build-a-fit':
      return <BuildAFitView />;
    case 'notifications':
      return <NotificationsView />;
    case 'search':
      return <Search />;
    case 'productDetail':
      return <ProductDetail />;
    default:
      return <HomeFeedView />;
  }
};
