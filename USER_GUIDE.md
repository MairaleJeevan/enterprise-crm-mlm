# 📘 Vortex Enterprise CRM + MLM — User Guide

> **System URL (Local):** http://localhost:3000  
> **API Docs:** http://localhost:3001/api/docs  
> **Version:** 1.0 | Last Updated: July 2026

---

## 🔐 Login Credentials

| Role | Email | Password | Access Level |
|------|-------|----------|-------------|
| 👑 Super Admin | `admin@vortex.com` | `password123` | Full system access |
| 🏪 Sales Executive | `cashier@vortex.com` | `password123` | POS, Customers, Gold Card |
| 🌿 MLM Root (Founder) | `root@vortex.com` | `password123` | MLM Downline, Commissions |
| 🌿 Team Leader | `teamleader@vortex.com` | `password123` | MLM Downline |
| 🌿 Team Manager | `manager@vortex.com` | `password123` | MLM Downline |
| 🌿 Founder Member | `founder@vortex.com` | `password123` | MLM Downline |
| 🌿 Sales Advisor | `advisor@vortex.com` | `password123` | MLM Downline |

---

## 🏢 Part 1 — Store CRM (Customer Relationship Management)

The CRM module helps Sales Executives manage customers, products, POS billing, and follow-ups.

---

### 1.1 Dashboard Overview

Login as `cashier@vortex.com` → You'll land on the **Overview** page.

**What you see:**
- Total Sales Today / This Month
- Low Stock Alerts
- Pending Follow-ups
- Recent Customers

---

### 1.2 Managing Customers

> **Navigation:** Sidebar → **Customers**

#### ➕ Add a New Customer

1. Click **"Add Customer"** (top right)
2. Fill in:
   - First Name *(required)*
   - Last Name
   - Phone Number *(required)*
   - Email
   - Address, City, State, Pincode
3. Click **Save**

#### 🔍 Search a Customer

- Use the **search bar** at the top of the Customers page
- Search by name, phone, or email

#### ✏️ Edit / View Customer

- Click any customer row to view details
- Click **Edit** to update information
- See the customer's purchase history, Gold Card status, vehicles

---

### 1.3 Products & Stock

> **Navigation:** Sidebar → **Products & Stock**

#### View Products
- See all products with SKU, price, stock level
- **Low stock** items are highlighted in red/amber

#### Add a Product *(Admin only)*
1. Click **"Add Product"**
2. Fill SKU, name, category, purchase price, selling price, tax rate
3. Set inventory quantity and reorder level

#### Update Stock
- Click a product → Click **"Update Stock"**
- Enter new quantity

---

### 1.4 POS Checkout (Point of Sale)

> **Navigation:** Sidebar → **POS Checkout**

This is the billing terminal. Use it to process sales.

#### Steps to Create a Sale:
1. **Select Customer** — choose from dropdown or search
2. **Add Products** — click "+" on each product to add to cart
3. **Apply Discount** *(optional)* — enter % or fixed amount
4. **Review Total** — subtotal, tax (18% GST), and grand total shown
5. **Select Payment Method** — Cash / Card / UPI
6. Click **"Complete Sale"** — invoice generated automatically

#### View Past Sales
- Click any sale to see invoice details
- Invoice includes: customer info, items, tax breakdown, total

---

### 1.5 Gold Membership Card Sale

> **Navigation:** Sidebar → **Gold Card Sales**  
> *(Available to Sales Executive and MLM Distributors)*

This is the **primary revenue flow** — selling ₹2,999 Gold Membership Cards.

#### Steps to Sell a Gold Card:

**Step 1 — Select Customer**
- Choose customer from dropdown
- Customers already holding a Gold Card are marked ✅

**Step 2 — Initiate Payment**
- Click **"Pay ₹2,999 via Razorpay"**
- Razorpay checkout popup appears

**Step 3 — Customer Pays**

Use these test methods:

| Method | Details |
|--------|---------|
| 💳 Card | `4111 1111 1111 1111` / Exp: `12/26` / CVV: `123` / OTP: `123456` |
| 📱 UPI (Success) | `success@razorpay` |
| 📱 UPI (Fail) | `failure@razorpay` |
| 🏦 Netbanking | Select any bank → Click "Success" on test page |

**Step 4 — After Successful Payment:**

The system automatically:
- ✅ Activates the Gold Card
- 🔢 Generates Card Number (`GLD2026000001`)
- 📱 Creates QR Code
- 🧾 Generates Invoice (with GST breakdown)
- 🌿 Credits MLM Commissions to upline (3 levels)
- 🏅 Updates Customer to Gold Member status

**Step 5 — View Results**

