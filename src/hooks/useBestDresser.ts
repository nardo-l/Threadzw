import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const useBestDresser = () => {
  const { user } = useAuth();
  const [nominees, setNominees] = useState<any[]>([]);
  const [currentRound, setCurrentRound] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNominees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('best_dresser_entries')
        .select('*')
        .eq('status', 'Approved — Nominated')
        .order('vote_count', { ascending: false });

      if (err) throw err;
      const mapped = (data || []).map(n => ({
        ...n,
        votes: n.vote_count
      }));
      setNominees(mapped);
      
      // For demo purposes, we'll set a round if not found
      setCurrentRound('Quarter Finals Live');
    } catch (err: any) {
      console.error('Error fetching nominees:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNominees();
  }, [fetchNominees]);

  return { nominees, currentRound, loading, error, refetch: fetchNominees };
};
