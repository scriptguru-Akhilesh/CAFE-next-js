import { CafeTable } from '../types';
import { DEFAULT_TABLES } from '../data/defaultTables';

const TABLE_STORAGE_KEY = 'cafe_tables_list_simple_v2';
const TABLE_BROADCAST_CHANNEL = 'cafe_tables_channel_simple_v2';

class TableStorageManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(tables: CafeTable[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(TABLE_BROADCAST_CHANNEL);
          this.channel.onmessage = (event) => {
            if (event.data?.type === 'TABLES_UPDATED') {
              const tables = this.getTables();
              this.notifyListeners(tables);
            }
          };
        }

        window.addEventListener('storage', (e) => {
          if (e.key === TABLE_STORAGE_KEY) {
            const tables = this.getTables();
            this.notifyListeners(tables);
          }
        });
      } catch (e) {
        console.warn('BroadcastChannel not supported for tables', e);
      }
    }
  }

  public getTables(): CafeTable[] {
    if (typeof window === 'undefined') return DEFAULT_TABLES;
    try {
      const raw = localStorage.getItem(TABLE_STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(DEFAULT_TABLES));
        return DEFAULT_TABLES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: any) => ({
          id: String(t.id || `tbl-${t.number || Math.random()}`),
          name: String(t.name || `Table ${t.number || 1}`),
          number: String(t.number || '1'),
          createdAt: Number(t.createdAt) || Date.now(),
        }));
      }
      return DEFAULT_TABLES;
    } catch {
      return DEFAULT_TABLES;
    }
  }

  public setTables(tables: CafeTable[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(tables));
      this.channel?.postMessage({ type: 'TABLES_UPDATED', timestamp: Date.now() });
      this.notifyListeners(tables);
    } catch (e) {
      console.error('Failed to save tables to storage', e);
    }
  }

  public addTable(nameInput: string, numberInput?: string): CafeTable {
    const trimmedName = nameInput.trim() || 'New Table';
    let derivedNumber = (numberInput || '').trim();
    
    if (!derivedNumber) {
      // If user entered "Table 9", extract "9" or use table count + 1
      const match = trimmedName.match(/\d+/);
      if (match) {
        derivedNumber = match[0];
      } else {
        const current = this.getTables();
        derivedNumber = String(current.length + 1);
      }
    }

    const id = `tbl-${Date.now().toString().slice(-6)}`;
    const newTable: CafeTable = {
      id,
      name: trimmedName,
      number: derivedNumber,
      createdAt: Date.now(),
    };

    const current = this.getTables();
    const updated = [newTable, ...current.filter((t) => t.number !== newTable.number && t.id !== newTable.id)];
    this.setTables(updated);
    return newTable;
  }

  public updateTable(id: string, name: string, number?: string): CafeTable | null {
    const current = this.getTables();
    let updatedTable: CafeTable | null = null;
    const updated = current.map((table) => {
      if (table.id === id || table.number === id) {
        const finalNumber = number ? number.trim() : table.number;
        updatedTable = {
          ...table,
          name: name.trim() || table.name,
          number: finalNumber,
        };
        return updatedTable;
      }
      return table;
    });

    if (updatedTable) {
      this.setTables(updated);
    }
    return updatedTable;
  }

  public deleteTable(id: string): void {
    const current = this.getTables();
    const updated = current.filter((table) => table.id !== id && table.number !== id);
    this.setTables(updated);
  }

  public resetToDefaults(): CafeTable[] {
    this.setTables(DEFAULT_TABLES);
    return DEFAULT_TABLES;
  }

  public subscribe(listener: (tables: CafeTable[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getTables());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(tables: CafeTable[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(tables);
      } catch (err) {
        console.error('Error in table listener:', err);
      }
    });
  }
}

export const tableStorage = new TableStorageManager();