You'll be redirected to the **Success Page** with:
- Gold Card details (number, dates, QR code)
- Invoice summary
- Buttons: **View Invoice** | **View Membership Card**

---

### 1.6 Vehicles

> **Navigation:** Sidebar → **Vehicles**

Track customer vehicles for service-based businesses.

- Add vehicle: Make, Model, Year, License Plate, VIN
- Link vehicle to a customer
- View customer's vehicle history

---

### 1.7 Follow-ups

> **Navigation:** Sidebar → **Follow-ups**

Schedule and track customer follow-up calls/visits.

#### Add a Follow-up:
1. Click **"Add Follow-up"**
2. Select customer
3. Enter notes and follow-up date
4. Status: `PENDING` → `COMPLETED` / `CANCELLED`

---

### 1.8 Reports *(Admin / Manager only)*

> **Navigation:** Sidebar → **Reports**

View business analytics:

| Report | Description |
|--------|-------------|
| Sales Report | Revenue by date range, top products |
| Inventory Report | Stock levels, reorder alerts |
| Commission Report | MLM commission summary |

---

### 1.9 Invoice Page

> **Navigation:** Gold Card Success → **View Invoice**  
> **URL Pattern:** `/dashboard/gold-card/invoice/{paymentId}`

- Shows professional invoice with Vortex branding
- Itemized breakdown with GST (18%)
- Click **Print** (top right) to print or save as PDF

---

### 1.10 Membership Card Page

> **Navigation:** Gold Card Success → **View Membership Card**  
> **URL Pattern:** `/dashboard/gold-card/card/{paymentId}`

- Premium gold card UI with customer name, card number, QR code
- Shows activation date, expiry date, days remaining
- Click **Print** to print the physical card

---

## 🌿 Part 2 — MLM (Multi-Level Marketing) Module

The MLM module manages the distributor network, downline tree, and automatic commission payouts.

---

### 2.1 MLM Rank Structure

The system uses a **4-tier advancement model:**

```
Founder Member      → Group PV ≥ 15,00,000
Team Manager        → Group PV ≥ 4,50,000
Team Leader         → Group PV ≥ 15,000
Sales Advisor       → Entry level
```

**PV = Point Value** (each Gold Card sale = points added)

---

### 2.2 MLM Downline Network (Tree View)

> **Navigation:** Sidebar → **MLM Downline**  
> *(Available to all MLM Distributors)*

#### What you see when logged in as an MLM user:

**Top Stats:**
- 💰 Total Commissions earned (all time)
- ⏳ Pending Cashout amount
- 👥 Number of direct recruits

**Network Placement Hierarchy:**
- Visual binary tree showing your node + all downline members
- Each node shows: Name, Rank, Personal PV, Group PV, Leg (LEFT/RIGHT)
- Tree depth: up to 4 levels

**Commission Ledgers:**
- All commission records with type, amount, date, status (PENDING / PAID)

---

### 2.3 MLM Tree Structure (Current Seed Data)

```
Alice Root (ROOT — Founder Member)
│
├── Bob Left (Sales Advisor) [LEFT]
│   ├── Priya Verma (Team Leader) [LEFT]   ← login: teamleader@vortex.com
│   │   ├── Suresh Kumar (Team Manager) [LEFT]   ← login: manager@vortex.com
│   │   │   ├── Deepa Nair (Sales Advisor) [LEFT]
│   │   │   └── Amit Patel (Sales Advisor) [RIGHT]
│   │   └── Ravi Sharma (Sales Advisor) [RIGHT]   ← login: advisor@vortex.com
│   └── Charlie Right (Sales Advisor) [RIGHT]
│
└── Anita Singh (Founder Member) [RIGHT]   ← login: founder@vortex.com
```

> **Tip:** Login as `teamleader@vortex.com` to see Priya's downline (Suresh + Ravi visible in the tree).

---

### 2.4 How Commissions Work

When a Gold Card (₹2,999) is sold, commissions are auto-generated:

| Level | Who Gets It | % | Amount |
|-------|-------------|---|--------|
| Level 1 | Direct sponsor (1 level above seller) | 10% | ₹299.90 |
| Level 2 | 2 levels above seller | 5% | ₹149.95 |
| Level 3 | 3 levels above seller | 2% | ₹59.98 |

Commissions are created with `PENDING` status and visible in the Commission Ledger.

---

### 2.5 Cashout (Withdraw Commissions)

> **Navigation:** MLM Downline → **Cashout button**

1. Pending commissions must be > ₹0
2. Click **"Cashout"** button
3. All pending commissions are marked as `PAID`
4. A payout record is created

> ⚠️ In production: integrate with bank transfer / UPI payout API before enabling real cashouts.

