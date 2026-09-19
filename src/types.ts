export interface SimpleMenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  description?: string;
  image?: string;
  badge?: string;
  prepTime?: string;
  available?: boolean;
  isVeg?: boolean;
}

export interface SimpleOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

export interface CafeTable {
  id: string;
  name: string;
  number: string;
  createdAt: number;
}

export interface KitchenOrder {
  id: string;
  tableNumber: string;
  items: SimpleOrderItem[];
  total: number;
  timestamp: string;
  createdAt: number;
  status: OrderStatus;
  notes?: string;
  isPaid?: boolean;
  paymentMethod?: string;
}

export type CategoryId = 'all' | 'coffee' | 'brews' | 'teas-beverages' | 'breakfast-toasts' | 'sandwiches-mains' | 'bakery-desserts';

export interface MenuItem {
  id: string;
  name: string;
  subName?: string;
  category: 'coffee' | 'brews' | 'teas-beverages' | 'breakfast-toasts' | 'sandwiches-mains' | 'bakery-desserts';
  description: string;
  price: number;
  image: string;
  isVeg: boolean;
  isPopular?: boolean;
  prepTime: string;
  roastProfile?: string;
  tags?: string[];
  allergens?: string[];
  customizable?: boolean;
  options?: {
    milkChoices?: string[];
    temperature?: ('Hot' | 'Iced')[];
    sugarLevel?: string[];
  };
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  selectedMilk?: string;
  selectedTemp?: string;
  selectedSugar?: string;
  notes?: string;
}

export interface TableServiceRequest {
  id: string;
  title: string;
  description: string;
  status: 'idle' | 'requested' | 'confirmed';
}

export interface CafeFacility {
  id: string;
  name: string;
  timing: string;
  description: string;
  icon?: string;
}

export interface ActiveOrder {
  orderId: string;
  tableNumber: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  specialInstructions?: string;
  placedAt: string;
  status: 'Received' | 'Brewing at Bar' | 'Ready for Table';
  estimatedMinutes: number;
}
