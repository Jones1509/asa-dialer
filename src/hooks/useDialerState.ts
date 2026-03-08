import { useState, useCallback, useRef } from 'react';
import { leadsData, Lead } from '@/types/leads';

export function useDialerState() {
  const [currentLeadIdx, setCurrentLeadIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalCallSeconds, setTotalCallSeconds] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRecalls, setTotalRecalls] = useState(0);
  const [totalClosed, setTotalClosed] = useState(0);
  const [activePage, setActivePage] = useState('dialer');
  const [tetrisEnabled, setTetrisEnabled] = useState(true);
  const [showTetris, setShowTetris] = useState(false);
  const [notification, setNotification] = useState('');
  const callIntervalRef = useRef<number | null>(null);
  const callSecondsRef = useRef(0);

  const filteredLeads = leadsData.filter(l =>
    l.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.phone.includes(searchQuery)
  );

  const currentLead = leadsData[currentLeadIdx];

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 2800);
  }, []);

  const selectLead = useCallback((idx: number) => {
    setCurrentLeadIdx(idx);
  }, []);

  const nextLead = useCallback(() => {
    setCurrentLeadIdx(prev => (prev + 1) % leadsData.length);
  }, []);

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
    showNotif(`📵 Opkald afsluttet — ${m}:${s}`);
    setCallSeconds(0);
  }, [callActive, showNotif]);

  const saveLead = useCallback((status: string) => {
    if (status === 'Salg') setTotalSales(prev => prev + 1);
    if (status === 'Genopkald') setTotalRecalls(prev => prev + 1);
    setTotalClosed(prev => prev + 1);
    showNotif(`💾 Emne gemt som "${status}"`);
    setTimeout(() => nextLead(), 600);
  }, [showNotif, nextLead]);

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
    currentLeadIdx, currentLead, filteredLeads, searchQuery, setSearchQuery,
    callActive, callSeconds, totalCalls, totalCallSeconds, totalSales, totalRecalls, totalClosed,
    activePage, setActivePage, tetrisEnabled, setTetrisEnabled, showTetris, setShowTetris,
    notification, showNotif,
    selectLead, nextLead, startCall, endCall, saveLead,
    formatTime, formatTotalTime,
  };
}
