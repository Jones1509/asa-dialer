import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, CheckCircle2, Lock, Unlock } from 'lucide-react';

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
  const [form, setForm] = useState({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const createProduct = async () => {
    if (!form.name.trim() || !form.price.trim()) return;
    const { error } = await supabase.from('products').insert(form);
    if (error) { showNotif('Kunne ikke oprette produkt'); return; }
    showNotif('Produkt oprettet');
    setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });
    setShowCreate(false);
    fetchProducts();
  };

  const toggleProduct = async (id: string, active: boolean) => {
    await supabase.from('products').update({ active: !active }).eq('id', id);
    showNotif(active ? 'Produkt deaktiveret' : 'Produkt aktiveret');
    fetchProducts();
  };

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px]">Indlæser produkter...</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-[14px]">Produkter ({products.length})</h3>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
          <Plus size={14} strokeWidth={2} />
          Nyt produkt
        </button>
      </div>

      {showCreate && (
        <div className="card-surface rounded-xl p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="label-clean">Produktnavn</label>
              <input className="input-clean" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Navn" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean">Pris</label>
              <input className="input-clean" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="10.000 kr." />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean">Pristype</label>
              <select className="input-clean" value={form.price_type} onChange={e => setForm({ ...form, price_type: e.target.value })}>
                <option>Engangsbetaling</option>
                <option>/ måned</option>
                <option>/ år</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="label-clean">Kategori</label>
              <select className="input-clean" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="engang">Engangsbetaling</option>
                <option value="abo">Abonnement</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Beskrivelse</label>
            <textarea className="input-clean resize-none h-16" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="label-clean">Provision</label>
            <input className="input-clean" value={form.provision} onChange={e => setForm({ ...form, provision: e.target.value })} placeholder="30% provision" />
          </div>
          <div className="flex gap-2.5">
            <button onClick={createProduct} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
              <CheckCircle2 size={14} strokeWidth={2} />
              Opret
            </button>
            <button onClick={() => setShowCreate(false)} className="btn-ghost-smooth text-[12px]">Annuller</button>
          </div>
        </div>
      )}

      <div className="card-surface rounded-xl overflow-hidden">
        {products.map(p => (
          <div key={p.id} className="flex items-center gap-3.5 px-4 py-3.5 border-b border-border/20 last:border-0">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Package size={16} className="text-muted-foreground" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[13px]">{p.name}</div>
              <div className="text-[11px] text-muted-foreground/50">{p.price} {p.price_type}</div>
            </div>
            {p.provision && <span className="text-[11px] text-success font-medium">{p.provision}</span>}
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${p.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive/70'}`}>
              {p.active ? 'Aktiv' : 'Inaktiv'}
            </span>
            <button onClick={() => toggleProduct(p.id, p.active)} className="btn-ghost-smooth text-[11px] py-1.5 px-3 flex items-center gap-1.5">
              {p.active ? <><Lock size={12} /></> : <><Unlock size={12} /></>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
