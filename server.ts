import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';

interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
  createdAt: number;
  status: OrderStatus;
  notes?: string;
}

interface MenuItemRecord {
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

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Menu items store
let menu: MenuItemRecord[] = [
  {
    id: '1',
    name: 'Espresso',
    price: 140,
    category: 'Coffee',
    description: 'Double shot of house espresso roast with thick hazelnut crema',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    badge: 'Classic',
    prepTime: '2-3 min',
    available: true,
    isVeg: true,
  },
  {
    id: '2',
    name: 'Americano',
    price: 160,
    category: 'Coffee',
    description: 'Double espresso pulled over hot filtered mountain spring water',
    image: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=600&q=80',
    prepTime: '2-3 min',
    available: true,
    isVeg: true,
  },
  {
    id: '3',
    name: 'Flat White',
    price: 210,
    category: 'Coffee',
    description: 'Velvety microfoam poured over double ristretto for a rich finish',
    image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80',
    badge: 'Bestseller',
    prepTime: '3-4 min',
    available: true,
    isVeg: true,
  },
  {
    id: '4',
    name: 'Cappuccino',
    price: 190,
    category: 'Coffee',
    description: 'Equal parts espresso, steamed milk, and airy microfoam with cocoa dust',
    image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80',
    prepTime: '3-4 min',
    available: true,
    isVeg: true,
  },
  {
    id: '5',
    name: 'Vanilla Latte',
    price: 220,
    category: 'Coffee',
    description: 'Madagascar bourbon vanilla bean syrup with espresso and steamed milk',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    badge: 'Popular',
    prepTime: '3-5 min',
    available: true,
    isVeg: true,
  },
  {
    id: '6',
    name: 'Cold Brew',
    price: 180,
    category: 'Iced & Tea',
    description: '18-hour slow steeped single-origin coffee served over crystal ice',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    badge: 'Refreshing',
    prepTime: '1-2 min',
    available: true,
    isVeg: true,
  },
  {
    id: '7',
    name: 'Iced Caramel Macchiato',
    price: 240,
    category: 'Iced & Tea',
    description: 'Chilled milk, vanilla syrup, espresso float, and salted caramel drizzle',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80',
    badge: 'Sweet & Iced',
    prepTime: '3-4 min',
    available: true,
    isVeg: true,
  },
  {
    id: '8',
    name: 'Matcha Green Tea Latte',
    price: 240,
    category: 'Iced & Tea',
    description: 'Ceremonial Uji matcha whisked with warm textured oat milk',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    prepTime: '4-5 min',
    available: true,
    isVeg: true,
  },
  {
    id: '9',
    name: 'Spiced Chai Latte',
    price: 140,
    category: 'Iced & Tea',
    description: 'Assam black tea simmered with cardamom, cinnamon, clove, and milk',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    prepTime: '3-4 min',
    available: true,
    isVeg: true,
  },
  {
    id: '10',
    name: 'Butter Croissant',
    price: 160,
    category: 'Bakery & Food',
    description: 'Flaky artisanal French butter pastry baked fresh this morning',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    badge: 'Fresh Baked',
    prepTime: 'Ready',
    available: true,
    isVeg: true,
  },
  {
    id: '11',
    name: 'Pain au Chocolat',
    price: 190,
    category: 'Bakery & Food',
    description: 'Golden laminated dough wrapped around two dark chocolate batons',
    image: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?auto=format&fit=crop&w=600&q=80',
    prepTime: 'Ready',
    available: true,
    isVeg: true,
  },
  {
    id: '12',
    name: 'Avocado Sourdough Toast',
    price: 290,
    category: 'Bakery & Food',
    description: 'Crushed Hass avocado, toasted seeds, chili flakes, and flaky Maldon salt',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80',
    badge: 'Chef Choice',
    prepTime: '6-8 min',
    available: true,
    isVeg: true,
  },
  {
    id: '13',
    name: 'New York Blueberry Cheesecake',
    price: 260,
    category: 'Bakery & Food',
    description: 'Creamy baked cream cheese with wild Maine blueberry compote topping',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    prepTime: 'Ready',
    available: true,
    isVeg: true,
  },
  {
    id: '14',
    name: 'Cafe Club Sandwich',
    price: 280,
    category: 'Bakery & Food',
    description: 'Smoked turkey, crisp greens, heirloom tomato, and Dijon on toasted brioche',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    prepTime: '7-10 min',
    available: true,
    isVeg: false,
  },
];

// Shared in-memory store for orders
let orders: Order[] = [
  {
    id: 'ord-101',
    tableNumber: '3',
    items: [
      { id: '3', name: 'Flat White', price: 210, quantity: 2, image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&w=600&q=80' },
      { id: '10', name: 'Butter Croissant', price: 160, quantity: 1, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80' },
    ],
    total: 580,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: Date.now() - 3 * 60 * 1000,
    status: 'Preparing',
    notes: 'Warm croissant, extra hot coffee',
  },
];

// Active SSE client connections for real-time kitchen and customer push
const sseClients = new Set<express.Response>();

function broadcastOrders() {
  const data = JSON.stringify(orders);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// 1. Get all live orders
app.get('/api/orders', (_req, res) => {
  res.json({ success: true, orders });
});

// 2. Real-time Server-Sent Events stream for Kitchen View & Customer Status Trackers
app.get('/api/orders/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current orders immediately
  res.write(`data: ${JSON.stringify(orders)}\n\n`);

  sseClients.add(res);

  // Keep-alive heartbeat every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 3. Get single order by ID (for live customer status tracking)
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }
  return res.json({ success: true, order });
});

// 4. Place a new customer order
app.post('/api/orders', (req, res) => {
  const { tableNumber, items, total, timestamp, notes } = req.body;

  if (!tableNumber || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid order data' });
  }

  const newOrder: Order = {
    id: req.body.id && typeof req.body.id === 'string' ? req.body.id : `ord-${Date.now().toString().slice(-4)}`,
    tableNumber: String(tableNumber),
    items,
    total: typeof total === 'number' ? total : items.reduce((sum: number, it: OrderItem) => sum + it.price * it.quantity, 0),
    timestamp: timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: Date.now(),
    status: 'Pending',
    notes: typeof notes === 'string' && notes.trim() ? notes.trim() : undefined,
  };

  // Add new order to the beginning of the queue
  orders.unshift(newOrder);

  // Instantly notify all connected kitchen displays
  broadcastOrders();

  return res.status(201).json({ success: true, order: newOrder });
});

// 5. Update order status: Pending -> Preparing -> Ready -> Served
app.post('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: OrderStatus[] = ['Pending', 'Preparing', 'Ready', 'Served'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.status = status;
  broadcastOrders();

  return res.json({ success: true, order });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses: OrderStatus[] = ['Pending', 'Preparing', 'Ready', 'Served'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status' });
  }

  const order = orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, error: 'Order not found' });
  }

  order.status = status;
  broadcastOrders();

  return res.json({ success: true, order });
});

