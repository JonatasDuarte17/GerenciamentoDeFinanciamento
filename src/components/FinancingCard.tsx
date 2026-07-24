import React from 'react';
import { Financiamento } from '../types';
import { getFinancingSummary, formatCurrency, formatDateBR, getDaysDifference } from '../utils/financing';
import { Calendar, CheckCircle2, AlertTriangle, ArrowRight, Edit3, Trash2, CreditCard, ChevronRight, RefreshCw } from 'lucide-react';

interface FinancingCardProps {
  item: Financiamento;
  onOpenDetails: (item: Financiamento) => void;
  onOpenRenegotiate: (item: Financiamento) => void;
  onQuickPayNext: (item: Financiamento) => void;
  onDelete: (id: string, name: string) => void;
}

export const FinancingCard: React.FC<FinancingCardProps> = ({
  item,
  onOpenDetails,
  onOpenRenegotiate,
  onQuickPayNext,
  onDelete,
}) => {
  const summary = getFinancingSummary(item);

  // Status configuration
  const statusConfig = {
    EM_DIA: {
      label: 'EM DIA',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
      barColor: 'bg-emerald-500',
    },
    ATRASADO: {
      label: summary.daysOverdueMax > 0 ? `ATRASADO (${summary.daysOverdueMax}d)` : 'EM ATRASO',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse',
      icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />,
      barColor: 'bg-rose-500',
    },
    QUITADO: {
      label: 'QUITADO',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      icon: <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />,
      barColor: 'bg-sky-400',
    },
  }[summary.overallStatus];

  const hasRenegotiation = item.renegotiations && item.renegotiations.length > 0;

  return (
    <div className={`bg-slate-900 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200 hover:border-slate-700 hover:shadow-xl group ${
      summary.overallStatus === 'ATRASADO'
        ? 'border-rose-500/30 bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/10'
        : 'border-slate-800'
    }`}>
      
      {/* Top Section */}
      <div>
        {/* Header with Title & Category */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80">
                {item.category}
              </span>
              {hasRenegotiation && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1" title="Contrato renegociado anteriormente">
                  <RefreshCw className="h-2.5 w-2.5 text-amber-400" />
                  Renegociado
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
              {item.name}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {item.institution} {item.contractNumber ? `• Nº ${item.contractNumber}` : ''}
            </p>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border whitespace-nowrap ${statusConfig.badgeClass}`}>
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Progress Bar & Installments counter */}
        <div className="my-4 space-y-1.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Parcela Paga: <strong className="text-slate-100">{summary.paidInstallmentsCount}</strong> de <strong className="text-slate-100">{summary.totalInstallments}</strong>
            </span>
            <span className="font-bold text-slate-200">
              {summary.completionPercentage.toFixed(1)}%
            </span>
          </div>

          {/* Bar track */}
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${statusConfig.barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, summary.completionPercentage))}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-400 pt-0.5">
            <span>Restam {summary.remainingInstallmentsCount} parcelas</span>
            <span>{formatCurrency(summary.totalAmountPaid)} pago</span>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
              Valor da Parcela
            </span>
            <span className="text-sm font-bold text-slate-100">
              {formatCurrency(summary.currentMonthlyValue)}
            </span>
          </div>

          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
              Saldo Restante
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {formatCurrency(summary.remainingBalance)}
            </span>
          </div>
        </div>

        {/* Next Due Date info */}
        {summary.overallStatus !== 'QUITADO' && summary.nextDueDate && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center justify-between border mb-4 ${
            summary.overallStatus === 'ATRASADO'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-slate-800/40 text-slate-300 border-slate-800'
          }`}>
            <div className="flex items-center gap-2">
              <Calendar className={`h-4 w-4 ${summary.overallStatus === 'ATRASADO' ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>
                {summary.overallStatus === 'ATRASADO' ? 'Parcela Vencida:' : 'Próximo Vencimento:'}
              </span>
            </div>
            <strong className="font-semibold">
              {formatDateBR(summary.nextDueDate)}
              {summary.currentInstallmentNumber ? ` (${summary.currentInstallmentNumber}ª)` : ''}
            </strong>
          </div>
        )}

        {summary.overallStatus === 'QUITADO' && (
          <div className="p-2.5 rounded-xl text-xs bg-sky-500/10 text-sky-300 border border-sky-500/20 text-center font-medium mb-4">
            🎉 Financiamento 100% quitado! Parabéns!
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
        
        {/* Primary Row */}
        <div className="flex items-center gap-2">
          {summary.overallStatus !== 'QUITADO' && (
            <button
              onClick={() => onQuickPayNext(item)}
              className="flex-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Registrar pagamento da próxima parcela pendente"
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
              <span>Pagar Próxima ({summary.currentInstallmentNumber}ª)</span>
            </button>
          )}

          <button
            onClick={() => onOpenDetails(item)}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-medium py-2 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Ver Cronograma</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Secondary Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <button
            onClick={() => onOpenRenegotiate(item)}
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 text-[11px] transition-colors py-1 cursor-pointer"
            title="Ajustar prazo restante, valor de parcela e saldo devedor"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Renegociar / Refinanciar</span>
          </button>

          <button
            onClick={() => onDelete(item.id, item.name)}
            className="text-slate-500 hover:text-rose-400 transition-colors p-1 rounded cursor-pointer"
            title="Excluir este financiamento"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
};
