'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Ticket } from 'lucide-react';
import { useAuthStore } from '../../store';

interface CartItem {
  product: any;
  quantity: number;
  discount: number;
}

export default function POSPage() {
  const { user } = useAuthStore();
  const [franchises, setFranchises] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Selection states
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Search strings
  const [prodSearch, setProdSearch] = useState('');
  const [custSearch, setCustSearch] = useState('');

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/api/franchises'),
      api.get('/api/customers'),
    ]).then(([franRes, custRes]) => {
      setFranchises(franRes.data);
      setCustomers(custRes.data);
      
      if (user?.storeUsers?.[0]) {
        setSelectedFranchiseId(user.storeUsers[0].franchiseId);
      } else if (franRes.data.length > 0) {
        setSelectedFranchiseId(franRes.data[0].id);
      }
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (selectedFranchiseId) {
      api.get('/api/products', { params: { franchiseId: selectedFranchiseId } })
        .then((res) => setProducts(res.data))
        .catch(() => {});
    } else {
      setProducts([]);
    }
    setCart([]);
  }, [selectedFranchiseId]);

  useEffect(() => {
    const cust = customers.find((c) => c.id === selectedCustomerId);
    setSelectedCustomer(cust || null);
  }, [selectedCustomerId, customers]);

  const handleAddToCart = (product: any) => {
    const available = product.inventory?.quantity || 0;
    const existing = cart.find((item) => item.product.id === product.id);
    const existingQty = existing ? existing.quantity : 0;

    if (available <= existingQty) {
      toast.error(`Cannot add more. Insufficient stock! (Available: ${available})`);
      return;
    }

    if (existing) {
      setCart(cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
  };

  const handleQtyChange = (productId: string, change: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const available = item.product.inventory?.quantity || 0;
    const newQty = item.quantity + change;

    if (newQty > available) {
      toast.error(`Cannot exceed available stock of ${available}`);
      return;
    }

    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId));
    } else {
      setCart(cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      ));
    }
  };

  const handleRemove = (productId: string) => {
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.product.sellingPrice * item.quantity - item.discount);
  }, 0);

  const tax = cart.reduce((sum, item) => {
    const itemTotal = item.product.sellingPrice * item.quantity - item.discount;
    return sum + (itemTotal * item.product.taxRate);
  }, 0);

  const goldDiscount = selectedCustomer?.isGoldMember ? subtotal * 0.10 : 0;
  const grandTotal = subtotal - goldDiscount + tax;

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer for this order');
      return;
    }
    if (cart.length === 0) {
      toast.error('POS Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/api/sales', {
        customerId: selectedCustomerId,
        franchiseId: selectedFranchiseId,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
      });

      toast.success(`Checkout complete! Invoice: ${res.data.invoiceNumber}`);
      setCart([]);
      setSelectedCustomerId('');
      setCustSearch('');
      
      api.get('/api/products', { params: { franchiseId: selectedFranchiseId } })
        .then((r) => setProducts(r.data));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.firstName.toLowerCase().includes(custSearch.toLowerCase()) ||
    c.phone.includes(custSearch)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Product Selection Catalog */}
      <div className="lg:col-span-2 flex flex-col space-y-4 h-full overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">POS Terminal</h1>
            <p className="text-xs text-slate-500">Scan barcodes or select items to place orders</p>
          </div>
          <div>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 outline-hidden"
            >
              <option value="">Select Branch</option>
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by SKU or Name..."
            value={prodSearch}
            onChange={(e) => setProdSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 py-2.5 pl-10 pr-4 text-sm outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pr-1">
          {filteredProducts.map((p) => {
            const isOutOfStock = (p.inventory?.quantity || 0) <= 0;
            return (
              <button
                key={p.id}
                disabled={isOutOfStock}
                onClick={() => handleAddToCart(p)}
                className={`rounded-xl border p-4 text-left transition-all backdrop-blur-xs flex flex-col justify-between h-40 ${
                  isOutOfStock
                    ? 'border-slate-900 bg-slate-950/20 opacity-50 cursor-not-allowed'
                    : 'border-slate-900 bg-slate-950/40 hover:border-slate-800 hover:bg-slate-900/10'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h3 className="font-bold text-sm text-slate-200 leading-tight truncate">{p.name}</h3>
                    <span className="text-[9px] bg-slate-900 text-slate-400 font-mono px-1.5 py-0.5 rounded shrink-0">{p.unit || 'PCS'}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono mt-0.5">SKU: {p.sku}</span>
                </div>

                <div className="mt-4 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Selling Price</span>
                    <span className="font-extrabold text-slate-100">₹{p.sellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                      {isOutOfStock ? 'Out of stock' : `${p.inventory?.quantity || 0} left`}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* POS Cart Sidebar */}
      <div className="rounded-xl border border-slate-900 bg-slate-950/25 p-5 flex flex-col justify-between h-full overflow-hidden">
        <div className="space-y-4 flex flex-col h-[70%] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
            <ShoppingCart className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-bold">POS Checkout Cart</h2>
          </div>

          {/* Customer Search / Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Reference</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search phone or name..."
                value={custSearch}
                onChange={(e) => {
                  setCustSearch(e.target.value);
                  setSelectedCustomerId('');
                }}
                className="w-full rounded-md border border-slate-900 bg-slate-950/60 py-1.5 pl-8 pr-3 text-xs outline-hidden focus:border-indigo-500"
              />
            </div>

            {custSearch && !selectedCustomerId && (
              <div className="max-h-24 overflow-y-auto border border-slate-900 bg-slate-950 rounded-md p-1 space-y-1">
                {filteredCustomers.slice(0, 3).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCustomerId(c.id);
                      setCustSearch(`${c.firstName} (${c.phone})`);
                    }}
                    className="w-full text-left text-xs px-2.5 py-1.5 hover:bg-slate-900 rounded-sm"
                  >
                    {c.firstName} {c.lastName || ''} - {c.phone}
                  </button>
                ))}
              </div>
            )}

            {selectedCustomer && (
              <div className="rounded-lg bg-indigo-500/5 border border-indigo-500/10 p-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-200">{selectedCustomer.firstName} {selectedCustomer.lastName || ''}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.isGoldMember && (
                  <span className="flex items-center gap-0.5 rounded bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-500">
                    Gold 10% Off
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Cart is empty. Select products.</div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 text-xs">
                  <div className="space-y-1 w-28 truncate">
                    <p className="font-semibold text-slate-200 truncate">{item.product.name}</p>
                    <p className="text-[10px] text-slate-500">₹{item.product.sellingPrice.toFixed(2)}/unit</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleQtyChange(item.product.id, -1)}
                      className="h-6 w-6 rounded border border-slate-800 bg-slate-900 flex items-center justify-center hover:bg-slate-800"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQtyChange(item.product.id, 1)}
                      className="h-6 w-6 rounded border border-slate-800 bg-slate-900 flex items-center justify-center hover:bg-slate-800"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-200">₹{(item.product.sellingPrice * item.quantity).toFixed(2)}</span>
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="text-red-400 hover:text-red-300 block ml-auto mt-0.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-slate-900 pt-4 space-y-3">
          <div className="space-y-1.5 text-xs text-slate-400 font-mono">
            <div className="flex justify-between font-sans">
              <span className="text-slate-400">Subtotal:</span>
              <span className="text-slate-200">₹{subtotal.toFixed(2)}</span>
            </div>
            {goldDiscount > 0 && (
              <div className="flex justify-between text-emerald-500">
                <span>Gold Discount (10%):</span>
                <span>-₹{goldDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Taxes:</span>
              <span className="text-slate-200">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-slate-900 pt-3">
              <span className="text-slate-200">Grand Total:</span>
              <span className="text-indigo-400">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPaymentMethod('CASH')}
              className={`rounded-md py-1.5 text-xs font-semibold border transition-all ${
                paymentMethod === 'CASH'
                  ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                  : 'border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              Cash Payment
            </button>
            <button
              onClick={() => setPaymentMethod('CARD')}
              className={`rounded-md py-1.5 text-xs font-semibold border transition-all ${
                paymentMethod === 'CARD'
                  ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500'
                  : 'border-slate-800 text-slate-400 hover:bg-slate-900'
              }`}
            >
              Card Payment
            </button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            {loading ? 'Processing Checkout...' : 'Execute POS Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
