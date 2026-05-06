import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Package, Tag, Zap, CreditCard } from 'lucide-react';

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

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('created_at');
      setProducts(data ?? []);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const filtered = (activeTab === 'alle' ? products : products.filter(p => p.category === activeTab))
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-bold text-xl tracking-tight">Produktshop</h1>
        <p className="text-[13px] text-muted-foreground/60 mt-1">Vælg løsninger der passer til dine kunders behov</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5">
          {tabs.map(t => {
            const Icon = t.icon;
            const count = t.id === 'alle' ? products.length : products.filter(p => p.category === t.id).length;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] cursor-pointer font-body font-medium border-none
                  transition-all duration-200 ease-out
                  ${activeTab === t.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              >
                <Icon size={13} strokeWidth={1.8} />
                {t.label} ({count})
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <input
          className="input-clean max-w-[200px] py-1.5 text-[12px]"
          placeholder="Søg produkt..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-muted-foreground text-[13px]">Indlæser produkter...</div>
      ) : filtered.length === 0 ? (
        <div className="card-surface rounded-xl p-10 text-center flex flex-col items-center gap-3">
          <ShoppingBag size={36} className="text-muted-foreground/25" strokeWidth={1.2} />
          <div className="text-muted-foreground/50 text-[13px]">
            {products.length === 0 ? 'Ingen produkter oprettet endnu' : 'Ingen produkter matcher din søgning'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {filtered.map((p, i) => (
            <div key={p.id} className="card-surface hover-lift rounded-xl p-5 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Package size={18} className="text-accent-foreground" strokeWidth={1.8} />
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  p.category === 'abo'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {p.category === 'abo' ? 'Abonnement' : 'Engangsbetaling'}
                </span>
              </div>
              <div className="font-heading font-bold text-[14px] tracking-tight">{p.name}</div>
              <div className="text-[13px] text-muted-foreground/60 mt-1 mb-4 leading-relaxed line-clamp-2">{p.description || 'Ingen beskrivelse'}</div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-heading font-bold text-lg text-primary">
                    {p.price}
                    <span className="text-[12px] text-muted-foreground/50 font-body font-normal ml-1">{p.price_type}</span>
                  </div>
                  {p.provision && (
                    <div className="text-[11px] text-success font-medium mt-0.5 flex items-center gap-1">
                      <Tag size={10} strokeWidth={2} />
                      {p.provision} provision
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
