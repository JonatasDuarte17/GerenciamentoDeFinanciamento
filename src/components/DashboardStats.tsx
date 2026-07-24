import React from 'react';
import { GlobalDashboardStats } from '../types';
import { formatCurrency } from '../utils/financing';
import { DollarSign, Wallet, CalendarClock, AlertCircle, CheckCircle2, TrendingUp, PieChart } from 'lucide-react';

interface DashboardStatsProps {
  stats: GlobalDashboardStats;
  activeFilter: string;
  onSelectFilter: (filter: 'TODOS' | 'EM_DIA' | 'ATRASADO' | 'QUITADO') => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  stats,
  activeFilter,
  onSelectFilter,
}) => {
  return (
    <div className="space-y-4">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Saldo Devedor Restante */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Saldo Devedor Restante
            </span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-5 tracking-tight mb-1">
            {formatCurrency(stats.totalRemainingBalance)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>De um total contratado de</span>
            <span className="font-semibold text-slate-300">{formatCurrency(stats.totalContractedAmount)}</span>
          </div>
        </div>

        {/* Card 2: Comprometimento Mensal */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-sky-500/10 rounded-full blur-xl group-hover:bg-sky-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Parcelas Mensais Ativas
            </span>
            <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-sky-400 tracking-tight mb-1">
            {formatCurrency(stats.totalMonthlyCommitment)}
          </div>
          <div className="text-xs text-slate-400">
            Soma das parcelas ativas deste mês
          </div>
        </div>

        {/* Card 3: Total Pago Acumulado */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total Pago Até Agora
            </span>
            <div className="p-2.5 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 tracking-tight mb-1">
            {formatCurrency(stats.totalPaidAmount)}
          </div>
          <div className="text-xs text-slate-400">
            {stats.totalContractedAmount > 0
              ? `${((stats.totalPaidAmount / stats.totalContractedAmount) * 100).toFixed(1)}% do valor total quitado`
              : 'Sem parcelas registradas'}
          </div>
        </div>

        {/* Card 4: Situação de Atraso */}
        <div className={`bg-slate-900/90 border rounded-2xl p-5 shadow-lg relative overflow-hidden group transition-all ${
          stats.overdueFinancingsCount > 0
            ? 'border-rose-500/40 bg-rose-950/10'
            : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Valor em Atraso
            </span>
            <div className={`p-2.5 rounded-xl border ${
              stats.overdueFinancingsCount > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 ${
            stats.overdueFinancingsCount > 0 ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            {formatCurrency(stats.totalOverdueAmount)}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>
              {stats.overdueInstallmentsTotalCount === 0
                ? 'Nenhuma parcela pendente'
                : `${stats.overdueInstallmentsTotalCount} ${
                    stats.overdueInstallmentsTotalCount === 1 ? 'parcela vencida' : 'parcelas vencidas'
                  }`}
            </span>
            {stats.overdueFinancingsCount > 0 && (
              <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                Ação necessária
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Quick Status Filter Tabs */}
      <div className="bg-slate-900 border border-slate-800/90 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          
          <button
            onClick={() => onSelectFilter('TODOS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'TODOS'
                ? 'bg-slate-800 text-white shadow border border-slate-700'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>Todos</span>
            <span className="bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold">
              {stats.totalFinancingsCount}
            </span>
          </button>

          <button
            onClick={() => onSelectFilter('EM_DIA')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'EM_DIA'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Em Dia</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold border border-emerald-500/30">
              {stats.activeFinancingsCount - stats.overdueFinancingsCount}
            </span>
          </button>

          <button
            onClick={() => onSelectFilter('ATRASADO')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'ATRASADO'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300 hover:bg-slate-800/50'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Em Atraso</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${
              stats.overdueFinancingsCount > 0
                ? 'bg-rose-500/30 text-rose-200 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {stats.overdueFinancingsCount}
            </span>
          </button>

          <button
            onClick={() => onSelectFilter('QUITADO')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'QUITADO'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'text-slate-400 hover:text-sky-300 hover:bg-slate-800/50'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
            <span>Quitados</span>
            <span className="bg-sky-500/20 text-sky-300 text-[10px] px-1.5 py-0.5 rounded-md font-bold border border-sky-500/30">
              {stats.paidOffFinancingsCount}
            </span>
          </button>

        </div>

        <div className="text-xs text-slate-400 px-3 hidden md:block">
          Clique no financiamento para gerenciar parcelas ou renegociar prazo.
        </div>
      </div>
    </div>
  );
};
