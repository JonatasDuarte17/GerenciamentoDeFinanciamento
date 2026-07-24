import React, { useState, useEffect } from 'react';
import { Financiamento } from '../types';
import { getFinancingSummary, formatCurrency, renegotiateFinancing } from '../utils/financing';
import { X, RefreshCw, Calculator, ArrowRight, CheckCircle2, ShieldAlert, Sparkles, History } from 'lucide-react';

interface RenegotiationModalProps {
  item: Financiamento | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveRenegotiation: (updatedFinancing: Financiamento) => void;
}

export const RenegotiationModal: React.FC<RenegotiationModalProps> = ({
  item,
  isOpen,
  onClose,
  onSaveRenegotiation,
}) => {
  if (!isOpen || !item) return null;

  const summary = getFinancingSummary(item);

  // Unpaid installments count
  const unpaidCount = summary.remainingInstallmentsCount;
  const currentInstallmentVal = item.currentInstallmentValue;
  const currentRemainingBalance = summary.remainingBalance;

  // Form State initialized from current remaining balance
  const [newRemainingBalance, setNewRemainingBalance] = useState<number>(currentRemainingBalance);
  const [newRemainingInstallments, setNewRemainingInstallments] = useState<number>(unpaidCount);
  const [newInstallmentValue, setNewInstallmentValue] = useState<number>(currentInstallmentVal);
  const [reason, setReason] = useState<string>('Refinanciamento e adequação do prazo de pagamento');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Sync state if item changes
  useEffect(() => {
    if (item) {
      const sum = getFinancingSummary(item);
      setNewRemainingBalance(sum.remainingBalance);
      setNewRemainingInstallments(sum.remainingInstallmentsCount);
      setNewInstallmentValue(item.currentInstallmentValue);
      setReason('Refinanciamento de taxa e ajuste do prazo restante');
      setErrorMsg('');
    }
  }, [item]);

  // Quick auto-calculation of simple division
  const handleAutoCalculateInstallment = () => {
    if (newRemainingInstallments > 0 && newRemainingBalance > 0) {
      const calculatedVal = Math.round((newRemainingBalance / newRemainingInstallments) * 100) / 100;
      setNewInstallmentValue(calculatedVal);
    }
  };

  const handleApplyRenegotiation = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newRemainingInstallments <= 0) {
      setErrorMsg('A nova quantidade de parcelas restantes deve ser maior que zero.');
      return;
    }

    if (newInstallmentValue <= 0) {
      setErrorMsg('O novo valor da parcela deve ser maior que zero.');
      return;
    }

    if (newRemainingBalance <= 0) {
      setErrorMsg('O novo saldo devedor restante deve ser maior que zero.');
      return;
    }

    const updated = renegotiateFinancing(
      item,
      newRemainingInstallments,
      newInstallmentValue,
      newRemainingBalance,
      reason
    );

    onSaveRenegotiation(updated);
    onClose();
  };

  const valDiff = newInstallmentValue - currentInstallmentVal;
  const termDiff = newRemainingInstallments - unpaidCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl my-auto sm:my-8 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="shrink-0 bg-slate-900 border-b border-slate-800 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Renegociar / Refinanciar Prazo Restante
              </h2>
              <p className="text-xs text-slate-400">
                Ajuste o saldo devedor, a quantidade de parcelas e o novo valor mensal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form with flex column layout */}
        <form onSubmit={handleApplyRenegotiation} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain">
            
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Current Contract Status Summary Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-bold text-slate-200">
                  {item.name} ({item.institution})
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {summary.paidInstallmentsCount} parcelas pagas mantidas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Saldo Devedor Atual</span>
                  <strong className="text-slate-100 font-bold text-sm">
                    {formatCurrency(currentRemainingBalance)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Parcelas Restantes Atuais</span>
                  <strong className="text-slate-100 font-bold text-sm">
                    {unpaidCount} parcelas
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Valor da Parcela Atual</span>
                  <strong className="text-slate-100 font-bold text-sm">
                    {formatCurrency(currentInstallmentVal)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Form Inputs for Renegotiation */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Novas Condições do Financiamento Restante
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Novo Saldo Devedor Restante */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Novo Saldo Devedor Restante (R$) *</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Ajuste se houver desconto, despesa ou amortização
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newRemainingBalance}
                    onChange={(e) => setNewRemainingBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Novo Prazo Restante (Quantidade de Parcelas) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Novas Parcelas Restantes *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={newRemainingInstallments}
                    onChange={(e) => setNewRemainingInstallments(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Ex: estender de {unpaidCount} para {unpaidCount + 12} meses
                  </span>
                </div>

                {/* Novo Valor da Parcela */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Novo Valor da Parcela (R$) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoCalculateInstallment}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Calculator className="h-3 w-3" />
                      <span>Dividir saldo/parcelas</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={newInstallmentValue}
                    onChange={(e) => setNewInstallmentValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                {/* Motivo do Ajuste */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Motivo da Renegociação / Ajuste *
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex: Prorrogação de prazo, Refinanciamento de juros pelo banco, Amortização parcial"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

              </div>
            </div>

            {/* Impact Comparison Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-between">
                <span>Comparativo de Impacto do Ajuste</span>
                <span className="text-[10px] text-amber-400/80">O histórico anterior será preservado</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Valor da Parcela</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-400 line-through text-xs">
                      {formatCurrency(currentInstallmentVal)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="font-bold text-amber-300 text-sm">
                      {formatCurrency(newInstallmentValue)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold block mt-1 ${valDiff < 0 ? 'text-emerald-400' : valDiff > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {valDiff < 0 ? `Economia de ${formatCurrency(Math.abs(valDiff))}/mês` : valDiff > 0 ? `Aumento de ${formatCurrency(valDiff)}/mês` : 'Sem alteração no valor'}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Prazo Restante</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-slate-400 line-through text-xs">
                      {unpaidCount}m
                    </span>
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span className="font-bold text-amber-300 text-sm">
                      {newRemainingInstallments} meses
                    </span>
                  </div>
                  <span className={`text-[10px] font-semibold block mt-1 ${termDiff > 0 ? 'text-sky-300' : termDiff < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {termDiff > 0 ? `+${termDiff} meses adicionados` : termDiff < 0 ? `${termDiff} meses reduzidos` : 'Mesmo prazo restante'}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Novo Total Restante</span>
                  <div className="font-bold text-emerald-400 text-sm mt-0.5">
                    {formatCurrency(newRemainingInstallments * newInstallmentValue)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ({newRemainingInstallments}x de {formatCurrency(newInstallmentValue)})
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="shrink-0 bg-slate-900 border-t border-slate-800 p-4 sm:p-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Confirmar Renegociação</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
