import React from 'react';
import { useDialerState } from '@/hooks/useDialerState';
import { AppSidebar } from '@/components/dialer/AppSidebar';
import { Topbar } from '@/components/dialer/Topbar';
import { TetrisOverlay } from '@/components/dialer/TetrisOverlay';
import { DialerPage } from '@/components/dialer/pages/DialerPage';
import { IncomingPage } from '@/components/dialer/pages/IncomingPage';
import { CampaignsPage } from '@/components/dialer/pages/CampaignsPage';
import { ShopPage } from '@/components/dialer/pages/ShopPage';
import { ReportsPage } from '@/components/dialer/pages/ReportsPage';
import { SettingsPage } from '@/components/dialer/pages/SettingsPage';

const Index = () => {
  const state = useDialerState();

  const renderPage = () => {
    switch (state.activePage) {
      case 'dialer':
        return (
          <DialerPage
            filteredLeads={state.filteredLeads}
            currentLeadIdx={state.currentLeadIdx}
            currentLead={state.currentLead}
            searchQuery={state.searchQuery}
            onSearch={state.setSearchQuery}
            onSelectLead={state.selectLead}
            onSaveLead={state.saveLead}
            onNextLead={state.nextLead}
            onVoicemail={() => state.showNotif('📵 Markeret som telefonsvarer')}
          />
        );
      case 'incoming': return <IncomingPage />;
      case 'campaigns': return <CampaignsPage onNavigate={state.setActivePage} showNotif={state.showNotif} />;
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
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen h-screen overflow-hidden bg-background">
      <AppSidebar
        activePage={state.activePage}
        onNavigate={state.setActivePage}
        onLogout={() => state.showNotif('👋 Logger ud...')}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          currentLead={state.currentLead}
          callActive={state.callActive}
          callSeconds={state.callSeconds}
          formatTime={state.formatTime}
          onStartCall={state.startCall}
          onEndCall={state.endCall}
          onActivity={() => state.showNotif('✅ Aktivitet gemt!')}
        />
        <div className="flex-1 flex overflow-hidden">
          {renderPage()}
        </div>
      </div>
      <TetrisOverlay
        visible={state.showTetris}
        currentLead={state.currentLead}
        callSeconds={state.callSeconds}
        formatTime={state.formatTime}
        onEndCall={state.endCall}
      />
      {/* Notification */}
      <div className={`fixed bottom-6 right-6 card-surface border-primary/30 rounded-lg px-5 py-3.5 text-sm flex items-center gap-2.5 z-[200] transition-all duration-300 ${
        state.notification ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}>
        {state.notification}
      </div>
    </div>
  );
};

export default Index;
