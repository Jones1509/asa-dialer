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
    <div className="flex flex-col p-7 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-extrabold text-2xl">🛍️ Produktshop</h1>
      <p className="text-sm text-muted-foreground">Vælg en eller flere løsninger der passer bedst til dine kunders behov</p>
      <div className="card-surface border-primary/30 rounded-xl px-5 py-3.5 flex items-center gap-4">
        <span className="text-sm text-muted-foreground">📄 Salgsscripts:</span>
        {['Hjemmeside', 'Prisberegner', 'Chatbot'].map(s => (
          <button key={s} className="bg-transparent border border-border rounded-lg px-3.5 py-1.5 text-sm text-muted-foreground cursor-pointer hover:border-primary/40 hover:text-primary transition-all duration-200">
            ⬇ {s}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-full border text-sm cursor-pointer transition-all duration-200 font-body
              ${activeTab === t.id ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground bg-transparent hover:border-primary/40'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {products.map(p => (
          <div key={p.name} className="card-surface hover-lift rounded-xl p-5">
            <div className="text-3xl mb-3">{p.icon}</div>
            <div className="font-heading font-bold text-base">{p.name}</div>
            <div className="text-sm text-muted-foreground mt-1.5 mb-4">{p.desc}</div>
            <div className="font-heading font-extrabold text-xl text-primary">
              {p.price} <span className="text-sm text-muted-foreground font-body font-normal">{p.type}</span>
            </div>
            <div className="text-xs text-success mt-1">{p.provision}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
