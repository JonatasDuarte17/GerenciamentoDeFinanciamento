import React, { useState, useMemo } from 'react';
import { Financiamento, FinancingCategory, SortOption } from '../types';
import { FinancingCard } from './FinancingCard';
import { getFinancingSummary } from '../utils/financing';
import { Search, Filter, ArrowUpDown, PlusCircle, Inbox } from 'lucide-react';

interface FinancingListProps {
  financings: Financiamento[];
  statusFilter: string;
  onOpenNewModal: () => void;
  onOpenDetails: (item: Financiamento) => void;
  onOpenRenegotiate: (item: Financiamento) => void;
  onQuickPayNext: (item: Financiamento) => void;
  onDelete: (id: string, name: string) => void;
}

export const FinancingList: React.FC<FinancingListProps> = ({
  financings,
  statusFilter,
  onOpenNewModal,
  onOpenDetails,
  onOpenRenegotiate,
  onQuickPayNext,
  onDelete,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS');
  const [sortBy, setSortBy] = useState<SortOption>('PROXIMO_VENCIMENTO');

  // Filter & Sort Logic
  const filteredAndSorted = useMemo(() => {
    return financings
      .filter((item) => {
        const summary = getFinancingSummary(item);
        
        // Status filter
        if (statusFilter !== 'TODOS' && summary.overallStatus !== statusFilter) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'TODAS' && item.category !== selectedCategory) {
          return false;
        }

        // Search Query filter (matches name or institution)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchInst = item.institution.toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          if (!matchName && !matchInst && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const sumA = getFinancingSummary(a);
        const sumB = getFinancingSummary(b);

        if (sortBy === 'PROXIMO_VENCIMENTO') {
          // Overdue first, then upcoming
          if (sumA.overallStatus === 'ATRASADO' && sumB.overallStatus !== 'ATRASADO') return -1;
          if (sumB.overallStatus === 'ATRASADO' && sumA.overallStatus !== 'ATRASADO') return 1;
          
          if (!sumA.nextDueDate) return 1;
          if (!sumB.nextDueDate) return -1;
          return sumA.nextDueDate.localeCompare(sumB.nextDueDate);
        }

        if (sortBy === 'MAIOR_SALDO') {
          return sumB.remainingBalance - sumA.remainingBalance;
        }

        if (sortBy === 'NOME') {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === 'MAIS_RECENTE') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        return 0;
      });
  }, [financings, statusFilter, selectedCategory, searchQuery, sortBy]);

  const categoriesList: FinancingCategory[] = [
    'Imóvel',
    'Veículo',
    'Empréstimo Pessoal',
    'Estudantil',
    'Empresarial',
    'Cartão / Crediário',
    'Outro',
  ];

  return (
    <div className="space-y-6">
      
      {/* Controls Bar: Search, Category, Sorting */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, banco..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Category & Sorting Selects */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 w-1/2 md:w-auto">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="TODAS" className="bg-slate-900">Todas Categorias</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 w-1/2 md:w-auto">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer w-full"
            >
              <option value="PROXIMO_VENCIMENTO" className="bg-slate-900">Próximo Vencimento</option>
              <option value="MAIOR_SALDO" className="bg-slate-900">Maior Saldo Devedor</option>
              <option value="NOME" className="bg-slate-900">Nome (A-Z)</option>
              <option value="MAIS_RECENTE" className="bg-slate-900">Mais Recentes</option>
            </select>
          </div>

        </div>

      </div>

      {/* Grid of Cards */}
      {filteredAndSorted.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSorted.map((item) => (
            <FinancingCard
              key={item.id}
              item={item}
              onOpenDetails={onOpenDetails}
              onOpenRenegotiate={onOpenRenegotiate}
              onQuickPayNext={onQuickPayNext}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400">
            <Inbox className="h-8 w-8 stroke-[1.5]" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-slate-200">
              Nenhum financiamento encontrado
            </h3>
            <p className="text-xs text-slate-400">
              {searchQuery || selectedCategory !== 'TODAS' || statusFilter !== 'TODOS'
                ? 'Tente ajustar seus filtros de busca ou selecionar outra categoria.'
                : 'Cadastre seu primeiro financiamento para começar a acompanhar parcelas, vencimentos e renegociações.'}
            </p>
          </div>
          {(searchQuery || selectedCategory !== 'TODAS' || statusFilter !== 'TODOS') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('TODAS');
              }}
              className="text-xs text-emerald-400 hover:underline font-semibold cursor-pointer"
            >
              Limpar Filtros de Pesquisa
            </button>
          ) : (
            <button
              onClick={onOpenNewModal}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Cadastrar Novo Financiamento</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
};
