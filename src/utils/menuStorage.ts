import { SimpleMenuItem } from '../types';
import { STATIC_MENU } from '../data/simpleMenu';

const MENU_STORAGE_KEY = 'cafe_menu_items_v1';
const MENU_BROADCAST_CHANNEL = 'cafe_menu_channel_v1';

class MenuStorageManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(menu: SimpleMenuItem[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(MENU_BROADCAST_CHANNEL);
          this.channel.onmessage = (event) => {
            if (event.data?.type === 'MENU_UPDATED') {
              const menu = this.getMenu();
              this.notifyListeners(menu);
            }
          };
        }

        window.addEventListener('storage', (e) => {
          if (e.key === MENU_STORAGE_KEY) {
            const menu = this.getMenu();
            this.notifyListeners(menu);
          }
        });
      } catch (e) {
        console.warn('BroadcastChannel not supported for menu', e);
      }
    }
  }

  public getMenu(): SimpleMenuItem[] {
    if (typeof window === 'undefined') return STATIC_MENU;
    try {
      const raw = localStorage.getItem(MENU_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(STATIC_MENU));
        return STATIC_MENU;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return STATIC_MENU;
    } catch {
      return STATIC_MENU;
    }
  }

  public setMenu(menu: SimpleMenuItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menu));
      this.channel?.postMessage({ type: 'MENU_UPDATED', timestamp: Date.now() });
      this.notifyListeners(menu);
    } catch (e) {
      console.error('Failed to save menu to storage', e);
    }
  }

  public addItem(item: Omit<SimpleMenuItem, 'id'>): SimpleMenuItem {
    const newItem: SimpleMenuItem = {
      ...item,
      id: `item-${Date.now()}`,
      available: item.available !== false,
      isVeg: item.isVeg !== false,
    };
    const current = this.getMenu();
    const updated = [...current, newItem];
    this.setMenu(updated);
    return newItem;
  }

  public updateItem(id: string, updates: Partial<SimpleMenuItem>): SimpleMenuItem | null {
    const current = this.getMenu();
    let updatedItem: SimpleMenuItem | null = null;
    const updated = current.map((item) => {
      if (item.id === id) {
        updatedItem = { ...item, ...updates };
        return updatedItem;
      }
      return item;
    });
    if (updatedItem) {
      this.setMenu(updated);
    }
    return updatedItem;
  }

  public deleteItem(id: string): void {
    const current = this.getMenu();
    const updated = current.filter((item) => item.id !== id);
    this.setMenu(updated);
  }

  public subscribe(listener: (menu: SimpleMenuItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(menu: SimpleMenuItem[]) {
    this.listeners.forEach((fn) => {
      try {
        fn(menu);
      } catch (e) {
        console.error('Error in menu storage listener', e);
      }
    });
  }
}

export const menuStorage = new MenuStorageManager();
