'use client';

import { useState, useEffect, useCallback } from 'react';
import { Monitor, Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Printer, X, Loader2, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { api } from '@/lib/api';

// Types API
interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  status: string;
  stocks?: { id: string; variant: string; price: number; qty: number; sku?: string }[];
  category?: { id: string; name: string; slug: string } | null;
  images?: { id: string; url: string; alt?: string }[];
}

interface Product {
  id: string;
  nom: string;
  prix: number;
  categorie: string;
  stock: number;
  ref: string;
  image?: string;
}

interface CartItem extends Product {
  quantite: number;
}

interface ReceiptData {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  items: { productId: string; name: string; price: number; quantity: number; total: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  kpay?: { kpayId?: string; reference?: string; message?: string; error?: string } | null;
  createdAt: string;
}

type PaymentMethod = 'MTN_MOMO' | 'ORANGE_MONEY' | 'ESPECES' | 'VIREMENT' | 'GFS_PAYMENT';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  MTN_MOMO: 'MTN MoMo',
  ORANGE_MONEY: 'Orange Money',
  ESPECES: 'Especes',
  VIREMENT: 'Virement',
  GFS_PAYMENT: 'GFSolution',
};

export default function POSPage() {
  const [search, setSearch] = useState('');
  const [categorieFilter, setCategorieFilter] = useState('Toutes');
  const [posProducts, setPosProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toutes']);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [remise, setRemise] = useState('');
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('ESPECES');
  const [clientNom, setClientNom] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Charger les produits depuis l'API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ result: boolean; data: ApiProduct[]; meta: any }>(
        '/products/admin/all?perPage=200'
      );
      if (res.result && res.data) {
        const mapped: Product[] = res.data
          .filter((p) => p.status === 'ACTIVE' || p.status === 'DRAFT')
          .map((p) => {
            const totalStock = p.stocks?.reduce((sum, s) => sum + s.qty, 0) || 0;
            const sku = p.stocks?.[0]?.sku || p.slug?.substring(0, 10)?.toUpperCase() || p.id.substring(0, 8);
            return {
              id: p.id,
              nom: p.name,
              prix: p.price || p.stocks?.[0]?.price || 0,
              categorie: p.category?.name || 'Sans categorie',
              stock: totalStock,
              ref: sku,
              image: p.images?.[0]?.url,
            };
          });
        setPosProducts(mapped);

        // Extraire les categories uniques
        const cats = new Set(mapped.map((p) => p.categorie));
        setCategories(['Toutes', ...Array.from(cats).sort()]);
      }
    } catch (err) {
      console.error('Erreur chargement produits POS:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = posProducts.filter((p) => {
    const matchSearch =
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      p.ref.toLowerCase().includes(search.toLowerCase());
    const matchCat = categorieFilter === 'Toutes' || p.categorie === categorieFilter;
    return matchSearch && matchCat;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.id === product.id && c.quantite < product.stock
            ? { ...c, quantite: c.quantite + 1 }
            : c
        );
      }
      return [...prev, { ...product, quantite: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.id === id
            ? { ...c, quantite: Math.max(1, Math.min(c.quantite + delta, c.stock)) }
            : c
        )
        .filter((c) => c.quantite > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const sousTotal = cart.reduce((sum, c) => sum + c.prix * c.quantite, 0);
  const remiseVal = remise ? Math.min(Number(remise), sousTotal) : 0;
  const tva = Math.round((sousTotal - remiseVal) * 0.1925);
  const total = sousTotal - remiseVal + tva;

  const needsPhone = modePaiement === 'MTN_MOMO' || modePaiement === 'ORANGE_MONEY';

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (needsPhone && !phoneNumber.trim()) {
      setCheckoutError('Veuillez saisir le numero de telephone pour le paiement Mobile Money.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const payload = {
        items: cart.map((c) => ({
          productId: c.id,
          quantity: c.quantite,
          price: c.prix,
        })),
        paymentMethod: modePaiement,
        customerName: clientNom || undefined,
        phoneNumber: needsPhone ? phoneNumber : undefined,
        discount: remiseVal || undefined,
      };

      const res = await api.post<{ result: boolean; message: string; data: ReceiptData }>(
        '/pos/sale',
        payload
      );

      if (res.result) {
        setLastReceipt(res.data);
        setShowReceipt(true);
        setCart([]);
        setRemise('');
        setClientNom('');
        setPhoneNumber('');

        // Recharger les produits pour mettre a jour les stocks
        loadProducts();
      } else {
        setCheckoutError(res.message || 'Erreur lors de la vente');
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Erreur lors de la vente');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Vider le panier ?')) {
      setCart([]);
      setRemise('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-3">Chargement des produits...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
          <Monitor className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-dark">Point de vente (POS)</h1>
        <span className="text-sm text-gray-3 ml-auto">{posProducts.length} produits disponibles</span>
      </div>

      <div className="grid grid-cols-[1fr_380px] gap-4 h-[calc(100vh-180px)]">
        {/* Produits */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Recherche + Filtres */}
          <div className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
              <input
                type="text"
                placeholder="Rechercher produit ou ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategorieFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                    categorieFilter === cat
                      ? 'bg-primary text-white'
                      : 'bg-gray-6 text-gray-2 hover:bg-gray-5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grille produits */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={p.stock === 0}
                  className="bg-white rounded-xl shadow-sm p-4 text-left hover:shadow-md hover:border-primary border border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {p.image ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden mb-3">
                      <img src={p.image} alt={p.nom} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center mb-3">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-dark line-clamp-2 mb-1">{p.nom}</p>
                  <p className="text-xs text-gray-3 mb-2">{p.ref}</p>
                  <p className="text-base font-bold text-primary">{formatPrice(p.prix)}</p>
                  <p className={`text-xs mt-1 ${p.stock <= 3 ? 'text-danger font-medium' : 'text-gray-3'}`}>
                    Stock: {p.stock}
                  </p>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-4 text-center py-12 text-gray-3">
                  <Search className="w-8 h-8 mx-auto mb-2 text-gray-4" />
                  <p className="text-sm">Aucun produit trouve</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Panier */}
        <div className="bg-white rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-5">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Panier ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button onClick={handleClearCart} className="text-xs text-danger hover:underline">
                Vider
              </button>
            )}
          </div>

          {/* Client */}
          <div className="p-3 border-b border-gray-5">
            <input
              type="text"
              placeholder="Nom du client (optionnel)"
              value={clientNom}
              onChange={(e) => setClientNom(e.target.value)}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-3">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 text-gray-4" />
                <p className="text-sm">Panier vide</p>
                <p className="text-xs text-gray-4">Cliquez sur un produit pour l&apos;ajouter</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-6/50 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark truncate">{item.nom}</p>
                    <p className="text-xs text-primary font-semibold">{formatPrice(item.prix)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-6 h-6 rounded bg-gray-6 flex items-center justify-center hover:bg-gray-5 transition"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.quantite}</span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="w-6 h-6 rounded bg-gray-6 flex items-center justify-center hover:bg-gray-5 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-dark w-20 text-right shrink-0">
                    {formatPrice(item.prix * item.quantite)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-3 hover:text-danger transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totaux + Paiement */}
          <div className="p-4 border-t border-gray-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-2">Sous-total</span>
              <span className="font-semibold">{formatPrice(sousTotal)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-2 whitespace-nowrap">Remise (FCFA)</span>
              <input
                type="number"
                min={0}
                value={remise}
                onChange={(e) => setRemise(e.target.value)}
                placeholder="0"
                className="flex-1 border border-gray-5 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-right"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-2">TVA (19.25%)</span>
              <span>{formatPrice(tva)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-gray-5 pt-3">
              <span className="text-dark">Total TTC</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>

            <select
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as PaymentMethod)}
              className="w-full border border-gray-5 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {/* Champ telephone pour Mobile Money */}
            {needsPhone && (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-3" />
                <input
                  type="tel"
                  placeholder="Numero de telephone (ex: 6XXXXXXXX)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full border border-gray-5 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            )}

            {/* Erreur */}
            {checkoutError && (
              <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                <p className="text-xs text-danger">{checkoutError}</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || checkoutLoading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Encaisser {cart.length > 0 && formatPrice(total)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Recu */}
      {showReceipt && lastReceipt && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:bg-white print:static">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 print:shadow-none print:rounded-none print:max-w-none">
            <div className="text-center mb-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  lastReceipt.paymentStatus === 'PAID'
                    ? 'bg-green-100'
                    : 'bg-yellow-100'
                }`}
              >
                {lastReceipt.paymentStatus === 'PAID' ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <CreditCard className="w-6 h-6 text-yellow-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-dark">
                {lastReceipt.paymentStatus === 'PAID'
                  ? 'Paiement reussi !'
                  : 'En attente de paiement'}
              </h3>
              <p className="text-sm text-gray-3">Ref: {lastReceipt.orderNumber}</p>
              {lastReceipt.customerName && (
                <p className="text-sm text-gray-3">Client: {lastReceipt.customerName}</p>
              )}
              <p className="text-xs text-gray-4 mt-1">
                {new Date(lastReceipt.createdAt).toLocaleString('fr-FR')}
              </p>
            </div>

            {/* KPay message */}
            {lastReceipt.kpay && !lastReceipt.kpay.error && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  {lastReceipt.kpay.message}
                </p>
                {lastReceipt.kpay.reference && (
                  <p className="text-xs text-blue-500 mt-1">
                    Ref KPay: {lastReceipt.kpay.reference}
                  </p>
                )}
              </div>
            )}
            {lastReceipt.kpay?.error && (
              <div className="bg-red-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-danger">
                  Erreur paiement: {lastReceipt.kpay.error}
                </p>
              </div>
            )}

            <div className="space-y-2 border-t border-b border-gray-5 py-3 mb-3">
              {lastReceipt.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-2">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="font-medium">{formatPrice(item.total)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-3">Sous-total</span>
                <span>{formatPrice(lastReceipt.subtotal)}</span>
              </div>
              {lastReceipt.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-3">Remise</span>
                  <span className="text-danger">-{formatPrice(lastReceipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-3">TVA (19.25%)</span>
                <span>{formatPrice(lastReceipt.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-5">
                <span>Total TTC</span>
                <span className="text-primary">{formatPrice(lastReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-3 pt-1">
                <span>Mode de paiement</span>
                <span>{PAYMENT_LABELS[lastReceipt.paymentMethod as PaymentMethod] || lastReceipt.paymentMethod}</span>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-5 text-gray-2 py-2.5 rounded-lg text-sm hover:bg-gray-6 transition"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-sm hover:bg-primary/90 transition"
              >
                <X className="w-4 h-4" /> Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
