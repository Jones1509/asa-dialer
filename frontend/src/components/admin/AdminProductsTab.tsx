import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Package, Plus, Lock, Unlock, Trash2, Pencil, Save } from 'lucide-react';
import { EmptyState, SkeletonRows } from '@/components/shell/states';

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

  if (loading) return <div className="card-surface overflow-hidden"><SkeletonRows rows={4} /></div>;

  const renderForm = (onSave: () => void, onCancel: () => void, saveLabel: string) => (
    <div className="card-surface flex flex-col gap-4 p-5 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-name" className="label-clean">Produktnavn</label>
          <input id="pf-name" className="input-clean" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Navn" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-price" className="label-clean">Pris</label>
          <input id="pf-price" className="input-clean" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="10.000 kr." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-ptype" className="label-clean">Pristype</label>
          <select id="pf-ptype" className="input-clean" value={form.price_type} onChange={e => setForm({ ...form, price_type: e.target.value })}>
            <option>Engangsbetaling</option>
            <option>/ måned</option>
            <option>/ år</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pf-cat" className="label-clean">Kategori</label>
          <select id="pf-cat" className="input-clean" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="engang">Engangsbetaling</option>
            <option value="abo">Abonnement</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-desc" className="label-clean">Beskrivelse</label>
        <textarea id="pf-desc" className="input-clean resize-none h-20" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="pf-prov" className="label-clean">Provision</label>
        <input id="pf-prov" className="input-clean" value={form.provision} onChange={e => setForm({ ...form, provision: e.target.value })} placeholder="30% provision" />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button type="button" onClick={onSave} className="btn-primary">
          <Save size={16} strokeWidth={2} aria-hidden="true" />
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">Annuller</button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Produkter <span className="font-body text-sm font-normal text-muted-foreground">({products.length})</span></h2>
        <button onClick={() => { setShowCreate(!showCreate); setEditingId(null); setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' }); }} className="btn-primary">
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Nyt produkt
        </button>
      </div>

      {showCreate && renderForm(createProduct, () => setShowCreate(false), 'Opret')}

      {editingId && !showCreate && renderForm(saveEdit, () => { setEditingId(null); setForm({ name: '', description: '', icon: '', price: '', price_type: 'Engangsbetaling', provision: '', category: 'engang' }); }, 'Gem ændringer')}

      <div className="card-surface overflow-hidden">
        {products.length === 0 ? (
          <EmptyState icon={Package} title="Ingen produkter endnu" message="Opret dit første produkt, så sælgerne kan se pris og provision i Produktshoppen." action={{ label: 'Nyt produkt', icon: Plus, onClick: () => { setShowCreate(true); setEditingId(null); } }} />
        ) : (
          <ul className="divide-y divide-border">
            {products.map(p => (
              <li key={p.id} className={`flex flex-wrap items-center gap-3 px-4 py-3 ${editingId === p.id ? 'bg-accent/40' : ''}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Package size={16} className="text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
                </div>
                <div className="min-w-[140px] flex-1">
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.price} {p.price_type}{p.provision ? <span className="text-success"> · {p.provision} provision</span> : null}</div>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${p.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {p.active ? 'Aktiv' : 'Inaktiv'}
                </span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => startEdit(p)} aria-label={`Rediger ${p.name}`} title="Rediger" className="icon-btn hover:!bg-primary/10 hover:!text-primary">
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => toggleProduct(p.id, p.active)} aria-label={p.active ? `Deaktiver ${p.name}` : `Aktiver ${p.name}`} title={p.active ? 'Deaktiver' : 'Aktiver'} className="icon-btn">
                    {p.active ? <Lock size={16} aria-hidden="true" /> : <Unlock size={16} aria-hidden="true" />}
                  </button>
                  {deleteConfirm === p.id ? (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => deleteProduct(p.id)} className="btn-danger btn-sm">Slet</button>
                      <button type="button" onClick={() => setDeleteConfirm(null)} className="btn-ghost btn-sm">Fortryd</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setDeleteConfirm(p.id)} aria-label={`Slet ${p.name}`} title="Slet" className="icon-btn hover:!bg-destructive/10 hover:!text-destructive">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
