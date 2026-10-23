import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDialerState } from '@/hooks/useDialerState';
import { useTwilioDevice, IncomingCallInfo } from '@/hooks/useTwilioDevice';
import { useTetrisMusic } from '@/hooks/useTetrisMusic';
import { AppShell, ShellNavItem } from '@/components/shell/AppShell';
import { Inbox, Phone, PhoneIncoming, LayoutGrid, ShoppingBag, BarChart3, Settings, LogOut, Shield, Gamepad2, Check } from 'lucide-react';
import { Topbar } from '@/components/dialer/Topbar';
import { IncomingCallOverlay } from '@/components/dialer/IncomingCallOverlay';
import { DialerPage } from '@/components/dialer/pages/DialerPage';
import { IncomingPage } from '@/components/dialer/pages/IncomingPage';
import { IndbakkePage } from '@/components/dialer/pages/IndbakkePage';
import { CampaignsPage } from '@/components/dialer/pages/CampaignsPage';
import { ShopPage } from '@/components/dialer/pages/ShopPage';
import { ReportsPage } from '@/components/dialer/pages/ReportsPage';
import { SettingsPage } from '@/components/dialer/pages/SettingsPage';
import { TetrisPage } from '@/components/dialer/pages/TetrisPage';

const Index = () => {
  const state = useDialerState();
  const music = useTetrisMusic();
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [activeDialNumber, setActiveDialNumber] = useState<string | null>(null);

  const handleIncomingCall = useCallback((info: IncomingCallInfo) => {
    setIncomingCall(info);
  }, []);

  const twilio = useTwilioDevice({
    onCallDisconnected: () => {
      if (state.callActive) {
        state.endCall();
      }
      setIncomingCall(null);
    },
    onIncomingCall: handleIncomingCall,
  });
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleAcceptIncoming = () => {
    twilio.acceptCall();
    setActiveDialNumber(incomingCall?.from || null);
    state.startCall();
    setIncomingCall(null);
  };

  const handleRejectIncoming = () => {
    twilio.rejectCall();
    setIncomingCall(null);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const renderPage = () => {
    switch (state.activePage) {
      case 'dialer':
        return (
          <DialerPage
            leads={state.leads}
            filteredLeads={state.filteredLeads}
            currentLeadIdx={state.currentLeadIdx}
            currentLead={state.currentLead}
            searchQuery={state.searchQuery}
            campaignName={state.selectedCampaignName}
            onSearch={state.setSearchQuery}
            onSelectLead={state.selectLead}
            onSaveLead={state.saveLead}
            onNextLead={state.nextLead}
            loadingLeads={state.loadingLeads}
            callActive={state.callActive}
            tetrisEnabled={state.tetrisEnabled}
            onGoToCampaigns={() => state.setActivePage('campaigns')}
          />
        );
      case 'indbakke': return <IndbakkePage />;
      case 'incoming': return <IncomingPage />;
      case 'campaigns':
        return (
          <CampaignsPage
            showNotif={state.showNotif}
            onSelectCampaign={state.selectCampaign}
          />
        );
      case 'shop': return <ShopPage />;
      case 'reports':
        return (
          <ReportsPage
            totalCalls={state.totalCalls}
            totalSales={state.totalSales}
            totalRecalls={state.totalRecalls}
            totalClosed={state.totalClosed}
            formatTotalTime={state.formatTotalTime}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            tetrisEnabled={state.tetrisEnabled}
            onToggleTetris={() => state.setTetrisEnabled(!state.tetrisEnabled)}
            showNotif={state.showNotif}
          />
        );
      case 'tetris': return <TetrisPage music={music} />;
      default: return null;
    }
  };

  const showTopbar = state.activePage === 'dialer' && state.leads.length > 0;

  const navItems: ShellNavItem[] = [
    { id: 'indbakke', icon: Inbox, label: 'Indbakke' },
    { id: 'dialer', icon: Phone, label: 'Dialer' },
    { id: 'incoming', icon: PhoneIncoming, label: 'Indgående' },
    { id: 'campaigns', icon: LayoutGrid, label: 'Kampagner' },
    { id: 'shop', icon: ShoppingBag, label: 'Produktshop' },
    { id: 'reports', icon: BarChart3, label: 'Rapporter' },
    { id: 'tetris', icon: Gamepad2, label: 'Tetris' },
  ];
  const footerItems: ShellNavItem[] = [
    ...(isAdmin ? [{ id: 'admin', icon: Shield, label: 'Admin panel', onClick: () => navigate('/admin') }] : []),
    { id: 'settings', icon: Settings, label: 'Indstillinger' },
    { id: 'logout', icon: LogOut, label: 'Log ud', onClick: handleLogout, tone: 'danger' as const },
  ];
  const pageTitle = [...navItems, ...footerItems].find(i => i.id === state.activePage)?.label ?? 'Dialer';

  return (
    <AppShell items={navItems} footerItems={footerItems} active={state.activePage} onSelect={state.setActivePage} title={pageTitle}>
        {showTopbar && (
          <Topbar
            currentLead={state.currentLead}
            callActive={state.callActive}
            callSeconds={state.callSeconds}
            formatTime={state.formatTime}
            onStartCall={state.startCall}
            onEndCall={state.endCall}
            onActivity={() => state.showNotif('Aktivitet gemt')}
            twilioStatus={twilio.status}
            twilioError={twilio.error}
            onTwilioCall={twilio.makeCall}
            onTwilioHangUp={twilio.hangUp}
            canMakeVoipCall={twilio.canMakeVoipCall}
            onActiveDialNumberChange={setActiveDialNumber}
          />
        )}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {renderPage()}
        </div>
      {/* Tetris is now inline in StamdataPanel — no overlay needed */}
      {/* Incoming call overlay */}
      {incomingCall && !state.callActive && (
        <IncomingCallOverlay
          from={incomingCall.from}
          onAccept={handleAcceptIncoming}
          onReject={handleRejectIncoming}
        />
      )}
      <div role="status" aria-live="polite" className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 bg-card border border-border rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-3 z-[200] shadow-lg
        transition-all duration-150 ease-out
        ${state.notification
          ? 'translate-y-0 opacity-100'
          : 'translate-y-4 opacity-0 pointer-events-none'
        }`}>
        <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center shrink-0">
          <Check size={16} strokeWidth={2.5} className="text-success" aria-hidden="true" />
        </div>
        {state.notification}
      </div>
    </AppShell>
  );
};

export default Index;
