import React, { useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const ZIMBABWE_TOWNS = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Masvingo',
  'Kwekwe',
  'Kadoma',
  'Chinhoyi',
  'Victoria Falls',
  'Bindura',
  'Marondera',
  'Zvishavane',
  'Chegutu',
  'Rusape',
  'Chiredzi',
  'Beit Bridge',
  'Kariba',
  'Hwange',
  'Norton',
  'Redcliff',
  'Chipinge',
  'Gokwe',
  'Mvurwi',
  'Karoi',
  'Shamva',
  'Nyanga',
  'Binga',
  'Plumtree',
  'Lupane',
  'Filabusi',
  'Gwanda',
  'Rutenga',
  'Triangle',
  'Chivhu',
  'Murewa',
  'Murehwa',
  'Wedza',
  'Centenary',
  'Mt Darwin',
  'Guruve',
  'Mazowe',
  'Epworth'
].sort((a, b) => {
  if (a === 'Harare' || a === 'Bulawayo') {
    if (b === 'Harare' || b === 'Bulawayo') {
      return a === 'Harare' ? -1 : 1;
    }
    return -1;
  }
  if (b === 'Harare' || b === 'Bulawayo') return 1;
  return a.localeCompare(b);
});

interface OnboardingProps {
  onComplete: (town?: string) => void;
  setOnboardingStep?: (step: any) => void;
  onboardingStep?: string;
}

export const TownSelector: React.FC<OnboardingProps> = ({ 
  onComplete, 
  setOnboardingStep,
  onboardingStep 
}) => {
  const { session } = useAuth();
  const [selectedTown, setSelectedTown] = useState(() => {
    return localStorage.getItem('thread_user_town') || '';
  });
  
  const [townSearch, setTownSearch] = useState('');
  const [savingTown, setSavingTown] = useState(false);

  const filteredTowns = useMemo(() => {
    const term = townSearch.trim().toLowerCase();
    if (term === '') return ZIMBABWE_TOWNS;
    return ZIMBABWE_TOWNS.filter(town =>
      town.toLowerCase().includes(term)
    );
  }, [townSearch]);

  const handleTownContinue = () => {
    if (!selectedTown) return;
    
    // Save to localStorage FIRST
    localStorage.setItem('thread_user_town', selectedTown);
    localStorage.setItem('thread_town_selected', 'true');
    
    // Navigate IMMEDIATELY
    if (onComplete) {
      onComplete(selectedTown);
    } else if (setOnboardingStep) {
      setOnboardingStep('style_picker');
    }
    
    // Save to Supabase in background
    if (session?.user?.id) {
      const saveToSupabase = async () => {
        try {
          await supabase
            .from('profiles')
            .update({ style_preferences: { town: selectedTown } })
            .eq('id', session.user.id);
          console.log('Town saved to profile style_preferences:', selectedTown);
        } catch (err) {
          console.error('Town save error (non-blocking):', err);
        }
      };
      saveToSupabase();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#000000',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* Skip Button */}
      <button
        onClick={() => {
          const defaultTown = 'Harare';
          localStorage.setItem('thread_user_town', defaultTown);
          localStorage.setItem('thread_town_selected', 'true');
          if (onComplete) {
            onComplete(defaultTown);
          } else if (setOnboardingStep) {
            setOnboardingStep('style_picker');
          }
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'transparent',
          border: 'none',
          color: '#666',
          fontSize: 13,
          cursor: 'pointer',
          padding: '8px 12px'
        }}
      >
        Skip
      </button>

      {/* Header */}
      <div style={{ paddingTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ 
          fontFamily: "'Pacifico', cursive", 
          color: '#FF2D78', 
          fontSize: 22, 
          margin: 0 
        }}>thread</h1>
        
        <h2 style={{ 
          color: 'white', 
          fontWeight: 'bold', 
          fontSize: 26, 
          textAlign: 'center', 
          marginTop: 20,
          padding: '0 24px'
        }}>
          Where are you based?
        </h2>
        <p style={{ 
          color: '#888', 
          fontSize: 14, 
          textAlign: 'center', 
          marginTop: 10,
          padding: '0 32px'
        }}>
          We'll show you shops and products near you first.
        </p>
      </div>

      {/* Search Input */}
      <div style={{ 
        margin: '24px 20px 12px',
        background: '#111111',
        border: '1px solid #222',
        borderRadius: 12,
        height: 50,
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ color: '#FF2D78', marginLeft: 14, fontSize: 16 }}>🔍</span>
        <input
          placeholder="Search your town..."
          style={{
            flex: 1,
            marginLeft: 10,
            fontSize: 15,
            color: 'white',
            background: 'transparent',
            border: 'none',
            outline: 'none'
          }}
          value={townSearch}
          onChange={e => setTownSearch(e.target.value)}
        />
      </div>

      {/* Towns List */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '0 20px',
        paddingBottom: 120
      }}>
        {filteredTowns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <p style={{ color: '#666', fontSize: 14 }}>No towns found</p>
            <p style={{ color: '#444', fontSize: 12, marginTop: 4 }}>Try a different spelling</p>
          </div>
        ) : (
          filteredTowns.map(town => (
            <div
              key={town}
              onClick={() => setSelectedTown(town)}
              style={{
                background: selectedTown === town ? 'rgba(255,45,120,0.08)' : '#111111',
                border: selectedTown === town ? '1.5px solid #FF2D78' : '1px solid #222',
                borderRadius: 12,
                padding: '16px 14px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📍</span>
                <span style={{ 
                  color: 'white', 
                  fontSize: 15, 
                  fontWeight: selectedTown === town ? '600' : '400' 
                }}>
                  {town}
                </span>
              </div>
              
              <div style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: selectedTown === town ? '#FF2D78' : 'transparent',
                border: selectedTown === town ? 'none' : '1.5px solid #444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {selectedTown === town && (
                  <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>✓</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Continue Button - Fixed Bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#000000',
        borderTop: '1px solid #111111',
        padding: '16px 20px 32px',
        zIndex: 100
      }}>
        <button
          onClick={handleTownContinue}
          disabled={!selectedTown || savingTown}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 999,
            border: 'none',
            background: selectedTown ? 'linear-gradient(135deg, #9B27AF, #FF2D78)' : '#1a1a1a',
            color: selectedTown ? 'white' : '#555',
            fontWeight: 'bold',
            fontSize: 15,
            cursor: selectedTown ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {selectedTown ? 'Continue →' : 'Select your town above'}
        </button>
      </div>
    </div>
  );
};

