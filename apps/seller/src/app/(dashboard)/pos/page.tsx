'use client';

import { useState, useEffect, useMemo } from 'react';
import { Store, ShoppingCart, Search, Plus, Minus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  stocks: { qty: number }[];
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function POSPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ESPECES');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [discount, setDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get<any>('/products?perPage=200');
        if (res.data) setProducts(res.data);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!search) return products.slice(0, 20);
    return products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price || 0,
        quantity: 1,
        image: product.images?.[0]?.url,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) => prev.map((c) => {
      if (c.productId !== productId) return c;
      const newQty = c.quantity + delta;
      return newQty > 0 ? { ...c, quantity: newQty } : c;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = Math.round((subtotal - discount) * 0.1925);
  const total = subtotal - discount + tax;

  const handleSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const res = await api.post<any>('/pos/sale', {
        items: cart.map((c) => ({
          productId: c.productId,
          quantity: c.quantity,
          price: c.price,
        })),
        paymentMethod,
        customerName: customerName || undefined,
        phoneNumber: phoneNumber || undefined,
        discount,
      });
      if (res.result) {
        setLastReceipt(res.data);
        setCart([]);
        setCustomerName('');
        setPhoneNumber('');
        setDiscount(0);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur POS');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Store className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Gestionnaire POS</h1>
      </div>

      {lastReceipt && (
        <div className="bg-success-soft border border-success/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">Vente enregistree</span>
          </div>
          <p className="text-sm text-gray-2">
            N. {lastReceipt.orderNumber} — {formatPrice(lastReceipt.total)} — {lastReceipt.paymentStatus}
          </p>
          <button onClick={() => setLastReceipt(null)} className="text-xs text-gray-3 mt-2 underline">Fermer</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product catalog */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-3" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="text-left border border-gray-5 rounded-lg p-3 hover:border-primary hover:bg-primary-soft/30 transition"
              >
                <p className="text-sm font-medium text-dark truncate">{p.name}</p>
                <p className="text-xs text-primary font-semibold mt-1">{formatPrice(p.price || 0)}</p>
                <p className="text-xs text-gray-3">Stock: {p.stocks?.reduce((s: number, st: any) => s + st.qty, 0) || 0}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col">
          <h3 className="font-semibold text-dark mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Panier ({cart.length})
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4 max-h-[300px]">
            {cart.length === 0 ? (
              <p className="text-sm text-gray-3 text-center py-8">Panier vide</p>
            ) : cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-6 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dark truncate">{item.name}</p>
                  <p className="text-xs text-gray-3">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded bg-gray-5 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                  <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId, 1)} className="w-6 h-6 rounded bg-gray-5 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                </div>
                <span className="text-xs font-semibold w-20 text-right">{formatPrice(item.price * item.quantity)}</span>
                <button onClick={() => removeFromCart(item.productId)} className="text-gray-3 hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-5 pt-3 space-y-2">
            <input
              type="text"
              placeholder="Nom du client (optionnel)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-xs outline-none"
            />
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-xs outline-none"
            >
              <option value="ESPECES">Especes</option>
              <option value="MTN_MOMO">MTN MoMo</option>
              <option value="ORANGE_MONEY">Orange Money</option>
              <option value="VIREMENT">Virement</option>
            </select>
            {(paymentMethod === 'MTN_MOMO' || paymentMethod === 'ORANGE_MONEY') && (
              <input
                type="text"
                placeholder="Numero telephone (237...)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full border border-gray-5 rounded-lg px-3 py-2 text-xs outline-none"
              />
            )}
            <div className="flex justify-between text-xs text-gray-2">
              <span>Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-2">
              <span>Remise</span>
              <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="w-20 border border-gray-5 rounded px-2 py-1 text-right text-xs outline-none" />
            </div>
            <div className="flex justify-between text-xs text-gray-2">
              <span>TVA (19.25%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-dark">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              onClick={handleSale}
              disabled={cart.length === 0 || processing}
              className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-hover transition text-sm font-medium disabled:opacity-50"
            >
              {processing ? 'Traitement...' : `Encaisser ${formatPrice(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
