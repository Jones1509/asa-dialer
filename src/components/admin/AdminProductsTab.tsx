import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price: string;
  price_type: string;
  provision: string | null;
  category: string;
  active: boolean;
}

interface AdminProductsTabProps {
  showNotif: (msg: string) => void;
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ showNotif }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: '📦', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const createProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) return;
    const { error } = await supabase.from('products').insert(form);
    if (error) { showNotif('❌ Kunne ikke oprette produkt'); return; }
    showNotif('✅ Produkt oprettet!');
    setForm({ name: '', description: '', icon: '📦', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });
    setShowCreate(false);
    fetchProducts();
  };

  const toggleProduct = async (id: string, active: boolean) => {
    await supabase.from('products').update({ active: !active }).eq('id', id);
    showNotif(active ? '🔒 Produkt deaktiveret' : '✅ Produkt aktiveret');
    fetchProducts();
  };

  if (loading) return <div className="p-8 text-muted-foreground">Indlæser produkter...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base">🛍️ Produkter ({products.length})</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary-smooth text-sm">+ Nyt produkt</button>
      </div>

      {showCreate && (
        <div className="card-surface rounded-2xl p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="label-clean">Produktnavn</label>
              <input className="input-clean" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Navn" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Ikon (emoji)</label>
              <input className="input-clean" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Pris</label>
              <input className="input-clean" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="10.000 kr." />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Pristype</label>
              <select className="input-clean" value={form.price_type} onChange={e => setForm({ ...form, price_type: e.target.value })}>
                <option>Engangsbetaling</option>
                <option>/ måned</option>
                <option>/ år</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="label-clean">Beskrivelse</label>
            <textarea className="input-clean resize-none h-16" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="label-clean">Provision</label>
              <input className="input-clean" value={form.provision} onChange={e => setForm({ ...form, provision: e.target.value })} placeholder="30% provision" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="label-clean">Kategori</label>
              <select className="input-clean" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="engang">Engangsbetaling</option>
                <option value="abo">Abonnement</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={createProduct} className="btn-primary-smooth text-sm">✅ Opret</button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost-smooth text-sm">Annuller</button>
          </div>
        </div>
      )}

      <div className="card-surface rounded-2xl overflow-hidden">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
            <div className="text-2xl">{p.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.price} {p.price_type}</div>
            </div>
            <span className="text-xs text-success font-medium">{p.provision}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              {p.active ? 'Aktiv' : 'Inaktiv'}
            </span>
            <button onClick={() => toggleProduct(p.id, p.active)} className="btn-ghost-smooth text-xs py-1.5 px-3">
              {p.active ? '🔒' : '✅'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
