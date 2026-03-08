import React from 'react';

export const IncomingPage: React.FC = () => {
  return (
    <div className="flex flex-col p-8 gap-6 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-extrabold text-[26px] tracking-tight">📲 Indgående opkald</h1>
      <div className="card-surface rounded-2xl p-10 text-center">
        <div className="text-5xl mb-4">📵</div>
        <div className="text-base text-foreground/70 font-medium">Ingen indgående opkald lige nu</div>
        <div className="text-sm text-muted-foreground mt-2 leading-relaxed">Opkald vil automatisk dukke op her</div>
      </div>
    </div>
  );
};
