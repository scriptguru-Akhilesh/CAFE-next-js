import { KitchenOrder, OrderStatus, SimpleOrderItem } from '../types';
import data from '../data/data.json';

const ORDERS_STORAGE_KEY = 'cafe_kds_orders_v1';
const BROADCAST_CHANNEL_NAME = 'cafe_kds_channel_v1';

// Initial demo seed orders so kitchen is never blank on first launch
const INITIAL_DEMO_ORDERS: KitchenOrder[] = (data.orders as KitchenOrder[]).map((order, index) => ({
  ...order,
  createdAt: Date.now() - (index + 1) * 4 * 60 * 1000,
}));

class OrderStorageManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(orders: KitchenOrder[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
          this.channel.onmessage = (event) => {
            if (event.data?.type === 'ORDERS_UPDATED') {
              const orders = this.getOrders();
              this.notifyListeners(orders);
            }
          };
        }

        window.addEventListener('storage', (e) => {
          if (e.key === ORDERS_STORAGE_KEY) {
            const orders = this.getOrders();
            this.notifyListeners(orders);
          }
        });
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  // Get current orders from localStorage (fallback to initial demo seed)
  public getOrders(): KitchenOrder[] {
    if (typeof window === 'undefined') return INITIAL_DEMO_ORDERS;
    try {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!raw) {
        // Seed default orders
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_ORDERS));
        return INITIAL_DEMO_ORDERS;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return INITIAL_DEMO_ORDERS;
    } catch {
      return INITIAL_DEMO_ORDERS;
    }
  }

  // Save full orders list
  public setOrders(orders: KitchenOrder[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      this.broadcastUpdate();
      this.notifyListeners(orders);
    } catch (e) {
      console.error('Failed to save orders to storage', e);
    }
  }

  // Add a new order
  public addOrder(order: {
    tableNumber: string;
    items: SimpleOrderItem[];
    total: number;
    timestamp: string;
    notes?: string;
  }): KitchenOrder {
    const newOrder: KitchenOrder = {
      id: `ord-${Math.floor(1000 + Math.random() * 9000)}`,
      tableNumber: String(order.tableNumber),
      items: order.items,
      total: order.total,
      timestamp: order.timestamp,
      createdAt: Date.now(),
      status: 'Pending',
      notes: order.notes,
    };

    const currentOrders = this.getOrders();
    const updated = [newOrder, ...currentOrders];
    this.setOrders(updated);
    return newOrder;
  }

  // Append extra items to an existing active order (e.g. 1-tap quick add while waiting)
  public appendItemsToOrder(orderId: string, extraItems: SimpleOrderItem[]): KitchenOrder | null {
    const currentOrders = this.getOrders();
    let updatedOrder: KitchenOrder | null = null;
    const updated = currentOrders.map((o) => {
      if (o.id === orderId) {
        const itemMap = new Map<string, SimpleOrderItem>();
        // Add existing items
        o.items.forEach((it) => itemMap.set(it.name, { ...it }));
        // Merge or add extra items
        extraItems.forEach((extra) => {
          if (itemMap.has(extra.name)) {
            const cur = itemMap.get(extra.name)!;
            cur.quantity += extra.quantity;
          } else {
            itemMap.set(extra.name, { ...extra });
          }
        });
        const newItems = Array.from(itemMap.values());
        const extraTotal = extraItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
        
        updatedOrder = {
          ...o,
          items: newItems,
          total: o.total + extraTotal,
          // If already Served, reopen to Preparing so kitchen sees new items
          status: o.status === 'Served' ? 'Preparing' : o.status,
        };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      this.setOrders(updated);
    }
    return updatedOrder;
  }

  // Update order status
  public updateStatus(orderId: string, status: OrderStatus): KitchenOrder | null {
    const currentOrders = this.getOrders();
    let updatedOrder: KitchenOrder | null = null;
    const updated = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = { ...o, status };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      this.setOrders(updated);
    }
    return updatedOrder;
  }

  // Mark order as paid
  public markOrderAsPaid(orderId: string, paymentMethod = 'UPI'): KitchenOrder | null {
    const currentOrders = this.getOrders();
    let updatedOrder: KitchenOrder | null = null;
    const updated = currentOrders.map((o) => {
      if (o.id === orderId) {
        updatedOrder = { ...o, isPaid: true, paymentMethod };
        return updatedOrder;
      }
      return o;
    });

    if (updatedOrder) {
      this.setOrders(updated);
    }
    return updatedOrder;
  }

  // Dismiss / archive order
  public dismissOrder(orderId: string): void {
    const currentOrders = this.getOrders();
    const updated = currentOrders.filter((o) => o.id !== orderId);
    this.setOrders(updated);
  }

  // Find order by ID
  public getOrderById(orderId: string): KitchenOrder | undefined {
    return this.getOrders().find((o) => o.id === orderId);
  }

  // Subscribe to real-time updates
  public subscribe(listener: (orders: KitchenOrder[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(orders: KitchenOrder[]) {
    this.listeners.forEach((fn) => {
      try {
        fn(orders);
      } catch (e) {
        console.error('Error in order storage listener', e);
      }
    });
  }

  private broadcastUpdate() {
    try {
      this.channel?.postMessage({ type: 'ORDERS_UPDATED', timestamp: Date.now() });
    } catch {
      // ignore
    }
  }
}

export const orderStorage = new OrderStorageManager();
