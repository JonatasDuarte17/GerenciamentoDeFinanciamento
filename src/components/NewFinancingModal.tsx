import React, { useState } from 'react';
import { Financiamento, FinancingCategory } from '../types';
import { generateInstallmentSchedule, getTodayISO, formatCurrency, formatDateBR } from '../utils/financing';
import { X, Plus, Calculator, Calendar, Landmark, Tag, Percent, FileText } from 'lucide-react';

interface NewFinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newFinancing: Financiamento) => void;
}

export const NewFinancingModal: React.FC<NewFinancingModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const todayISO = getTodayISO();

  // Form State
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState<FinancingCategory>('Veículo');
  const [totalInstallments, setTotalInstallments] = useState<number>(36);
  const [installmentValue, setInstallmentValue] = useState<number>(1200);
  const [initialPaidCount, setInitialPaidCount] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>(todayISO);
  const [dueDay, setDueDay] = useState<number>(10);
  const [interestRateMonthly, setInterestRateMonthly] = useState<string>('');
  const [contractNumber, setContractNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Calculations for preview
  const totalAmount = totalInstallments * installmentValue;
  const initialPaidAmount = Math.min(initialPaidCount, totalInstallments) * installmentValue;
  const remainingBalance = Math.max(0, totalAmount - initialPaidAmount);

  // Estimate end date
  const calculateEndDate = () => {
    if (!startDate || totalInstallments <= 0) return '-';
    const d = new Date(startDate + 'T00:00:00');
    d.setMonth(d.getMonth() + totalInstallments - 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${year}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Por favor, informe o nome do financiamento.');
      return;
    }

    if (!institution.trim()) {
      setErrorMsg('Por favor, informe a instituição financeira ou banco.');
      return;
    }

    if (totalInstallments <= 0 || isNaN(totalInstallments)) {
      setErrorMsg('A quantidade de parcelas deve ser maior que zero.');
      return;
    }

    if (installmentValue <= 0 || isNaN(installmentValue)) {
      setErrorMsg('O valor da parcela deve ser maior que zero.');
      return;
    }

    if (initialPaidCount < 0 || initialPaidCount > totalInstallments) {
      setErrorMsg(`O número de parcelas já pagas deve estar entre 0 e ${totalInstallments}.`);
      return;
    }

    const generatedInstallments = generateInstallmentSchedule(
      totalInstallments,
      installmentValue,
      startDate,
      dueDay,
      initialPaidCount
    );

    const newFinancing: Financiamento = {
      id: `fin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      institution: institution.trim(),
      category,
      totalInstallments,
      originalInstallmentValue: installmentValue,
      currentInstallmentValue: installmentValue,
      startDate,
      dueDay,
      interestRateMonthly: interestRateMonthly ? parseFloat(interestRateMonthly) : undefined,
      contractNumber: contractNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      installments: generatedInstallments,
      renegotiations: [],
    };

    onSave(newFinancing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl my-auto sm:my-8 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="shrink-0 bg-slate-900 border-b border-slate-800 p-4 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Novo Financiamento
              </h2>
              <p className="text-xs text-slate-400">
                Insira os dados do contrato para gerar o cronograma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form with flex-col layout for fixed header/footer and scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain">
            
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Nome do Financiamento */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-emerald-400" />
                  Nome do Financiamento *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Financiamento Honda Civic 2023, Ap 302 Caixa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Instituição Financeira */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Landmark className="h-3.5 w-3.5 text-slate-400" />
                  Instituição / Banco *
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ex: Caixa, Santander, Banco do Brasil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Categoria *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as FinancingCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Veículo">Veículo (Carro, Moto)</option>
                  <option value="Imóvel">Imóvel (Casa, Ap, Terreno)</option>
                  <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                  <option value="Estudantil">Estudantil / Faculdade</option>
                  <option value="Empresarial">Empresarial / PJ</option>
                  <option value="Cartão / Crediário">Cartão / Crediário</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {/* Quantidade de Parcelas */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calculator className="h-3.5 w-3.5 text-sky-400" />
                  Quantidade de Parcelas Total *
                </label>
                <input
                  type="number"
                  min="1"
                  max="600"
                  value={totalInstallments}
                  onChange={(e) => setTotalInstallments(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Valor da Parcela */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className="text-emerald-400 font-bold">R$</span>
                  Valor de Cada Parcela (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={installmentValue}
                  onChange={(e) => setInstallmentValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Parcelas Já Pagas (se contrato em andamento) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Parcelas Já Pagas Inicialmente
                </label>
                <input
                  type="number"
                  min="0"
                  max={totalInstallments}
                  value={initialPaidCount}
                  onChange={(e) => setInitialPaidCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400">
                  Informe 0 para novo financiamento ou a qtd já quitada previamente
                </span>
              </div>

              {/* Dia do Vencimento Mensal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-400" />
                  Dia do Vencimento no Mês *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={dueDay}
                  onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Data de Início (Primeira Parcela) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Data da 1ª Parcela *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Taxa de Juros Mensal (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-slate-400" />
                  Taxa Juros Mensal (% a.m.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1.25"
                  value={interestRateMonthly}
                  onChange={(e) => setInterestRateMonthly(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Número do Contrato */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  Nº do Contrato / Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contrato 849.102 / Taxa prefixada com seguro contratado"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

            </div>

            {/* Live Calculated Summary Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Resumo do Contrato Calculado
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block">Total Financiado</span>
                  <strong className="text-slate-100 font-bold text-sm">
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Total Já Pago</span>
                  <strong className="text-teal-400 font-bold text-sm">
                    {formatCurrency(initialPaidAmount)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Saldo Restante</span>
                  <strong className="text-emerald-400 font-bold text-sm">
                    {formatCurrency(remainingBalance)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-400 block">Previsão Término</span>
                  <strong className="text-sky-300 font-bold text-sm">
                    {calculateEndDate()}
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* Modal Footer */}
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
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Cadastrar Financiamento</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