// 6. Mark order as done / remove or archive
app.post('/api/orders/:id/done', (req, res) => {
  const { id } = req.params;
  const initialLength = orders.length;
  orders = orders.filter((o) => o.id !== id);

  if (orders.length !== initialLength) {
    broadcastOrders();
  }

  return res.json({ success: true, remaining: orders.length });
});

// ==========================================
// MENU MANAGEMENT API ROUTES (For Cafe Owner)
// ==========================================

// 1. Get current live menu
app.get('/api/menu', (_req, res) => {
  return res.json({ success: true, menu });
});

// 2. Add new menu item
app.post('/api/menu', (req, res) => {
  const { name, price, category, description, image, badge, prepTime, available, isVeg } = req.body;

  if (!name || typeof price !== 'number' || isNaN(price) || price < 0) {
    return res.status(400).json({ success: false, error: 'Valid item name and price are required' });
  }

  const newItem: MenuItemRecord = {
    id: `item-${Date.now()}`,
    name: String(name).trim(),
    price: Math.round(Number(price)),
    category: category ? String(category).trim() : 'Coffee',
    description: description ? String(description).trim() : '',
    image: image ? String(image).trim() : 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80',
    badge: badge && String(badge).trim() ? String(badge).trim() : undefined,
    prepTime: prepTime ? String(prepTime).trim() : '3-5 min',
    available: available !== false,
    isVeg: Boolean(isVeg),
  };

  menu.unshift(newItem);
  return res.status(201).json({ success: true, item: newItem, menu });
});

