import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';

interface StamdataPanelProps {
  lead: Lead;
}

export const StamdataPanel: React.FC<StamdataPanelProps> = ({ lead }) => {
  const [company, setCompany] = useState(lead.company);
  const [phone, setPhone] = useState(lead.phone);
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(lead.website);
  const [contact, setContact] = useState('');

  useEffect(() => {
    setCompany(lead.company);
    setPhone(lead.phone);
    setEmail('');
    setWebsite(lead.website);
    setContact('');
  }, [lead]);

  const inputClass = "bg-muted border border-border rounded-lg px-3.5 py-2.5 text-sm font-body outline-none focus:border-primary/40 transition-colors";
  const labelClass = "text-xs text-muted-foreground font-medium tracking-wider uppercase";

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-5">
      <div>
        <div className="text-xs text-muted-foreground mb-1.5">Kampagne</div>
        <div className="bg-primary/10 border border-primary/30 text-primary rounded-md px-3.5 py-1.5 text-xs font-semibold w-fit">
          Elektriker firmaer Jonas
        </div>
      </div>
      <div className="font-heading font-extrabold text-xl flex items-center gap-3">
        Stamdata
        <span className="text-sm text-muted-foreground font-body font-normal">Lead ID: {lead.id}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Virksomhedsnavn</label>
          <input className={inputClass} value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Telefon</label>
          <input className={inputClass} value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Email</label>
          <input className={inputClass} value={email} onChange={e => setEmail(e.target.value)} placeholder="Ingen email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>Hjemmeside</label>
          <input className={inputClass} value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Kontaktperson</label>
        <input className={inputClass} value={contact} onChange={e => setContact(e.target.value)} placeholder="Navn på kontaktperson" />
      </div>
    </div>
  );
};
