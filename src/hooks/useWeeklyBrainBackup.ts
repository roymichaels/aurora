import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { exportEncryptedBrain } from '@/memory/brainBackup';

export default function useWeeklyBrainBackup() {
  const { user } = useSupabaseAuth();
  const [enabled] = useLocalStorage<boolean>('brain.backup.enabled', false);
  const [passphrase] = useLocalStorage<string>('brain.backup.passphrase', '');

  useEffect(() => {
    if (!user || !enabled || !passphrase) return;
    const key = 'brain.backup.last';
    const last = localStorage.getItem(key);
    const now = new Date();
    if (last) {
      const diff = now.getTime() - new Date(last).getTime();
      if (diff < 7 * 24 * 60 * 60 * 1000) return;
    }
    const run = async () => {
      try {
        const blob = await exportEncryptedBrain(passphrase);
        const path = `${user.id}/${now.toISOString()}.bin`;
        await supabase.storage.from('brain-backups').upload(path, blob);
      } catch (e) {
        console.error('Weekly brain backup failed', e);
      } finally {
        localStorage.setItem(key, now.toISOString());
      }
    };
    run();
  }, [user, enabled, passphrase]);
}
