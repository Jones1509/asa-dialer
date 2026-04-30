import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/backend-stub';
import { Package, Plus, CheckCircle2, Lock, Unlock, Trash2, Pencil, X, Save } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description || '',
      icon: p.icon || '',
      price: p.price,
      price_type: p.price_type,
      provision: p.provision || '',
      category: p.category,
    });
  };

  const saveEdit = async () => {
    if (!editingId || !form.name.trim() || !form.price.trim()) return;
    const { error } = await supabase.from('products').update({
      name: form.name,
      description: form.description,
      price: form.price,
      price_type: form.price_type,
      provision: form.provision,
      category: form.category,
    }).eq('id', editingId);
    if (error) { showNotif('Kunne ikke opdatere produkt'); return; }
    showNotif('Produkt opdateret');
    setEditingId(null);
    setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' });
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    showNotif('Produkt slettet');
    setDeleteConfirm(null);
    fetchProducts();
  };

  const toggleProduct = async (id: string, active: boolean) => {
    await supabase.from('products').update({ active: !active }).eq('id', id);
    showNotif(active ? 'Produkt deaktiveret' : 'Produkt aktiveret');
    fetchProducts();
  };

  if (loading) return <div className="p-8 text-muted-foreground/60 text-[13px]">Indlæser produkter...</div>;

  const renderForm = (onSave: () => void, onCancel: () => void, saveLabel: string) => (
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
        <button onClick={onSave} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
          <Save size={14} strokeWidth={2} />
          {saveLabel}
        </button>
        <button onClick={onCancel} className="btn-ghost-smooth text-[12px]">Annuller</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-[14px]">Produkter ({products.length})</h3>
        <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' }); }} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
          <Plus size={14} strokeWidth={2} />
          Nyt produkt
        </button>
      </div>

      {showCreate && renderForm(createProduct, () => setShowCreate(false), 'Opret')}

      {editingId && !showCreate && renderForm(saveEdit, () => { setEditingId(null); setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' }); }, 'Gem ændringer')}

      <div className="card-surface rounded-xl overflow-hidden">
        {products.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground/50 text-[13px]">Ingen produkter oprettet endnu</div>
        ) : products.map(p => (
          <div key={p.id} className={`flex items-center gap-3.5 px-4 py-3.5 border-b border-border/20 last:border-0 ${editingId === p.id ? 'bg-accent/30' : ''}`}>
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
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(p)} title="Rediger" className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-all duration-150">
                <Pencil size={13} />
              </button>
              <button onClick={() => toggleProduct(p.id, p.active)} title={p.active ? 'Deaktiver' : 'Aktiver'} className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-all duration-150">
                {p.active ? <Lock size={13} /> : <Unlock size={13} />}
              </button>
              {deleteConfirm === p.id ? (
                <div className="flex items-center gap-1">
                  <button onClick={() => deleteProduct(p.id)} className="text-[10px] bg-destructive text-destructive-foreground border-none rounded-md px-2 py-1 cursor-pointer font-medium">Slet</button>
                  <button onClick={() => setDeleteConfirm(null)} className="text-[10px] bg-transparent border border-border/50 text-muted-foreground rounded-md px-2 py-1 cursor-pointer">Nej</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(p.id)} title="Slet" className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all duration-150">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
