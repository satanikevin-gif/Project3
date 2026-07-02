# MediFlow React Frontend

React + Vite frontend for the MediFlow medical store management system.

## Setup

```bash
cd frontend
npm install
```

## Development

1. Start the **backend** from the project root:
   ```bash
   npm start
   ```
   (API runs from `backend/` on port 5000)

2. Start the **React dev server**:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open **http://localhost:5173**

API requests are proxied to `http://localhost:5000`.

## Build for production

```bash
cd frontend
npm run build
```

Output is in `frontend/dist/`.

## Routes

| Route | Panel |
|-------|--------|
| `/` | Landing |
| `/login` | Login |
| `/register` | Customer register |
| `/shop` | Customer shop |
| `/cart` | Cart & checkout |
| `/orders` | My orders |
| `/orders/:id` | Order tracking |
| `/admin` | Admin dashboard |
| `/admin/orders` | Manage orders |
| `/admin/stock` | Inventory |
| `/admin/alerts` | Alerts |
| `/admin/suppliers` | Suppliers & POs |
| `/supplier` | Supplier dashboard |

## Demo accounts

- Admin: `admin@mediflow.com` / `admin123`
- Customer: `rahul@example.com` / `customer123`
- Supplier: `rajesh@supplier.com` / `supplier123`