// 3. Update existing menu item
app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const index = menu.findIndex((m) => m.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Menu item not found' });
  }

  const { name, price, category, description, image, badge, prepTime, available, isVeg } = req.body;

  menu[index] = {
    ...menu[index],
    ...(name !== undefined && { name: String(name).trim() }),
    ...(price !== undefined && { price: Math.round(Number(price)) }),
    ...(category !== undefined && { category: String(category).trim() }),
    ...(description !== undefined && { description: String(description).trim() }),
    ...(image !== undefined && { image: String(image).trim() }),
    ...(badge !== undefined && { badge: badge && String(badge).trim() ? String(badge).trim() : undefined }),
    ...(prepTime !== undefined && { prepTime: String(prepTime).trim() }),
    ...(available !== undefined && { available: Boolean(available) }),
    ...(isVeg !== undefined && { isVeg: Boolean(isVeg) }),
  };

  return res.json({ success: true, item: menu[index], menu });
});

// 4. Toggle in-stock / out-of-stock
app.post('/api/menu/:id/toggle', (req, res) => {
  const { id } = req.params;
  const item = menu.find((m) => m.id === id);

  if (!item) {
    return res.status(404).json({ success: false, error: 'Menu item not found' });
  }

  item.available = item.available === false ? true : false;
  return res.json({ success: true, item, menu });
});

// 5. Delete menu item
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  menu = menu.filter((m) => m.id !== id);
  return res.json({ success: true, menu });
});

// ==========================================
// TABLE & QR MANAGEMENT API ROUTES (For Cafe Owner)
// ==========================================

interface TableRecord {
  id: string;
  name: string;
  number: string;
  createdAt: number;
}

let tables: TableRecord[] = [
  { id: 'tbl-1', name: 'Table 1', number: '1', createdAt: Date.now() - 70000 },
  { id: 'tbl-2', name: 'Table 2', number: '2', createdAt: Date.now() - 60000 },
  { id: 'tbl-3', name: 'Table 3', number: '3', createdAt: Date.now() - 50000 },
  { id: 'tbl-4', name: 'Table 4', number: '4', createdAt: Date.now() - 40000 },
  { id: 'tbl-5', name: 'Table 5', number: '5', createdAt: Date.now() - 30000 },
  { id: 'tbl-6', name: 'Table 6', number: '6', createdAt: Date.now() - 20000 },
  { id: 'tbl-7', name: 'Table 7', number: '7', createdAt: Date.now() - 10000 },
  { id: 'tbl-8', name: 'Table 8', number: '8', createdAt: Date.now() },
];

// 1. Get all tables
app.get('/api/tables', (_req, res) => {
  return res.json({ success: true, tables });
});

// 2. Create new table
app.post('/api/tables', (req, res) => {
  const { name, number } = req.body;
  const tableName = name ? String(name).trim() : 'New Table';
  let tableNum = number ? String(number).trim() : '';

  if (!tableNum) {
    const match = tableName.match(/\d+/);
    tableNum = match ? match[0] : String(tables.length + 1);
  }

  const newTable: TableRecord = {
    id: `tbl-${Date.now().toString().slice(-6)}`,
    name: tableName,
    number: tableNum,
    createdAt: Date.now(),
  };

  tables = [newTable, ...tables.filter((t) => t.number !== newTable.number && t.id !== newTable.id)];
  return res.status(201).json({ success: true, table: newTable, tables });
});

// 3. Update table
app.put('/api/tables/:id', (req, res) => {
  const { id } = req.params;
  const index = tables.findIndex((t) => t.id === id || t.number === id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Table not found' });
  }

  const { name, number } = req.body;

  tables[index] = {
    ...tables[index],
    ...(name !== undefined && { name: String(name).trim() }),
    ...(number !== undefined && { number: String(number).trim() }),
  };

  return res.json({ success: true, table: tables[index], tables });
});

// 4. Delete table
app.delete('/api/tables/:id', (req, res) => {
  const { id } = req.params;
  tables = tables.filter((t) => t.id !== id && t.number !== id);
  return res.json({ success: true, tables });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simple QR Cafe Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();










