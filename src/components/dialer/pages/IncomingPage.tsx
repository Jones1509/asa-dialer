import React from 'react';

export const IncomingPage: React.FC = () => {
  return (
    <div className="flex flex-col p-7 gap-5 overflow-y-auto flex-1 animate-fade-in">
      <h1 className="font-heading font-extrabold text-2xl">📲 Indgående opkald</h1>
      <div className="card-surface rounded-xl p-6 text-center">
        <div className="text-5xl mb-3">📵</div>
        <div className="text-base text-muted-foreground">Ingen indgående opkald lige nu</div>
        <div className="text-sm text-muted-foreground mt-1.5">Opkald vil automatisk dukke op her</div>
      </div>
    </div>
  );
};
