# 📘 Jeevan Enterprise CRM + MLM — User Guide

Welcome to the **Jeevan Enterprise CRM & MLM Management Platform**. This guide covers the complete feature set across both the Store CRM (POS, products, customer management) and the Multi-Level Marketing (MLM) commission and rank network.

---

## 🔐 Login Credentials (Pre-seeded Accounts)

You can log in to the console using the following credential sets depending on the role you want to test:

| Role | Email | Password | Access & Responsibilities |
| :--- | :--- | :--- | :--- |
| 👑 **Super Admin** | `admin@vortex.com` | `password123` | Full system access, payment audit dashboard, franchises, user creation |
| 🏪 **Sales Executive** | `cashier@vortex.com` | `password123` | POS checkouts, customer profile creation, Gold Card sales |
| 🌿 **MLM Root (Founder)**| `root@vortex.com` | `password123` | MLM Downline Network Tree, Commission Ledger, Cashouts |
| 🌿 **Team Leader (TL)** | `teamleader@vortex.com` | `password123` | Middle-tier MLM member, tracks downline and commissions |
| 🌿 **Team Manager (TM)** | `manager@vortex.com` | `password123` | Senior MLM member, monitors manager network |
| 🌿 **Founder Member** | `founder@vortex.com` | `password123` | Highest MLM network level, receives passive founder overrides |
| 🌿 **Sales Advisor** | `advisor@vortex.com` | `password123` | Entry-level MLM member |

---

## 📱 Mobile-First Access for Field Users

The platform is designed to be fully mobile-responsive so field agents and distributors can access dashboards, checkout customers, register accounts, and view network structures on the go.

### Network Configuration for Mobile:
1. Ensure your mobile phone and laptop/server are on the **same Wi-Fi network**.
2. Find the local IP address of your host machine (e.g. `192.168.31.197`).
3. Access the CRM on your phone browser by going to:
   ```
   http://<YOUR_IP_ADDRESS>:3000
   ```
4. The system will automatically detect the hostname and point backend API requests to `http://<YOUR_IP_ADDRESS>:3001` so that logins and transactions work seamlessly without configuration.

---

## 🏢 Part 1 — Store CRM (Customer Relationship Management)

### 1.1 Managing Customers
> **Navigation:** Sidebar ➔ **Customers**

* **Add a Customer:** Click **"Add Customer"** (top right) or register them instantly using the quick-add button inside the Gold Card sale window.
* **Customer Ranks:** Customers are registered as **Standard** accounts. Once they upgrade, they get marked with a **Gold Card** badge.
* **Actions:** View full history, vehicle links, follow-up logs, or manually upgrade a customer to Gold status.

### 1.2 Products & Stock
> **Navigation:** Sidebar ➔ **Products & Stock**

* **Catalog Lookup:** Browse SKU codes, categories, selling prices, tax rates, and current inventory.
* **Low Stock Alerts:** Items with quantities equal to or below the reorder level are highlighted in amber/red.
* **Quick Stock Adjust:** Instantly add/subtract quantities (+5/-5 buttons) to keep inventory matching physical showroom stocks.

### 1.3 POS Checkout Terminal
> **Navigation:** Sidebar ➔ **POS Checkout**

1. **Select Reference:** Search and link an existing customer by name or phone.
2. **Add Products:** Click products in the list to populate the cart.
3. **Gold Member Discount:** If the selected customer holds an active **Gold Card**, the system automatically applies a **10% discount** to the subtotal.
4. **Complete Checkout:** Select **Cash** or **Card** and execute the POS transaction. The backend will deduct stock, evaluate low-stock alerts, and log invoice volumes.

---

## 💳 Part 2 — Gold Membership Card & Auto-Advisors

Selling Gold Cards is the core driver of the MLM network. A Gold Membership costs **₹2,999** (inclusive of GST).

### 2.1 The Sales Flow
1. Go to **Gold Card Sales** on the sidebar.
2. Select a Standard customer (or register a new customer profile).
3. Click **"Pay ₹2,999 via Razorpay"**.
4. Use standard Razorpay test methods to simulate success (e.g., test cards or UPI).
5. **On payment capture:**
   * Generates a unique Gold Card number (`GLD` + Year + Sequence number).
   * Generates a base64-encoded QR code containing membership validity parameters.
   * Auto-creates a **Sales Advisor MLM account** for the customer.
   * Distributes upline commissions.

### 2.2 Advisor Account Credentials
On the success page, the system displays the newly created Sales Advisor's credentials:
* **Username:** The customer's email (or `<phone>@goldmember.jeevan` if email was not supplied).
* **Password:** The customer's mobile number.

Field agents should instruct the customer to sign in to their dashboard using these details to track their downline and change their password.

---

## 🌿 Part 3 — MLM (Multi-Level Marketing) Downline Module

The MLM engine triggers commissions and monitors ranks in real-time as Gold Card memberships are purchased.

### 3.1 Rank Upgrade Path
Ranks are calculated strictly based on direct recruitment milestones:

| Rank | Milestone / Requirement | Equivalent Team Size |
| :--- | :--- | :--- |
| **Sales Advisor** | Default entry level (automatically assigned upon buying a Gold Card) | 1 user (Self) |
| **Team Leader (TL)** | Personally recruit **30 direct MLM users** | 30 users |
| **Team Manager** | Sponsor **30 direct members who reach TL or above** | 900 users (minimum) |
| **Founder Member** | Sponsor **30 direct members who reach Team Manager or above** | 27,00,000 users (minimum) |

### 3.2 Commission Distribution Model
For every Gold Card (₹2,999) sold, the system allocates flat payouts to the seller and the upline network:

```
[New Gold Card Sale]
       │
       ▼
 👤 Selling Advisor ────────────➔ gets ₹500
       │ (Walks up MLM tree)
       ▼
 👤 First Upline Team Leader ────➔ gets ₹300 (skips non-TLs)
       │ (Walks up MLM tree)
       ▼
 👤 First Upline Team Manager ──➔ gets ₹200 (skips non-TMs)
       │ (Walks up MLM tree)
       ▼
 👤 First Upline Founder ────────➔ gets ₹25  (skips non-Founders)
```

* **Note:** The engine walks up the parent chain node by node. Each rank payout occurs exactly once per sale. If the direct parent is already a Team Leader, they get the ₹300 payout, and the search continues upwards to find the first Team Manager and Founder.

### 3.3 Cashout Commission Ledgers
* **Ledger Tracking:** In **MLM Downline**, users can view all commission types (`GOLD_CARD_ADVISOR`, `GOLD_CARD_TL`, etc.) with their credit dates and status (`PENDING` / `PAID`).
* **Withdrawing Funds:** Click **"Cashout"** inside the MLM panel. If the pending balance is greater than ₹0, a transaction creates a payout log and marks all pending commissions as `PAID`.

---

## 🔧 Technical Quick Reference

### Launching the Development Stack

```powershell
# Term 1 - Start the Backend API
cd backend
npm run start:dev

# Term 2 - Start the Next.js Frontend
cd frontend
npm run dev
```

### Database Maintenance
If you want to clear the logs and start with fresh pre-seeded network accounts:
```powershell
cd backend
npx prisma db push --force-reset
npx prisma db seed
```
