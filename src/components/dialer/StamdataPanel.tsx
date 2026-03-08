import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/leads';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Phone as PhoneIcon, Mail, Globe, User } from 'lucide-react';

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
        <div className="text-muted-foreground text-[13px]">Vælg en kampagne for at starte</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-5 animate-fade-in bg-background">
      <div className="flex items-center gap-3">
        <span className="bg-accent text-accent-foreground rounded-md px-2.5 py-1 text-[11px] font-semibold">{campaignName}</span>
        <span className="text-[11px] text-muted-foreground/50 tabular-nums">ID: {lead.id.slice(0, 8)}</span>
        {saving && <span className="text-[11px] text-primary/60 ml-auto">Gemmer...</span>}
      </div>

      <h2 className="font-heading font-bold text-lg tracking-tight">Stamdata</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="label-clean flex items-center gap-1.5"><Building2 size={11} /> Virksomhed</label>
          <input className="input-clean" value={company} onChange={e => setCompany(e.target.value)} onBlur={saveStamdata} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-clean flex items-center gap-1.5"><PhoneIcon size={11} /> Telefon</label>
          <input className="input-clean" value={phone} onChange={e => setPhone(e.target.value)} onBlur={saveStamdata} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-clean flex items-center gap-1.5"><Mail size={11} /> Email</label>
          <input className="input-clean" value={email} onChange={e => setEmail(e.target.value)} onBlur={saveStamdata} placeholder="—" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="label-clean flex items-center gap-1.5"><Globe size={11} /> Hjemmeside</label>
          <input className="input-clean" value={website} onChange={e => setWebsite(e.target.value)} onBlur={saveStamdata} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="label-clean flex items-center gap-1.5"><User size={11} /> Kontaktperson</label>
        <input className="input-clean" value={contact} onChange={e => setContact(e.target.value)} onBlur={saveStamdata} placeholder="—" />
      </div>
    </div>
  );
};
