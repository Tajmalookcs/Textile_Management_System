import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import Layout from '../../components/Layout/Layout';

const today = () => new Date().toISOString().split('T')[0];

const emptyItem = () => ({ product: '', quantity: '', rate: '', tax_percent: '0' });

const statusStyles = {
  draft:     { cls: 'bg-gray-100 text-gray-600',       label: 'Draft' },
  confirmed: { cls: 'bg-blue-50 text-blue-700',        label: 'Confirmed' },
  received:  { cls: 'bg-emerald-50 text-emerald-700',  label: 'Received' },
  cancelled: { cls: 'bg-red-50 text-red-600',          label: 'Cancelled' },
};

function calcRow(item) {
  const qty = parseFloat(item.quantity) || 0;
  const rate = parseFloat(item.rate) || 0;
  const tax = parseFloat(item.tax_percent) || 0;
  const excl = qty * rate;
  const taxAmt = (excl * tax) / 100;
  const incl = excl + taxAmt;
  return { excl, taxAmt, incl };
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [supplier, setSupplier] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        api.get('/purchase-orders/'),
        api.get('/suppliers/'),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data.results ?? []));
      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : (suppliersRes.data.results ?? []));
    } catch {
      setOrders([]);
      setSuppliers([]);
    }
    try {
      const prodRes = await api.get('/products/');
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data.results ?? []));
    } catch {
      setProducts([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNew = () => {
    setSupplier('');
    setDate(today());
    setNotes('');
    setItems([emptyItem()]);
    setError('');
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setError(''); };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, emptyItem()]);

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const grandTotals = items.reduce(
    (acc, it) => {
      const { excl, taxAmt, incl } = calcRow(it);
      return { excl: acc.excl + excl, taxAmt: acc.taxAmt + taxAmt, incl: acc.incl + incl };
    },
    { excl: 0, taxAmt: 0, incl: 0 }
  );

  const handleSave = async () => {
    if (!supplier) { setError('Please select a supplier.'); return; }
    if (!date) { setError('Please select a date.'); return; }
    const validItems = items.filter(it => it.product && it.quantity && it.rate);
    if (validItems.length === 0) { setError('Add at least one complete line item.'); return; }

    setSaving(true);
    setError('');
    try {
      const poRes = await api.post('/purchase-orders/', {
        supplier,
        date,
        notes,
        status: 'draft',
      });
      const poId = poRes.data.id;

      await Promise.all(
        validItems.map(it => {
          const { excl, taxAmt, incl } = calcRow(it);
          return api.post('/purchase-order-items/', {
            purchase_order: poId,
            product: it.product,
            quantity: parseFloat(it.quantity),
            rate: parseFloat(it.rate),
            tax_percent: parseFloat(it.tax_percent) || 0,
            value_excl_tax: excl,
            tax_amount: taxAmt,
            value_incl_tax: incl,
          });
        })
      );

      await fetchAll();
      closeModal();
    } catch (e) {
      setError(e?.response?.data?.detail || JSON.stringify(e?.response?.data) || 'Failed to create purchase order.');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => n.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <Layout>
      <div className="animate-fadeIn min-h-screen bg-[#f4f5f9] p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track and manage all purchase orders</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Purchase Order
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading orders…
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg className="w-14 h-14 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-semibold text-gray-500">No purchase orders yet</p>
              <p className="text-sm mt-1">Click "New Purchase Order" to create your first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {['PO Number', 'Supplier', 'Date', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => {
                    const st = statusStyles[o.status] || statusStyles.draft;
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                          {o.po_number || `PO-${String(o.id).padStart(5, '0')}`}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {typeof o.supplier === 'object' ? o.supplier?.name : (suppliers.find(s => s.id === o.supplier)?.name || '—')}
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{o.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              View
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && orders.length > 0 && (
          <p className="text-xs text-gray-400 mt-3 px-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        )}

        {/* New PO Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                <h3 className="font-bold text-gray-900 text-lg">New Purchase Order</h3>
                <button onClick={closeModal} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-lg transition-colors">×</button>
              </div>

              <div className="p-6 space-y-6">
                {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>}

                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Supplier <span className="text-red-500">*</span></label>
                    <select className={inp} value={supplier} onChange={e => setSupplier(e.target.value)}>
                      <option value="">Select supplier…</option>
                      {suppliers.filter(s => s.is_active !== false).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Date <span className="text-red-500">*</span></label>
                    <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Notes</label>
                  <textarea className={inp + ' resize-none'} rows={2} placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-700">Line Items</h4>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Item
                    </button>
                  </div>

                  {/* Items Table */}
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-left">Product</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-24">Qty</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-28">Rate</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-20">Tax %</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-28">Excl. Tax</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-24">Tax Amt</th>
                            <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 py-2.5 text-right w-28">Incl. Tax</th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {items.map((item, idx) => {
                            const { excl, taxAmt, incl } = calcRow(item);
                            return (
                              <tr key={idx} className="hover:bg-gray-50/40">
                                <td className="px-3 py-2">
                                  {products.length > 0 ? (
                                    <select
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 min-w-[140px]"
                                      value={item.product}
                                      onChange={e => updateItem(idx, 'product', e.target.value)}
                                    >
                                      <option value="">Select product…</option>
                                      {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 min-w-[140px]"
                                      placeholder="Product name / ID"
                                      value={item.product}
                                      onChange={e => updateItem(idx, 'product', e.target.value)}
                                    />
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                    placeholder="0"
                                    value={item.quantity}
                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                    placeholder="0.00"
                                    value={item.rate}
                                    onChange={e => updateItem(idx, 'rate', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50"
                                    placeholder="0"
                                    value={item.tax_percent}
                                    onChange={e => updateItem(idx, 'tax_percent', e.target.value)}
                                  />
                                </td>
                                <td className="px-3 py-2 text-right text-gray-700 font-medium tabular-nums">{fmt(excl)}</td>
                                <td className="px-3 py-2 text-right text-gray-500 tabular-nums">{fmt(taxAmt)}</td>
                                <td className="px-3 py-2 text-right text-gray-900 font-semibold tabular-nums">{fmt(incl)}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => removeItem(idx)}
                                    disabled={items.length === 1}
                                    className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Grand Totals */}
                        <tfoot>
                          <tr className="bg-gray-50 border-t border-gray-100">
                            <td colSpan={4} className="px-3 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Grand Total</td>
                            <td className="px-3 py-3 text-right text-sm font-bold text-gray-700 tabular-nums">{fmt(grandTotals.excl)}</td>
                            <td className="px-3 py-3 text-right text-sm font-semibold text-gray-500 tabular-nums">{fmt(grandTotals.taxAmt)}</td>
                            <td className="px-3 py-3 text-right text-sm font-bold text-gray-900 tabular-nums">{fmt(grandTotals.incl)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Rows with empty product/qty/rate will be skipped.</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white rounded-b-3xl">
                <button onClick={closeModal} className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                >
                  {saving ? 'Creating…' : 'Create Purchase Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

