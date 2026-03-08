import React, { useState } from 'react';

const products = [
  { icon: '🖩', name: 'Prisberegner', desc: 'Automatisk prisberegning til dine kunder', price: '40.000 – 49.999 kr.', type: 'Engangsbetaling', provision: '30% provision', cat: 'engang' },
  { icon: '🌐', name: 'Hjemmeside', desc: 'Professionel webløsning med AI integration', price: '5.000 – 9.999 kr.', type: 'Engangsbetaling', provision: '30% provision · 50% over 10.000 kr.', cat: 'engang' },
  { icon: '🔧', name: 'Vedligeholdelse', desc: 'Fuld support og hjælp til din hjemmeside', price: '12.000 kr.', type: '/ år', provision: '30% provision', cat: 'engang' },
];

const tabs = [
  { id: 'engang', label: 'Engangsbetalte 3' },
  { id: 'abo', label: 'Abonnement 4' },
  { id: 'alle', label: 'Alle produkter 7' },
];

export const ShopPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('engang');

  return (
    <div className="flex flex-col p-8 gap-7 overflow-y-auto flex-1 animate-fade-in">
      <div>
        <h1 className="font-heading font-extrabold text-[26px] tracking-tight">🛍️ Produktshop</h1>
        <p className="text-sm text-muted-foreground mt-1">Vælg en eller flere løsninger der passer bedst til dine kunders behov</p>
      </div>
      <div className="card-surface border-primary/15 rounded-2xl px-5 py-4 flex items-center gap-4">
        <span className="text-sm text-muted-foreground">📄 Salgsscripts:</span>
        {['Hjemmeside', 'Prisberegner', 'Chatbot'].map(s => (
          <button key={s} className="btn-ghost-smooth text-[13px] py-1.5 px-3.5">
            ⬇ {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2 rounded-full text-sm cursor-pointer font-body font-medium border-none
              transition-all duration-300 ease-out
              ${activeTab === t.id
                ? 'bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(217_91%_60%/0.25)]'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5">
        {products.map((p, i) => (
          <div key={p.name} className="card-surface hover-lift rounded-2xl p-6" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="text-3xl mb-4">{p.icon}</div>
            <div className="font-heading font-bold text-base tracking-tight">{p.name}</div>
            <div className="text-sm text-muted-foreground mt-1.5 mb-5 leading-relaxed">{p.desc}</div>
            <div className="font-heading font-extrabold text-xl text-primary">
              {p.price} <span className="text-sm text-muted-foreground font-body font-normal">{p.type}</span>
            </div>
            <div className="text-xs text-success font-medium mt-1.5">{p.provision}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
