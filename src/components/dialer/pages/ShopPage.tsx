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
}

const tabs = [
  { id: 'engang', label: 'Engangsbetalte' },
  { id: 'abo', label: 'Abonnement' },
  { id: 'alle', label: 'Alle produkter' },
];

export const ShopPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('alle');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = activeTab === 'alle' ? products : products.filter(p => p.category === activeTab);

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">🛍️ Produktshop</h1>
        <p className="text-sm text-muted-foreground mt-1">Vælg en eller flere løsninger der passer bedst til dine kunders behov</p>
      </div>
      <div className="flex gap-2">
        {tabs.map(t => {
          const count = t.id === 'alle' ? products.length : products.filter(p => p.category === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-full text-sm cursor-pointer font-body font-medium border-none
                transition-all duration-300 ease-out
                ${activeTab === t.id
                  ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(217_91%_60%/0.25)]'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
            >
              {t.label} {count}
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="text-muted-foreground text-sm">Indlæser produkter...</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
          {filtered.map((p, i) => (
            <div key={p.id} className="card-surface hover-lift rounded-2xl p-6" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="text-3xl mb-4">{p.icon}</div>
              <div className="font-heading font-bold text-base tracking-tight">{p.name}</div>
              <div className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">{p.description}</div>
              <div className="font-heading font-extrabold text-xl text-primary">
                {p.price} <span className="text-sm text-muted-foreground font-body font-normal">{p.price_type}</span>
              </div>
              <div className="text-xs text-success font-medium mt-1.5">{p.provision}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
