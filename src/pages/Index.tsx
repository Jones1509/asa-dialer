import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDialerState } from '@/hooks/useDialerState';
import { useTwilioDevice, IncomingCallInfo } from '@/hooks/useTwilioDevice';
import { AppSidebar } from '@/components/dialer/AppSidebar';
import { Topbar } from '@/components/dialer/Topbar';
import { TetrisOverlay } from '@/components/dialer/TetrisOverlay';
import { IncomingCallOverlay } from '@/components/dialer/IncomingCallOverlay';
import { DialerPage } from '@/components/dialer/pages/DialerPage';
import { IncomingPage } from '@/components/dialer/pages/IncomingPage';
import { CampaignsPage } from '@/components/dialer/pages/CampaignsPage';
import { ShopPage } from '@/components/dialer/pages/ShopPage';
import { ReportsPage } from '@/components/dialer/pages/ReportsPage';
import { SettingsPage } from '@/components/dialer/pages/SettingsPage';
import { TetrisPage } from '@/components/dialer/pages/TetrisPage';

const Index = () => {
  const state = useDialerState();
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
          />
        );
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
      case 'tetris': return <TetrisPage />;
      default: return null;
    }
  };

  const showTopbar = state.activePage === 'dialer' && state.leads.length > 0;

  return (
    <div className="flex min-h-screen h-screen overflow-hidden bg-background">
      <AppSidebar
        activePage={state.activePage}
        onNavigate={state.setActivePage}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onAdminNav={() => navigate('/admin')}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
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
        <div className="flex-1 flex overflow-hidden">
          {renderPage()}
        </div>
      </div>
      {state.currentLead && (
        <TetrisOverlay
          visible={state.showTetris}
          currentLead={state.currentLead}
          callSeconds={state.callSeconds}
          formatTime={state.formatTime}
          onEndCall={state.endCall}
          activeDialNumber={activeDialNumber}
        />
      )}
      {/* Incoming call overlay */}
      {incomingCall && !state.callActive && (
        <IncomingCallOverlay
          from={incomingCall.from}
          onAccept={handleAcceptIncoming}
          onReject={handleRejectIncoming}
        />
      )}
      <div className={`fixed bottom-6 right-6 bg-card border border-border/50 rounded-xl px-5 py-3.5 text-sm font-medium flex items-center gap-2.5 z-[200]
        transition-all duration-500 ease-out
        ${state.notification
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5.5L3.5 7.5L8.5 2.5" stroke="hsl(152 69% 41%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        {state.notification}
      </div>
    </div>
  );
};

export default Index;
