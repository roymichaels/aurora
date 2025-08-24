import { setProfileKey } from '@/data/profile';
import { setMemoryKey } from '@/memory/indexedDbMemory';
import { setDataKey } from './keyManager';

export function setEncryptionKey(key: string) {
  setProfileKey(key);
  setMemoryKey(key);
  setDataKey(new TextEncoder().encode(key));
}

