import { useState, useCallback } from 'react';
import { supabase, type Pin } from '@/lib/supabase';
import { useAuth } from './useAuth';

interface UsePinsReturn {
  pins: Pin[];
  isLoading: boolean;
  error: string | null;
  fetchPins: (status?: Pin['status']) => Promise<void>;
  createPin: (pin: Omit<Pin, 'id' | 'created_at' | 'user_id'>) => Promise<Pin | null>;
  updatePin: (pinId: string, updates: Partial<Pin>) => Promise<Pin | null>;
  deletePin: (pinId: string) => Promise<void>;
  schedulePin: (pinId: string, scheduledAt: string) => Promise<Pin | null>;
  publishPin: (pinId: string) => Promise<Pin | null>;
}

export function usePins(): UsePinsReturn {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPins = useCallback(async (status?: Pin['status']) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('pins')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error: supabaseError } = await query;
      
      if (supabaseError) throw supabaseError;
      setPins(data as Pin[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pins');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createPin = useCallback(async (pin: Omit<Pin, 'id' | 'created_at' | 'user_id'>) => {
    if (!user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('pins')
        .insert([{ ...pin, user_id: user.id }])
        .select()
        .single();
      
      if (supabaseError) throw supabaseError;
      
      const newPin = data as Pin;
      setPins(prev => [newPin, ...prev]);
      return newPin;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pin');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const updatePin = useCallback(async (pinId: string, updates: Partial<Pin>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('pins')
        .update(updates)
        .eq('id', pinId)
        .select()
        .single();
      
      if (supabaseError) throw supabaseError;
      
      const updatedPin = data as Pin;
      setPins(prev => prev.map(p => p.id === pinId ? updatedPin : p));
      return updatedPin;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pin');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deletePin = useCallback(async (pinId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: supabaseError } = await supabase
        .from('pins')
        .delete()
        .eq('id', pinId);
      
      if (supabaseError) throw supabaseError;
      
      setPins(prev => prev.filter(p => p.id !== pinId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pin');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const schedulePin = useCallback(async (pinId: string, scheduledAt: string) => {
    return updatePin(pinId, { 
      scheduled_at: scheduledAt, 
      status: 'scheduled' 
    });
  }, [updatePin]);

  const publishPin = useCallback(async (pinId: string) => {
    return updatePin(pinId, { 
      status: 'published', 
      published_at: new Date().toISOString() 
    });
  }, [updatePin]);

  return {
    pins,
    isLoading,
    error,
    fetchPins,
    createPin,
    updatePin,
    deletePin,
    schedulePin,
    publishPin,
  };
}