---

### 2.6 Joining as a New MLM Distributor

New distributors are registered by the Admin:

1. Login as `admin@vortex.com`
2. Go to **Auth / Register** API or use the signup page
3. Set role: `MLM_DISTRIBUTOR`
4. Assign `parentId` (sponsor's MLM node ID)
5. Set position: `LEFT` or `RIGHT`

---

## 👑 Part 3 — Admin Panel

Login as `admin@vortex.com` for full system access.

---

### 3.1 Payment Dashboard

> **Navigation:** Sidebar → **Payment Dashboard**  
> *(Admin only)*

#### Stats Cards:
- 💰 Total Revenue (all captured payments)
- 📅 Today's Collection
- ⏳ Pending Payments
- ❌ Failed Payments

#### Payments Table:
- All transactions with customer, card number, amount, advisor, status
- Search by: customer name, phone, card number, payment ID
- **Actions per row:**
  - 🧾 View Invoice
  - 💳 View Gold Card

#### Payment Statuses:
| Status | Meaning |
|--------|---------|
| `PENDING` | Order created, payment not yet done |
| `CAPTURED` | Payment successful, card active |
| `FAILED` | Payment failed or rejected |
| `REFUNDED` | Amount refunded to customer |

---

### 3.2 Franchise Management

> **Navigation:** Sidebar → **Franchises** *(Admin only)*

- Add new franchise/showroom
- View all franchise locations
- Edit franchise details (name, address, GST, contact)

---

### 3.3 Register New Users

Via API or Swagger (`http://localhost:3001/api/docs`):

```json
POST /api/auth/register
{
  "email": "newuser@vortex.com",
  "password": "password123",
  "firstName": "New",
  "lastName": "User",
  "role": "STORE_USER",       // ADMIN | STORE_USER | MLM_DISTRIBUTOR
  "franchiseId": "..."        // required for STORE_USER
}
```

---

## 🔧 Technical Quick Reference

### Starting the System

```powershell
# Terminal 1 — Backend
cd C:\crm-prototype\crm-project\enterprise-crm-mlm\backend
npm run start:dev

# Terminal 2 — Frontend
cd C:\crm-prototype\crm-project\enterprise-crm-mlm\frontend
npm run dev
```

### Reset Database (Re-seed all test data)

```powershell
cd C:\crm-prototype\crm-project\enterprise-crm-mlm\backend
npx prisma db push
npx prisma db seed
```

### Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `RAZORPAY_KEY_ID` | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | Razorpay private key |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification secret |
| `GOLD_CARD_PRICE` | Price in paise (299900 = ₹2,999) |

---

## 🗺️ Page URL Reference

| Page | URL | Who Can Access |
|------|-----|----------------|
| Login | `/login` | Everyone |
| Dashboard | `/dashboard` | All logged-in users |
| Customers | `/dashboard/customers` | Admin, Manager, Sales |
| Products | `/dashboard/products` | All |
| POS Checkout | `/dashboard/sales` | Admin, Manager, Sales |
| Vehicles | `/dashboard/vehicles` | Admin, Manager, Sales |
| Follow-ups | `/dashboard/followups` | Admin, Manager, Sales |
| Reports | `/dashboard/reports` | Admin, Manager |
| MLM Downline | `/dashboard/mlm` | Admin, MLM Distributor |
| Gold Card Sales | `/dashboard/gold-card` | Sales, MLM Distributor |
| Payment Success | `/dashboard/gold-card/success` | Auto-redirect |
| Payment Failed | `/dashboard/gold-card/failed` | Auto-redirect |
| Invoice | `/dashboard/gold-card/invoice/{id}` | All |
| Membership Card | `/dashboard/gold-card/card/{id}` | All |
| Admin Payments | `/dashboard/gold-card/admin` | Admin only |
| Swagger API | `http://localhost:3001/api/docs` | Developer |

---

## ❓ Frequently Asked Questions

**Q: Login shows "Authentication failed"?**  
A: Backend is not running. Run `npm run start:dev` in the backend folder.

**Q: Razorpay popup doesn't open?**  
A: Check browser console. Ensure RAZORPAY_KEY_ID is set correctly in `.env`.

**Q: Gold Card already exists error?**  
A: Each customer can only have one active card. Check if they're already a Gold Member.

**Q: Commissions not showing?**  
A: Commissions are only generated when Gold Card payment is CAPTURED (verified). PENDING orders don't trigger commissions.

**Q: How to test payment failure?**  
A: Use UPI ID `failure@razorpay` in the Razorpay test popup.

**Q: Port 3001 already in use?**  
A: Run this in PowerShell:  
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process -Force
```
