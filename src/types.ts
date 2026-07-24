export type FinancingCategory = 'Imóvel' | 'Veículo' | 'Empréstimo Pessoal' | 'Estudantil' | 'Empresarial' | 'Cartão / Crediário' | 'Outro';

export type InstallmentStatus = 'PAGA' | 'PENDENTE' | 'ATRASADA' | 'RENEGOCIADA';

export type FinancingOverallStatus = 'EM_DIA' | 'ATRASADO' | 'QUITADO';

export interface Parcela {
  id: string;
  number: number; // e.g. 1, 2, 3...
  dueDate: string; // ISO string YYYY-MM-DD
  originalValue: number; // Value when created
  currentValue: number; // Current value due
  status: InstallmentStatus;
  paidDate?: string; // ISO string YYYY-MM-DD when paid
  paidValue?: number; // Actual value paid
  notes?: string;
  renegotiatedInId?: string; // Reference to renegotiation event if modified
}

export interface Renegociacao {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  reason: string; // Motivo da renegociação (e.g. "Prorrogação de prazo", "Amortização extraordinária")
  previousRemainingInstallments: number; // Quantidade de parcelas restantes antes
  newRemainingInstallments: number; // Nova quantidade de parcelas restantes
  previousInstallmentValue: number; // Valor anterior da parcela
  newInstallmentValue: number; // Novo valor da parcela
  previousRemainingBalance: number; // Saldo devedor antes
  newRemainingBalance: number; // Novo saldo devedor ajustado
  fromInstallmentNumber: number; // A partir de qual parcela a alteração passou a valer
}

export interface Financiamento {
  id: string;
  name: string; // Nome do financiamento (e.g. "Financiamento de Ap - Caixa", "Honda Civic 2022")
  institution: string; // Instituição financeira / Banco (e.g. "Caixa Econômica", "Santander")
  category: FinancingCategory;
  totalInstallments: number; // Quantidade total contratada
  originalInstallmentValue: number; // Valor inicial da parcela
  currentInstallmentValue: number; // Valor atualizado da parcela
  startDate: string; // Data da primeira parcela YYYY-MM-DD
  dueDay: number; // Dia do mês para vencimento (1 a 31)
  interestRateMonthly?: number; // Taxa de juros mensal % (opcional)
  notes?: string;
  contractNumber?: string;
  createdAt: string;
  updatedAt: string;
  
  installments: Parcela[];
  renegotiations: Renegociacao[];
}

export interface FinancingSummary {
  id: string;
  name: string;
  institution: string;
  category: FinancingCategory;
  overallStatus: FinancingOverallStatus;
  totalInstallments: number;
  paidInstallmentsCount: number;
  remainingInstallmentsCount: number;
  currentInstallmentNumber: number | null; // Próxima parcela a vencer ou parcela atual atrasada
  overdueInstallmentsCount: number;
  daysOverdueMax: number; // Quantos dias atrasado a parcela mais antiga sem pagar está
  
  totalAmountContracted: number; // Total pago + total a pagar estimado
  totalAmountPaid: number; // Total já pago em R$
  remainingBalance: number; // Saldo devedor total restante (soma das parcelas pendentes/atrasadas)
  currentMonthlyValue: number; // Valor da parcela atual mensal
  
  nextDueDate: string | null; // Data do próximo vencimento
  completionPercentage: number; // % de parcelas pagas (0 a 100)
}

export interface GlobalDashboardStats {
  totalFinancingsCount: number;
  activeFinancingsCount: number;
  overdueFinancingsCount: number;
  paidOffFinancingsCount: number;
  
  totalContractedAmount: number;
  totalPaidAmount: number;
  totalRemainingBalance: number;
  totalMonthlyCommitment: number; // Soma das parcelas mensais ativas
  
  overdueInstallmentsTotalCount: number;
  totalOverdueAmount: number;
}

export type StatusFilterOption = 'TODOS' | 'EM_DIA' | 'ATRASADO' | 'QUITADO';
export type SortOption = 'PROXIMO_VENCIMENTO' | 'MAIOR_SALDO' | 'NOME' | 'MAIS_RECENTE';
