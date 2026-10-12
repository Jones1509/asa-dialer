import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Package, Tag, Zap, CreditCard, Search } from 'lucide-react';
import { EmptyState, ErrorState, SkeletonCards } from '@/components/shell/states';

interface Product {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  price: string;
  price_type: string;
  provision: string | null;
  category: string;
}

const tabs = [
  { id: 'alle', label: 'Alle', icon: Package },
  { id: 'engang', label: 'Engangsbetaling', icon: CreditCard },
  { id: 'abo', label: 'Abonnement', icon: Zap },
];

export const ShopPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('alle');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [failed, setFailed] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setFailed(false);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at');
    if (error) setFailed(true);
    setProducts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const filtered = (activeTab === 'alle' ? products : products.filter(p => p.category === activeTab))
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="page flex flex-col gap-6">
        <header>
          <h1 className="page-title">Produktshop</h1>
          <p className="page-subtitle">Vælg løsninger der passer til dine kunders behov</p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="tablist" aria-label="Kategori" className="flex gap-1 overflow-x-auto rounded-xl bg-secondary p-1">
            {tabs.map(t => {
              const Icon = t.icon;
              const count = t.id === 'alle' ? products.length : products.filter(p => p.category === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors duration-150 md:min-h-9
                    ${activeTab === t.id
                      ? 'bg-card text-navy shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
                  {t.label} <span className="tabular-nums text-muted-foreground">({count})</span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:ml-auto sm:w-64">
            <label htmlFor="product-search" className="sr-only">Søg produkt</label>
            <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="product-search"
              type="search"
              className="input-clean pl-9"
              placeholder="Søg produkt"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <SkeletonCards count={4} height="h-48" className="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" />
        ) : failed ? (
          <div className="card-surface"><ErrorState title="Kunne ikke hente produkter" onRetry={fetchProducts} /></div>
        ) : filtered.length === 0 ? (
          <div className="card-surface">
            {products.length === 0 ? (
              <EmptyState icon={ShoppingBag} title="Ingen produkter endnu" message="En administrator kan oprette produkter under Admin → Produkter. De vises her med pris og provision." />
            ) : (
              <EmptyState icon={Search} title="Ingen produkter matcher" message="Prøv et andet søgeord eller vælg en anden kategori." action={{ label: 'Nulstil filtre', onClick: () => { setSearchQuery(''); setActiveTab('alle'); } }} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map(p => (
              <article key={p.id} className="card-surface flex flex-col p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                    <Package size={20} className="text-primary" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                    p.category === 'abo' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                  }`}>
                    {p.category === 'abo' ? 'Abonnement' : 'Engangsbetaling'}
                  </span>
                </div>
                <h2 className="section-title">{p.name}</h2>
                <p className="mb-4 mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{p.description || 'Ingen beskrivelse'}</p>
                <div className="mt-auto">
                  <div className="text-xl font-semibold tabular-nums text-navy">
                    {p.price}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">{p.price_type}</span>
                  </div>
                  {p.provision && (
                    <div className="mt-1 flex items-center gap-1 text-sm font-medium text-success">
                      <Tag size={16} strokeWidth={1.75} aria-hidden="true" />
                      {p.provision} provision
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
