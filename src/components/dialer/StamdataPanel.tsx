import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';
import { supabase } from '@/integrations/supabase/client';

interface StamdataPanelProps {
  lead: Lead | null;
  campaignName: string;
}

export const StamdataPanel: React.FC<StamdataPanelProps> = ({ lead, campaignName }) => {
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lead) {
      setCompany(lead.company || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setWebsite(lead.website || '');
      setContact(lead.contact_person || '');
    }
  }, [lead]);

  const saveStamdata = async () => {
    if (!lead) return;
    setSaving(true);
    await supabase.from('leads').update({
      company, phone, email, website, contact_person: contact,
    }).eq('id', lead.id);
    setSaving(false);
  };

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Vælg en kampagne for at starte</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-7 gap-6 animate-fade-in bg-background">
      <div>
        <div className="label-clean mb-2">Kampagne</div>
        <div className="badge-clean w-fit">{campaignName}</div>
      </div>
      <div>
        <h2 className="font-heading font-extrabold text-[22px] tracking-tight">Stamdata</h2>
        <span className="text-[13px] text-muted-foreground font-body">Lead ID: {lead.id.slice(0, 8)}</span>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label className="label-clean">Virksomhedsnavn</label>
          <input className="input-clean" value={company} onChange={e => setCompany(e.target.value)} onBlur={saveStamdata} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Telefon</label>
          <input className="input-clean" value={phone} onChange={e => setPhone(e.target.value)} onBlur={saveStamdata} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Email</label>
          <input className="input-clean" value={email} onChange={e => setEmail(e.target.value)} onBlur={saveStamdata} placeholder="Ingen email" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="label-clean">Hjemmeside</label>
          <input className="input-clean" value={website} onChange={e => setWebsite(e.target.value)} onBlur={saveStamdata} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="label-clean">Kontaktperson</label>
        <input className="input-clean" value={contact} onChange={e => setContact(e.target.value)} onBlur={saveStamdata} placeholder="Navn på kontaktperson" />
      </div>
      {saving && <div className="text-xs text-muted-foreground">Gemmer...</div>}
    </div>
  );
};
