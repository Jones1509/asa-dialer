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

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-7 gap-6 animate-fade-in bg-background">
      <div>
        <div className="label-clean mb-2">Kampagne</div>
        <div className="badge-clean w-fit">Elektriker firmaer Jonas</div>
      </div>
      <div>
        <h2 className="font-heading font-extrabold text-[22px] tracking-tight">Stamdata</h2>
        <span className="text-[13px] text-muted-foreground font-body">Lead ID: {lead.id}</span>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label-clean">Virksomhedsnavn</label>
          <input className="input-clean" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Telefon</label>
          <input className="input-clean" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Email</label>
          <input className="input-clean" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ingen email" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Hjemmeside</label>
          <input className="input-clean" value={website} onChange={e => setWebsite(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="label-clean">Kontaktperson</label>
        <input className="input-clean" value={contact} onChange={e => setContact(e.target.value)} placeholder="Navn på kontaktperson" />
      </div>
    </div>
  );
};
