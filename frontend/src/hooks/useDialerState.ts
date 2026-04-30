import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/backend-stub';
import { Lead } from '@/types/leads';

export function useDialerState() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [currentLeadIdx, setCurrentLeadIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalCallSeconds, setTotalCallSeconds] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRecalls, setTotalRecalls] = useState(0);
  const [totalClosed, setTotalClosed] = useState(0);
  const [activePage, setActivePage] = useState('campaigns');
  const [tetrisEnabled, setTetrisEnabled] = useState(true);
  const [showTetris, setShowTetris] = useState(false);
  const [notification, setNotification] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const callIntervalRef = useRef<number | null>(null);
  const callSecondsRef = useRef(0);

  const fetchLeads = useCallback(async (campaignId: string) => {
    setLoadingLeads(true);
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('status', { ascending: true })
      .order('updated_at', { ascending: true });
    
    if (data) {
      // Sort: new first, then no_answer/callback, then completed ones last
      const statusOrder: Record<string, number> = {
        new: 0, no_answer: 1, callback: 2, voicemail: 3,
        interested: 4, not_interested: 5, wrong_number: 6, sale: 7,
      };
      const sorted = [...data].sort((a, b) => 
        (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
      );
      setLeads(sorted as Lead[]);
      setCurrentLeadIdx(0);
    }
    setLoadingLeads(false);
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchLeads(selectedCampaignId);
    }
  }, [selectedCampaignId, fetchLeads]);

  const filteredLeads = leads.filter(l =>
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  );

  const currentLead = leads[currentLeadIdx] || null;

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2800);
  }, []);

  const selectLead = useCallback((idx: number) => {
    setCurrentLeadIdx(idx);
  }, []);

  const nextLead = useCallback(() => {
    setCurrentLeadIdx(prev => {
      // Find next lead that is 'new', 'no_answer', or 'callback'
      const callableStatuses = ['new', 'no_answer', 'callback', 'voicemail'];
      for (let i = 1; i <= leads.length; i++) {
        const idx = (prev + i) % leads.length;
        if (callableStatuses.includes(leads[idx]?.status)) return idx;
      }
      return (prev + 1) % leads.length;
    });
  }, [leads]);

  const startCall = useCallback(() => {
    if (callActive) return;
    setCallActive(true);
    setCallSeconds(0);
    callSecondsRef.current = 0;
    if (tetrisEnabled) setShowTetris(true);
    callIntervalRef.current = window.setInterval(() => {
      callSecondsRef.current += 1;
      setCallSeconds(callSecondsRef.current);
    }, 1000);
  }, [callActive, tetrisEnabled]);

  const endCall = useCallback(() => {
    if (!callActive) return;
    setCallActive(false);
    if (callIntervalRef.current) clearInterval(callIntervalRef.current);
    setTotalCalls(prev => prev + 1);
    setTotalCallSeconds(prev => prev + callSecondsRef.current);
    setShowTetris(false);
    const m = String(Math.floor(callSecondsRef.current / 60)).padStart(2, '0');
    const s = String(callSecondsRef.current % 60).padStart(2, '0');
    showNotif(`Opkald afsluttet — ${m}:${s}`);
    setCallSeconds(0);
  }, [callActive, showNotif]);

  const saveLead = useCallback(async (status: string, note?: string) => {
    if (!currentLead) return;
    
    const updates: Record<string, string> = { status };
    if (note !== undefined) updates.note = note;

    await supabase
      .from('leads')
      .update(updates)
      .eq('id', currentLead.id);

    // Also log the call
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('call_logs').insert({
        user_id: user.id,
        lead_id: currentLead.id,
        duration_seconds: callSecondsRef.current,
        result: status,
      });
    }

    if (status === 'sale') setTotalSales(prev => prev + 1);
    if (status === 'callback') setTotalRecalls(prev => prev + 1);
    setTotalClosed(prev => prev + 1);

    const statusLabels: Record<string, string> = {
      sale: 'Salg', callback: 'Genopkald', not_interested: 'Ikke interesseret',
      wrong_number: 'Forkert nummer', no_answer: 'Ingen svar', voicemail: 'Telefonsvarer',
      interested: 'Interesseret',
    };
    showNotif(`Gemt som "${statusLabels[status] || status}"`);

    // Update local state
    setLeads(prev => prev.map(l => l.id === currentLead.id ? { ...l, status, note: note ?? l.note } : l));
    setTimeout(() => nextLead(), 600);
  }, [currentLead, showNotif, nextLead]);

  const selectCampaign = useCallback((id: string, name: string) => {
    setSelectedCampaignId(id);
    setSelectedCampaignName(name);
    setActivePage('dialer');
  }, []);

  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatTotalTime = () => {
    const h = String(Math.floor(totalCallSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalCallSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalCallSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return {
    leads, currentLeadIdx, currentLead, filteredLeads, searchQuery, setSearchQuery,
    callActive, callSeconds, totalCalls, totalCallSeconds, totalSales, totalRecalls, totalClosed,
    activePage, setActivePage, tetrisEnabled, setTetrisEnabled, showTetris, setShowTetris,
    notification, showNotif,
    selectLead, nextLead, startCall, endCall, saveLead,
    formatTime, formatTotalTime,
    selectedCampaignId, selectedCampaignName, selectCampaign, loadingLeads,
    fetchLeads,
  };
}
