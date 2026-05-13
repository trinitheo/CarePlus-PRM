import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  increment 
} from 'firebase/firestore';
import { db } from './clinicalFirestoreService';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'consumables' | 'medications' | 'equipment';
  stockLevel: number;
  minThreshold: number;
  unit: string;
  expiryDate?: string;
  location: string;
  lastRestockedAt?: any;
  dependencies?: string[]; // IDs of related items
  supplier?: string;
  riskScore?: number; // 0-1 based on criticality/lead time
}

export async function getInventory() {
  const snap = await getDocs(collection(db, 'inventory'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
}

export async function updateStock(itemId: string, delta: number) {
  const ref = doc(db, 'inventory', itemId);
  await updateDoc(ref, {
    stockLevel: increment(delta),
    updatedAt: serverTimestamp()
  });
}

export async function restockItem(itemId: string, amount: number) {
  const ref = doc(db, 'inventory', itemId);
  await updateDoc(ref, {
    stockLevel: increment(amount),
    lastRestockedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
