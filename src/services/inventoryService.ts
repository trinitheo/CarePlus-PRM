import { mockDbService } from '../lib/mockDatabase';

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
}

export async function getInventory() {
  return mockDbService.getCollection('inventory');
}

export async function updateStock(itemId: string, delta: number) {
  const item = mockDbService.getDoc('inventory', itemId);
  if (item) {
    mockDbService.updateItem('inventory', itemId, {
      stockLevel: (item.stockLevel || 0) + delta
    });
  }
}

export async function restockItem(itemId: string, amount: number) {
  const item = mockDbService.getDoc('inventory', itemId);
  if (item) {
    mockDbService.updateItem('inventory', itemId, {
      stockLevel: (item.stockLevel || 0) + amount,
      lastRestockedAt: { seconds: Math.floor(Date.now() / 1000) }
    });
  }
}
