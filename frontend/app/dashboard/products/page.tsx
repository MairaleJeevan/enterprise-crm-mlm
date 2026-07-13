'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Tag, Layers, AlertTriangle, ShieldCheck, X } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Forms
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodFran, setProdFran] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [taxRate, setTaxRate] = useState(0.18);
  const [unit, setUnit] = useState('PCS');
  const [initialQty, setInitialQty] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [inventoryLoc, setInventoryLoc] = useState('');

  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const fetchData = async () => {
    try {
      const [prodRes, catRes, franRes] = await Promise.all([
        api.get('/api/products', {
          params: {
            franchiseId: selectedFranchise || undefined,
            categoryId: selectedCategory || undefined,
          },
        }),
        api.get('/api/products/categories'),
        api.get('/api/franchises'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setFranchises(franRes.data);
    } catch {
      toast.error('Error fetching inventory catalog');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedFranchise, selectedCategory]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/products/categories', { name: catName, description: catDesc });
      toast.success('Category created!');
      setShowCategoryModal(false);
      setCatName('');
      setCatDesc('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/products', {
        sku: prodSku,
        name: prodName,
        description: prodDesc || undefined,
        categoryId: prodCat || undefined,
        franchiseId: prodFran,
        purchasePrice,
        sellingPrice,
        taxRate,
        unit,
        initialQuantity: initialQty,
        reorderLevel,
        inventoryLocation: inventoryLoc || undefined,
      });

      toast.success('Product created with inventory!');
      setShowProductModal(false);
      // Clear form
      setProdSku('');
      setProdName('');
      setProdDesc('');
      setProdCat('');
      setProdFran('');
      setPurchasePrice(0);
      setSellingPrice(0);
      setInitialQty(0);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStockAdjust = async (id: string, change: number) => {
    try {
      await api.patch(`/api/products/${id}/stock`, { quantityChange: change });
      toast.success('Stock level adjusted!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-slate-200 outline-hidden text-base sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors';
  const labelCls = 'text-xs font-semibold text-slate-400';

  return (
    <div className="space-y-6">
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Products & Stock</h1>
          <p className="text-sm text-slate-400">Manage catalog and adjust real-time stock levels</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all hover:bg-slate-900 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
          <button
            onClick={() => setShowProductModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filter bar — full-width selection on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-slate-900 bg-slate-950/20 p-4">
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
          <select
            value={selectedFranchise}
            onChange={(e) => setSelectedFranchise(e.target.value)}
            className="mt-1 w-full sm:w-auto rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-200 outline-hidden focus:border-indigo-500"
          >
            <option value="">All Branches</option>
            {franchises.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full sm:w-auto">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 w-full sm:w-auto rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-base sm:text-xs text-slate-200 outline-hidden focus:border-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Desktop Products Table (hidden on mobile) ────────────────────── */}
      <div className="hidden sm:block rounded-xl border border-slate-900 bg-slate-950/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase">
                <th className="py-4 px-6">SKU & Product</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Prices</th>
                <th className="py-4 px-6">Stock Status</th>
                <th className="py-4 px-6 text-center">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">No products match the criteria.</td>
                </tr>
              ) : (
                products.map((p) => {
                  const qty = p.inventory?.quantity || 0;
                  const isLow = qty <= (p.inventory?.reorderLevel || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-200">{p.name}</div>
                        <div className="text-xs text-slate-500 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="rounded-md bg-slate-800/40 px-2.5 py-1 text-xs text-slate-300">
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs">Sell: <span className="font-bold text-slate-200">₹{p.sellingPrice.toFixed(2)}</span></div>
                        <div className="text-[10px] text-slate-500 font-mono">Buy: ₹{p.purchasePrice.toFixed(2)} | Tax: {p.taxRate * 100}%</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isLow ? 'text-red-400' : 'text-slate-200'}`}>
                            {qty} {p.unit || 'PCS'}
                          </span>
                          {isLow ? (
                            <span className="flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
                              <AlertTriangle className="h-2.5 w-2.5" /> Low Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                              <ShieldCheck className="h-2.5 w-2.5" /> OK
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Min Level: {p.inventory?.reorderLevel} | Loc: {p.inventory?.location || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuickStockAdjust(p.id, -5)}
                            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-red-400 hover:bg-slate-800 transition-colors"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjust(p.id, 5)}
                            className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-emerald-400 hover:bg-slate-800 transition-colors"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Product Card Layout (visible only on mobile) ─────────── */}
      <div className="sm:hidden space-y-3">
        {products.length === 0 ? (
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-6 text-center text-slate-500 text-sm">
            No products match the criteria.
          </div>
        ) : (
          products.map((p) => {
            const qty = p.inventory?.quantity || 0;
            const isLow = qty <= (p.inventory?.reorderLevel || 0);

            return (
              <div key={p.id} className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 space-y-3">
                {/* SKU + Name */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {p.sku}</p>
                  </div>
                  <span className="rounded-md bg-slate-850 px-2 py-0.5 text-[10px] text-slate-400 shrink-0">
                    {p.category?.name || 'Uncat.'}
                  </span>
                </div>

                {/* Stock Level + Prices */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-900 pt-2">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Stock Level</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`font-bold ${isLow ? 'text-red-400' : 'text-slate-200'}`}>
                        {qty} {p.unit || 'PCS'}
                      </span>
                      {isLow && (
                        <span className="rounded bg-red-500/10 px-1 py-0.5 text-[8px] font-bold text-red-400 uppercase">
                          Low
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Selling Price</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">₹{p.sellingPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quick Stock Adjust Buttons */}
                <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
                  <span className="text-[10px] text-slate-500 font-medium">Quick Adjust:</span>
                  <button
                    onClick={() => handleQuickStockAdjust(p.id, -5)}
                    className="flex-1 rounded-md border border-slate-800 bg-slate-900 py-1.5 text-xs text-red-400 active:bg-slate-800"
                  >
                    -5 Quantity
                  </button>
                  <button
                    onClick={() => handleQuickStockAdjust(p.id, 5)}
                    className="flex-1 rounded-md border border-slate-800 bg-slate-900 py-1.5 text-xs text-emerald-400 active:bg-slate-800"
                  >
                    +5 Quantity
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Category Modal ────────────────────────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Tag className="h-5 w-5 text-indigo-400" /> Add Product Category</h2>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className={labelCls}>Category Name</label>
                <input
                  type="text" required value={catName} onChange={(e) => setCatName(e.target.value)}
                  className={inputCls} placeholder="Electronics"
                />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={catDesc} onChange={(e) => setCatDesc(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden min-h-[80px] text-base sm:text-sm focus:border-indigo-500 focus:ring-1"
                  placeholder="Electronics products and accessories"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button
                  type="button" onClick={() => setShowCategoryModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 w-full sm:w-auto"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Product Modal ─────────────────────────────────────────────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><Layers className="h-5 w-5 text-indigo-400" /> Register Product & Stock</h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Product Name</label>
                  <input
                    type="text" required value={prodName} onChange={(e) => setProdName(e.target.value)}
                    className={inputCls} placeholder="Apex V2 Headphones"
                  />
                </div>
                <div>
                  <label className={labelCls}>SKU (Unique Barcode)</label>
                  <input
                    type="text" required value={prodSku} onChange={(e) => setProdSku(e.target.value)}
                    className={inputCls} placeholder="HP-APEX"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Description</label>
                <input
                  type="text" value={prodDesc} onChange={(e) => setProdDesc(e.target.value)}
                  className={inputCls} placeholder="Premium noise-canceling headphones"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Branch Location</label>
                  <select
                    required value={prodFran} onChange={(e) => setProdFran(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Branch</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Category</label>
                  <select
                    required value={prodCat} onChange={(e) => setProdCat(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Purchase Price</label>
                  <input
                    type="number" step="0.01" required value={purchasePrice} onChange={(e) => setPurchasePrice(parseFloat(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Selling Price</label>
                  <input
                    type="number" step="0.01" required value={sellingPrice} onChange={(e) => setSellingPrice(parseFloat(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Tax Rate (%)</label>
                  <input
                    type="number" step="0.01" required value={taxRate} onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <input
                    type="text" required value={unit} onChange={(e) => setUnit(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-900 bg-slate-900/20 p-4">
                <h3 className="text-sm font-semibold leading-none">Initial Inventory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Quantity</label>
                    <input
                      type="number" required value={initialQty} onChange={(e) => setInitialQty(parseInt(e.target.value, 10))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Reorder Level</label>
                    <input
                      type="number" required value={reorderLevel} onChange={(e) => setReorderLevel(parseInt(e.target.value, 10))}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider font-mono">Aisle / Bin</label>
                    <input
                      type="text" placeholder="e.g. Aisle 4B" value={inventoryLoc} onChange={(e) => setInventoryLoc(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button
                  type="button" onClick={() => setShowProductModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 w-full sm:w-auto"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
