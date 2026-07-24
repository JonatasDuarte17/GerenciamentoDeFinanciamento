import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Financiamento, Parcela, InstallmentStatus } from '../types';
import { getFinancingSummary, formatCurrency, formatDateBR, getTodayISO } from '../utils/financing';
import { X, Calendar, CheckCircle2, AlertTriangle, Clock, RefreshCw, CreditCard, Filter, ArrowRight, Sparkles, Check, Undo2 } from 'lucide-react';

interface FinancingDetailsModalProps {
  item: Financiamento | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateFinancing: (updated: Financiamento) => void;
  onOpenRenegotiate: (item: Financiamento) => void;
}

export const FinancingDetailsModal: React.FC<FinancingDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateFinancing,
  onOpenRenegotiate,
}) => {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HISTORY' | 'SUMMARY'>('SCHEDULE');
  const [installmentFilter, setInstallmentFilter] = useState<'TODAS' | 'PENDENTES' | 'ATRASADAS' | 'PAGAS'>('TODAS');

  // State for paying an individual installment
  const [selectedParcelaForPayment, setSelectedParcelaForPayment] = useState<Parcela | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>(getTodayISO());
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const summary = getFinancingSummary(item);
  const todayISO = getTodayISO();

  // Filter installments
  const filteredInstallments = item.installments.filter((p) => {
    if (installmentFilter === 'PAGAS') return p.status === 'PAGA';
    if (installmentFilter === 'PENDENTES') return p.status === 'PENDENTE' || p.status === 'ATRASADA';
    if (installmentFilter === 'ATRASADAS') return p.status === 'ATRASADA' || (p.status !== 'PAGA' && p.dueDate < todayISO);
    return true;
  }).sort((a, b) => a.number - b.number);

  // Mark Parcela as Paid
  const handleConfirmPayParcela = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParcelaForPayment) return;

    const updatedInstallments = item.installments.map((p) => {
      if (p.id === selectedParcelaForPayment.id) {
        return {
          ...p,
          status: 'PAGA' as InstallmentStatus,
          paidDate: paymentDate,
          paidValue: paymentAmount > 0 ? paymentAmount : p.currentValue,
        };
      }
      return p;
    });

    const updatedItem: Financiamento = {
      ...item,
      updatedAt: new Date().toISOString(),
      installments: updatedInstallments,
    };

    onUpdateFinancing(updatedItem);

    // Check if fully paid after this update
    const newSummary = getFinancingSummary(updatedItem);
    if (newSummary.overallStatus === 'QUITADO') {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // confetti fallback
      }
    }

    setSelectedParcelaForPayment(null);
  };

  // Unpay / Undo payment for an installment
  const handleUndoPayment = (parcelaId: string) => {
    const updatedInstallments = item.installments.map((p) => {
      if (p.id === parcelaId) {
        const isOverdue = p.dueDate < todayISO;
        return {
          ...p,
          status: (isOverdue ? 'ATRASADA' : 'PENDENTE') as InstallmentStatus,
          paidDate: undefined,
          paidValue: undefined,
        };
      }
      return p;
    });

    const updatedItem: Financiamento = {
      ...item,
      updatedAt: new Date().toISOString(),
      installments: updatedInstallments,
    };

    onUpdateFinancing(updatedItem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto sm:my-6 flex flex-col max-h-[92dvh] sm:max-h-[88vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {item.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {item.institution}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              {item.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenRenegotiate(item)}
              className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Renegociar Prazo</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Progresso da Quitação</span>
            <div className="flex items-center gap-2 mt-0.5">
              <strong className="text-emerald-400 text-sm font-bold">
                {summary.paidInstallmentsCount} de {summary.totalInstallments}
              </strong>
              <span className="text-[11px] text-slate-400">
                ({summary.completionPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block">Saldo Devedor Restante</span>
            <strong className="text-slate-100 text-sm font-bold mt-0.5 block">
              {formatCurrency(summary.remainingBalance)}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block">Valor da Parcela Mensal</span>
            <strong className="text-slate-100 text-sm font-bold mt-0.5 block">
              {formatCurrency(summary.currentMonthlyValue)}
            </strong>
          </div>

          <div>
            <span className="text-slate-400 block">Situação Geral</span>
            <span className={`inline-block mt-0.5 font-bold px-2.5 py-0.5 rounded-full text-[11px] border ${
              summary.overallStatus === 'EM_DIA'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : summary.overallStatus === 'ATRASADO'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
            }`}>
              {summary.overallStatus === 'EM_DIA'
                ? 'EM DIA'
                : summary.overallStatus === 'ATRASADO'
                ? `EM ATRASO (${summary.daysOverdueMax}d)`
                : 'QUITADO'}
            </span>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'SCHEDULE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Cronograma de Parcelas ({item.installments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RefreshCw className="h-4 w-4" />
            <span>Histórico de Renegociações ({item.renegotiations?.length || 0})</span>
          </button>
        </div>

        {/* Tab Contents Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: CRONOGRAMA DE PARCELAS */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-4">
              
              {/* Filter Sub-bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">Filtrar:</span>
                </div>

                <div className="flex items-center gap-1">
                  {(['TODAS', 'PENDENTES', 'ATRASADAS', 'PAGAS'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setInstallmentFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        installmentFilter === f
                          ? 'bg-slate-800 text-white border border-slate-700'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'TODAS'
                        ? 'Todas'
                        : f === 'PENDENTES'
                        ? 'Pendentes'
                        : f === 'ATRASADAS'
                        ? 'Atrasadas'
                        : 'Pagas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Installments Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Nº</th>
                        <th className="py-3 px-4">Vencimento</th>
                        <th className="py-3 px-4">Valor Parcela</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Pagamento</th>
                        <th className="py-3 px-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {filteredInstallments.length > 0 ? (
                        filteredInstallments.map((p) => {
                          const isOverdue = p.status !== 'PAGA' && p.dueDate < todayISO;

                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-slate-800/40 transition-colors ${
                                isOverdue ? 'bg-rose-500/5' : ''
                              }`}
                            >
                              <td className="py-3 px-4 font-bold text-slate-200">
                                {p.number}ª
                              </td>

                              <td className="py-3 px-4 font-medium text-slate-200">
                                {formatDateBR(p.dueDate)}
                              </td>

                              <td className="py-3 px-4 font-semibold text-slate-100">
                                {formatCurrency(p.currentValue)}
                              </td>

                              <td className="py-3 px-4">
                                {p.status === 'PAGA' ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    <Check className="h-3 w-3" />
                                    PAGA
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-md animate-pulse">
                                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                                    ATRASADA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                                    <Clock className="h-3 w-3 text-slate-400" />
                                    PENDENTE
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-slate-400">
                                {p.status === 'PAGA' ? (
                                  <div>
                                    <span className="text-slate-200 font-medium">
                                      {formatCurrency(p.paidValue ?? p.currentValue)}
                                    </span>
                                    <span className="block text-[10px] text-slate-400">
                                      em {formatDateBR(p.paidDate || p.dueDate)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                {p.status === 'PAGA' ? (
                                  <button
                                    onClick={() => handleUndoPayment(p.id)}
                                    className="text-slate-400 hover:text-rose-400 font-semibold text-[11px] hover:underline transition-colors flex items-center gap-1 justify-end ml-auto cursor-pointer"
                                    title="Desfazer e voltar para pendente"
                                  >
                                    <Undo2 className="h-3 w-3" />
                                    <span>Desfazer</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedParcelaForPayment(p);
                                      setPaymentDate(getTodayISO());
                                      setPaymentAmount(p.currentValue);
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 justify-end ml-auto cursor-pointer"
                                  >
                                    <CreditCard className="h-3 w-3" />
                                    <span>Dar Baixa</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            Nenhuma parcela encontrada para este filtro.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTÓRICO DE RENEGOCIAÇÕES */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              {item.renegotiations && item.renegotiations.length > 0 ? (
                <div className="space-y-3">
                  {item.renegotiations.map((r, idx) => (
                    <div
                      key={r.id || idx}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-amber-500/20">
                            Renegociação #{item.renegotiations.length - idx}
                          </span>
                          <span className="text-xs text-slate-300 font-semibold">
                            {formatDateBR(r.date)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 italic">
                          "{r.reason}"
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 block">Prazo Restante</span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-200">
                            <span className="line-through text-slate-400">
                              {r.previousRemainingInstallments} mes
                            </span>
                            <ArrowRight className="h-3 w-3 text-amber-400" />
                            <strong className="text-amber-300 font-bold">
                              {r.newRemainingInstallments} meses
                            </strong>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block">Valor da Parcela</span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-200">
                            <span className="line-through text-slate-400">
                              {formatCurrency(r.previousInstallmentValue)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-amber-400" />
                            <strong className="text-amber-300 font-bold">
                              {formatCurrency(r.newInstallmentValue)}
                            </strong>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block">Saldo Devedor Ajustado</span>
                          <strong className="text-emerald-400 font-bold text-sm block mt-0.5">
                            {formatCurrency(r.newRemainingBalance)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
                  <RefreshCw className="h-8 w-8 text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-400">
                    Nenhuma renegociação foi efetuada neste financiamento até o momento.
                  </p>
                  <button
                    onClick={() => onOpenRenegotiate(item)}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold hover:underline cursor-pointer"
                  >
                    <span>Deseja renegociar prazo e parcelas? Clique aqui.</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 px-6 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Contrato criado em {formatDateBR(item.createdAt.slice(0, 10))}
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* SUB-MODAL / POPUP: REGISTRAR PAGAMENTO DA PARCELA */}
      {selectedParcelaForPayment && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                <span>Baixa na Parcela {selectedParcelaForPayment.number}ª</span>
              </h3>
              <button
                onClick={() => setSelectedParcelaForPayment(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayParcela} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Data Efetiva do Pagamento *
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Valor Pago (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400 block">
                  Valor original da parcela: {formatCurrency(selectedParcelaForPayment.currentValue)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedParcelaForPayment(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Confirmar Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
