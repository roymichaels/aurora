import { setProfileKey } from '@/data/profile';
import { setMemoryKey } from '@/memory/indexedDbMemory';

export function setEncryptionKey(key: string) {
  setProfileKey(key);
  setMemoryKey(key);
}

