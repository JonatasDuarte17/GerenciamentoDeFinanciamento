import React, { useState, useEffect } from 'react';
import { Financiamento } from './types';
import { calculateGlobalStats, getFinancingSummary, getTodayISO, formatCurrency } from './utils/financing';
import { loadFinancingsFromStorage, saveFinancingsToStorage, resetToSampleData, exportDataAsJSON, importDataFromJSON } from './utils/storage';
import { Header } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { FinancingList } from './components/FinancingList';
import { NewFinancingModal } from './components/NewFinancingModal';
import { RenegotiationModal } from './components/RenegotiationModal';
import { FinancingDetailsModal } from './components/FinancingDetailsModal';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { BarChart2, ListFilter, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [financings, setFinancings] = useState<Financiamento[]>([]);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'EM_DIA' | 'ATRASADO' | 'QUITADO'>('TODOS');
  const [showCharts, setShowCharts] = useState<boolean>(true);

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedForDetails, setSelectedForDetails] = useState<Financiamento | null>(null);
  const [selectedForRenegotiation, setSelectedForRenegotiation] = useState<Financiamento | null>(null);

  // Notification Toast state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // Initial load
  useEffect(() => {
    const loaded = loadFinancingsFromStorage();
    setFinancings(loaded);
  }, []);

  // Save to storage on update
  const updateAndSaveFinancings = (newList: Financiamento[]) => {
    setFinancings(newList);
    saveFinancingsToStorage(newList);
  };

  // Add new financing
  const handleCreateFinancing = (newItem: Financiamento) => {
    const updated = [newItem, ...financings];
    updateAndSaveFinancings(updated);
    showToast(`Financiamento "${newItem.name}" cadastrado com sucesso!`);
  };

  // Update existing financing
  const handleUpdateFinancing = (updatedItem: Financiamento) => {
    const updated = financings.map((f) => (f.id === updatedItem.id ? updatedItem : f));
    updateAndSaveFinancings(updated);

    // Keep active modal selected item synchronized
    if (selectedForDetails?.id === updatedItem.id) {
      setSelectedForDetails(updatedItem);
    }
    if (selectedForRenegotiation?.id === updatedItem.id) {
      setSelectedForRenegotiation(updatedItem);
    }

    showToast(`Contrato "${updatedItem.name}" atualizado!`);
  };

  // Renegotiate / Refinance remaining term
  const handleSaveRenegotiation = (renegotiatedItem: Financiamento) => {
    const updated = financings.map((f) => (f.id === renegotiatedItem.id ? renegotiatedItem : f));
    updateAndSaveFinancings(updated);

    if (selectedForDetails?.id === renegotiatedItem.id) {
      setSelectedForDetails(renegotiatedItem);
    }

    showToast(`Renegociação de "${renegotiatedItem.name}" aplicada com sucesso!`);
  };

  // One-click quick pay next pending installment
  const handleQuickPayNext = (item: Financiamento) => {
    const todayISO = getTodayISO();
    const sorted = [...item.installments].sort((a, b) => a.number - b.number);
    const nextPending = sorted.find((p) => p.status !== 'PAGA');

    if (!nextPending) {
      showToast('Todas as parcelas deste financiamento já foram pagas!', 'info');
      return;
    }

    const updatedInstallments = item.installments.map((p) => {
      if (p.id === nextPending.id) {
        return {
          ...p,
          status: 'PAGA' as const,
          paidDate: todayISO,
          paidValue: p.currentValue,
        };
      }
      return p;
    });

    const updatedItem: Financiamento = {
      ...item,
      updatedAt: new Date().toISOString(),
      installments: updatedInstallments,
    };

    handleUpdateFinancing(updatedItem);
    showToast(`Parcela ${nextPending.number}ª (${formatCurrency(nextPending.currentValue)}) dada como paga!`);
  };

  // Delete financing
  const handleDeleteFinancing = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o financiamento "${name}"? Esta ação não pode ser desfeita.`)) {
      const updated = financings.filter((f) => f.id !== id);
      updateAndSaveFinancings(updated);
      showToast(`Financiamento "${name}" removido.`);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    exportDataAsJSON(financings);
    showToast('Backup exportado com sucesso!');
  };

  // Import JSON
  const handleImportJSON = (jsonStr: string) => {
    const imported = importDataFromJSON(jsonStr);
    if (imported) {
      updateAndSaveFinancings(imported);
      showToast('Dados importados com sucesso!');
    } else {
      showToast('Erro ao importar arquivo JSON. Formato inválido.', 'error');
    }
  };

  // Reset Sample Data
  const handleResetSample = () => {
    if (window.confirm('Deseja carregar os dados demonstrativos de exemplo?')) {
      const sample = resetToSampleData();
      setFinancings(sample);
      showToast('Dados demonstrativos carregados!');
    }
  };

  // Clear All Data
  const handleClearAll = () => {
    if (window.confirm('Tem certeza de que deseja remover todos os financiamentos? A aplicação ficará em branco.')) {
      updateAndSaveFinancings([]);
      showToast('Todos os financiamentos foram removidos. O aplicativo está em branco.', 'info');
    }
  };

  // Calculate global summary stats
  const globalStats = calculateGlobalStats(financings);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-16 selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 backdrop-blur-md ${
            toastMsg.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : toastMsg.type === 'info'
              ? 'bg-sky-950/90 text-sky-200 border-sky-500/40'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
          }`}>
            {toastMsg.type === 'error' ? (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            )}
            <span>{toastMsg.text}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        onOpenNewModal={() => setIsNewModalOpen(true)}
        onExport={handleExportJSON}
        onImportJSON={handleImportJSON}
        onResetSample={handleResetSample}
        onClearAll={handleClearAll}
        overdueCount={globalStats.overdueFinancingsCount}
        hasItems={financings.length > 0}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* KPI Dashboard Section */}
        <DashboardStats
          stats={globalStats}
          activeFilter={statusFilter}
          onSelectFilter={(f) => setStatusFilter(f)}
        />

        {/* Section Header with Charts Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">
              Meus Financiamentos ({financings.length})
            </h2>
          </div>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{showCharts ? 'Ocultar Gráficos' : 'Exibir Gráficos'}</span>
          </button>
        </div>

        {/* Analytics Charts Section */}
        {showCharts && <AnalyticsCharts financings={financings} />}

        {/* Financing Cards List */}
        <FinancingList
          financings={financings}
          statusFilter={statusFilter}
          onOpenNewModal={() => setIsNewModalOpen(true)}
          onOpenDetails={(item) => setSelectedForDetails(item)}
          onOpenRenegotiate={(item) => setSelectedForRenegotiation(item)}
          onQuickPayNext={handleQuickPayNext}
          onDelete={handleDeleteFinancing}
        />

      </main>

      {/* MODALS */}
      {/* 1. Modal Novo Financiamento */}
      <NewFinancingModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleCreateFinancing}
      />

      {/* 2. Modal Renegociação / Refinanciamento */}
      <RenegotiationModal
        item={selectedForRenegotiation}
        isOpen={!!selectedForRenegotiation}
        onClose={() => setSelectedForRenegotiation(null)}
        onSaveRenegotiation={handleSaveRenegotiation}
      />

      {/* 3. Modal Detalhes e Cronograma de Parcelas */}
      <FinancingDetailsModal
        item={selectedForDetails}
        isOpen={!!selectedForDetails}
        onClose={() => setSelectedForDetails(null)}
        onUpdateFinancing={handleUpdateFinancing}
        onOpenRenegotiate={(item) => {
          setSelectedForDetails(null);
          setSelectedForRenegotiation(item);
        }}
      />

    </div>
  );
}
