import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingBag, Package } from 'lucide-react';

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
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-bold text-xl tracking-tight">Produktshop</h1>
        <p className="text-[13px] text-muted-foreground/60 mt-1">Vælg løsninger der passer til dine kunders behov</p>
      </div>
      <div className="flex gap-1.5">
        {tabs.map(t => {
          const count = t.id === 'alle' ? products.length : products.filter(p => p.category === t.id).length;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-[13px] cursor-pointer font-body font-medium border-none
                transition-all duration-200 ease-out
                ${activeTab === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>
      {loading ? (
        <div className="text-muted-foreground text-[13px]">Indlæser produkter...</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {filtered.map((p, i) => (
            <div key={p.id} className="card-surface hover-lift rounded-xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center mb-3">
                <Package size={18} className="text-muted-foreground" strokeWidth={1.8} />
              </div>
              <div className="font-heading font-bold text-[14px] tracking-tight">{p.name}</div>
              <div className="text-[13px] text-muted-foreground/60 mt-1 mb-4 leading-relaxed line-clamp-2">{p.description}</div>
              <div className="font-heading font-bold text-lg text-primary">
                {p.price} <span className="text-[12px] text-muted-foreground/50 font-body font-normal">{p.price_type}</span>
              </div>
              {p.provision && <div className="text-[11px] text-success font-medium mt-1">{p.provision}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
