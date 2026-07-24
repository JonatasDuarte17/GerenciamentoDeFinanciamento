import { Financiamento, Parcela, FinancingSummary, GlobalDashboardStats, FinancingOverallStatus, Renegociacao } from '../types';

/**
 * Formats currency values into Brazilian Real (R$)
 */
export function formatCurrency(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats ISO date string YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateString;
}

/**
 * Gets today's date string in YYYY-MM-DD format based on local time
 */
export function getTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates difference in calendar days between two ISO date strings (date1 - date2)
 */
export function getDaysDifference(targetDateISO: string, referenceDateISO: string = getTodayISO()): number {
  const d1 = new Date(targetDateISO + 'T00:00:00');
  const d2 = new Date(referenceDateISO + 'T00:00:00');
  const diffMs = d1.getTime() - d2.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Generates an array of installments starting from a initial date and monthly due day
 */
export function generateInstallmentSchedule(
  totalInstallments: number,
  installmentValue: number,
  startDateISO: string,
  dueDay: number,
  initialPaidCount: number = 0
): Parcela[] {
  const installments: Parcela[] = [];
  const baseDate = new Date(startDateISO + 'T00:00:00');
  const todayISO = getTodayISO();

  for (let i = 1; i <= totalInstallments; i++) {
    // Add (i - 1) months to start date
    const targetMonth = baseDate.getMonth() + (i - 1);
    const targetYear = baseDate.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    // Handle month length overflow (e.g. Feb 30 -> Feb 28/29)
    const daysInTargetMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    const actualDay = Math.min(dueDay, daysInTargetMonth);

    const monthStr = String(normalizedMonth + 1).padStart(2, '0');
    const dayStr = String(actualDay).padStart(2, '0');
    const dueDateISO = `${targetYear}-${monthStr}-${dayStr}`;

    const isAlreadyPaid = i <= initialPaidCount;
    let status: 'PAGA' | 'PENDENTE' | 'ATRASADA' = isAlreadyPaid ? 'PAGA' : 'PENDENTE';

    if (!isAlreadyPaid && dueDateISO < todayISO) {
      status = 'ATRASADA';
    }

    installments.push({
      id: `inst-${i}-${Math.random().toString(36).substring(2, 7)}`,
      number: i,
      dueDate: dueDateISO,
      originalValue: installmentValue,
      currentValue: installmentValue,
      status: status,
      paidDate: isAlreadyPaid ? dueDateISO : undefined,
      paidValue: isAlreadyPaid ? installmentValue : undefined,
    });
  }

  return installments;
}

/**
 * Computes live status and metrics for a single financing item
 */
export function getFinancingSummary(item: Financiamento): FinancingSummary {
  const todayISO = getTodayISO();
  const sortedInstallments = [...item.installments].sort((a, b) => a.number - b.number);
  
  const totalInstallments = sortedInstallments.length;
  const paidInstallments = sortedInstallments.filter((p) => p.status === 'PAGA');
  const paidInstallmentsCount = paidInstallments.length;
  const remainingInstallmentsCount = totalInstallments - paidInstallmentsCount;
  
  // Calculate total paid in currency
  const totalAmountPaid = paidInstallments.reduce((acc, curr) => acc + (curr.paidValue ?? curr.currentValue), 0);
  
  // Calculate remaining balance in currency
  const unpaidInstallments = sortedInstallments.filter((p) => p.status !== 'PAGA');
  const remainingBalance = unpaidInstallments.reduce((acc, curr) => acc + curr.currentValue, 0);
  const totalAmountContracted = totalAmountPaid + remainingBalance;

  // Find overdue installments
  const overdueInstallments = unpaidInstallments.filter((p) => p.dueDate < todayISO);
  const overdueInstallmentsCount = overdueInstallments.length;

  let daysOverdueMax = 0;
  if (overdueInstallmentsCount > 0) {
    const oldestOverdue = overdueInstallments[0];
    daysOverdueMax = Math.max(0, -getDaysDifference(oldestOverdue.dueDate, todayISO));
  }

  // Determine overall status
  let overallStatus: FinancingOverallStatus = 'EM_DIA';
  if (paidInstallmentsCount === totalInstallments && totalInstallments > 0) {
    overallStatus = 'QUITADO';
  } else if (overdueInstallmentsCount > 0) {
    overallStatus = 'ATRASADO';
  } else {
    overallStatus = 'EM_DIA';
  }

  // Find next due date and current installment number
  let nextDueDate: string | null = null;
  let currentInstallmentNumber: number | null = null;

  if (unpaidInstallments.length > 0) {
    const nextItem = unpaidInstallments[0];
    nextDueDate = nextItem.dueDate;
    currentInstallmentNumber = nextItem.number;
  }

  const completionPercentage = totalInstallments > 0
    ? Math.round((paidInstallmentsCount / totalInstallments) * 1000) / 10
    : 0;

  return {
    id: item.id,
    name: item.name,
    institution: item.institution,
    category: item.category,
    overallStatus,
    totalInstallments,
    paidInstallmentsCount,
    remainingInstallmentsCount,
    currentInstallmentNumber,
    overdueInstallmentsCount,
    daysOverdueMax,
    totalAmountContracted,
    totalAmountPaid,
    remainingBalance,
    currentMonthlyValue: item.currentInstallmentValue,
    nextDueDate,
    completionPercentage,
  };
}

/**
 * Calculates global stats for all active and completed financings
 */
export function calculateGlobalStats(financings: Financiamento[]): GlobalDashboardStats {
  const summaries = financings.map(getFinancingSummary);
  
  const totalFinancingsCount = summaries.length;
  const activeFinancingsCount = summaries.filter((s) => s.overallStatus !== 'QUITADO').length;
  const overdueFinancingsCount = summaries.filter((s) => s.overallStatus === 'ATRASADO').length;
  const paidOffFinancingsCount = summaries.filter((s) => s.overallStatus === 'QUITADO').length;

  const totalContractedAmount = summaries.reduce((acc, s) => acc + s.totalAmountContracted, 0);
  const totalPaidAmount = summaries.reduce((acc, s) => acc + s.totalAmountPaid, 0);
  const totalRemainingBalance = summaries.reduce((acc, s) => acc + s.remainingBalance, 0);
  
  // Total monthly commitment for active loans
  const totalMonthlyCommitment = summaries
    .filter((s) => s.overallStatus !== 'QUITADO')
    .reduce((acc, s) => acc + s.currentMonthlyValue, 0);

  const overdueInstallmentsTotalCount = summaries.reduce((acc, s) => acc + s.overdueInstallmentsCount, 0);

  // Total overdue currency amount
  const todayISO = getTodayISO();
  let totalOverdueAmount = 0;
  financings.forEach((f) => {
    f.installments.forEach((p) => {
      if (p.status !== 'PAGA' && p.dueDate < todayISO) {
        totalOverdueAmount += p.currentValue;
      }
    });
  });

  return {
    totalFinancingsCount,
    activeFinancingsCount,
    overdueFinancingsCount,
    paidOffFinancingsCount,
    totalContractedAmount,
    totalPaidAmount,
    totalRemainingBalance,
    totalMonthlyCommitment,
    overdueInstallmentsTotalCount,
    totalOverdueAmount,
  };
}

/**
 * Renegotiates/refinances the remaining term of a financing item:
 * Keeps all paid installments intact.
 * Replaces the unpaid installments with newRemainingInstallments count,
 * newInstallmentValue, and new due dates calculated monthly from the next due month.
 */
export function renegotiateFinancing(
  item: Financiamento,
  newRemainingInstallmentsCount: number,
  newInstallmentValue: number,
  newRemainingBalance: number,
  reason: string
): Financiamento {
  const todayISO = getTodayISO();
  const sorted = [...item.installments].sort((a, b) => a.number - b.number);
  
  const paidInstallments = sorted.filter((p) => p.status === 'PAGA');
  const paidCount = paidInstallments.length;

  // Calculate previous unpaid state for history log
  const unpaidBefore = sorted.filter((p) => p.status !== 'PAGA');
  const prevRemainingBalance = unpaidBefore.reduce((sum, p) => sum + p.currentValue, 0);
  const prevRemainingInstallments = unpaidBefore.length;

  // Determine starting date for new installments schedule
  let baseNextDate = new Date();
  if (unpaidBefore.length > 0) {
    baseNextDate = new Date(unpaidBefore[0].dueDate + 'T00:00:00');
  } else {
    baseNextDate.setMonth(baseNextDate.getMonth() + 1);
  }

  const renegotiationEvent: Renegociacao = {
    id: `reneg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    date: todayISO,
    reason: reason || 'Ajuste de prazo e parcela do saldo restante',
    previousRemainingInstallments: prevRemainingInstallments,
    newRemainingInstallments: newRemainingInstallmentsCount,
    previousInstallmentValue: item.currentInstallmentValue,
    newInstallmentValue: newInstallmentValue,
    previousRemainingBalance: prevRemainingBalance,
    newRemainingBalance: newRemainingBalance,
    fromInstallmentNumber: paidCount + 1,
  };

  // Generate new unpaid installments
  const newUnpaidInstallments: Parcela[] = [];
  const dueDay = item.dueDay || baseNextDate.getDate();

  for (let k = 1; k <= newRemainingInstallmentsCount; k++) {
    const installmentNumber = paidCount + k;
    
    // Add (k - 1) months from baseNextDate
    const targetMonth = baseNextDate.getMonth() + (k - 1);
    const targetYear = baseNextDate.getFullYear() + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const daysInMonth = new Date(targetYear, normalizedMonth + 1, 0).getDate();
    const actualDay = Math.min(dueDay, daysInMonth);

    const monthStr = String(normalizedMonth + 1).padStart(2, '0');
    const dayStr = String(actualDay).padStart(2, '0');
    const dueDateISO = `${targetYear}-${monthStr}-${dayStr}`;

    const isOverdue = dueDateISO < todayISO;

    newUnpaidInstallments.push({
      id: `inst-${installmentNumber}-${Math.random().toString(36).substring(2, 7)}`,
      number: installmentNumber,
      dueDate: dueDateISO,
      originalValue: newInstallmentValue,
      currentValue: newInstallmentValue,
      status: isOverdue ? 'ATRASADA' : 'PENDENTE',
      renegotiatedInId: renegotiationEvent.id,
    });
  }

  const updatedInstallments = [...paidInstallments, ...newUnpaidInstallments];

  return {
    ...item,
    totalInstallments: paidCount + newRemainingInstallmentsCount,
    currentInstallmentValue: newInstallmentValue,
    updatedAt: new Date().toISOString(),
    installments: updatedInstallments,
    renegotiations: [renegotiationEvent, ...(item.renegotiations || [])],
  };
}

/**
 * Creates sample realistic Brazilian financing data for quick demonstration
 */
export function getSampleFinancings(): Financiamento[] {
  const today = new Date();
  
  // Helper date generators relative to today
  const getPastMonth = (monthsAgo: number, day: number = 10) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(day);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${dd}`;
  };

  // 1. Financiamento Imobiliário Caixa (Em dia, 24 de 360 pago)
  const f1StartDate = getPastMonth(24, 15);
  const f1: Financiamento = {
    id: 'sample-1',
    name: 'Apartamento Res. Parque das Flores',
    institution: 'Caixa Econômica Federal',
    category: 'Imóvel',
    totalInstallments: 360,
    originalInstallmentValue: 1850.0,
    currentInstallmentValue: 1850.0,
    startDate: f1StartDate,
    dueDay: 15,
    interestRateMonthly: 0.75,
    contractNumber: '874.102.938-1',
    notes: 'Sistema de Amortização SAC - Taxa bonificada com conta corrente.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installments: generateInstallmentSchedule(360, 1850.0, f1StartDate, 15, 24),
    renegotiations: [],
  };

  // 2. Financiamento Veicular - Honda HRV (Atrasado 1 parcela para alerta)
  const f2StartDate = getPastMonth(14, 5);
  const f2Installments = generateInstallmentSchedule(48, 1420.5, f2StartDate, 5, 12);
  // Mark 13th installment as overdue (it fell due on past day 5 of current month)
  const f2: Financiamento = {
    id: 'sample-2',
    name: 'Honda HR-V EXL 2022',
    institution: 'Banco Santander Auto',
    category: 'Veículo',
    totalInstallments: 48,
    originalInstallmentValue: 1420.5,
    currentInstallmentValue: 1420.5,
    startDate: f2StartDate,
    dueDay: 5,
    interestRateMonthly: 1.29,
    contractNumber: 'SAN-4930129',
    notes: 'Parcela com vencimento no dia 5 de cada mês.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installments: f2Installments,
    renegotiations: [],
  };

  // 3. Empréstimo Pessoal Reforma (Renegociado previamente, em dia)
  const f3StartDate = getPastMonth(8, 20);
  const f3Installments = generateInstallmentSchedule(24, 680.0, f3StartDate, 20, 8);
  const f3: Financiamento = {
    id: 'sample-3',
    name: 'Empréstimo Reforma da Cozinha',
    institution: 'Banco do Brasil',
    category: 'Empréstimo Pessoal',
    totalInstallments: 24,
    originalInstallmentValue: 850.0,
    currentInstallmentValue: 680.0,
    startDate: f3StartDate,
    dueDay: 20,
    interestRateMonthly: 1.85,
    contractNumber: 'BB-983021',
    notes: 'Prazo estendido em renegociação para reduzir parcela mensal.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installments: f3Installments,
    renegotiations: [
      {
        id: 'reneg-init-1',
        date: getPastMonth(3, 1),
        reason: 'Prorrogação de prazo para adequação do orçamento familiar',
        previousRemainingInstallments: 12,
        newRemainingInstallments: 16,
        previousInstallmentValue: 850.0,
        newInstallmentValue: 680.0,
        previousRemainingBalance: 10200.0,
        newRemainingBalance: 10880.0,
        fromInstallmentNumber: 9,
      },
    ],
  };

  // 4. Curso de Pós-Graduação (Quitado)
  const f4StartDate = getPastMonth(12, 10);
  const f4Installments = generateInstallmentSchedule(12, 450.0, f4StartDate, 10, 12);
  const f4: Financiamento = {
    id: 'sample-4',
    name: 'Pós-Graduação Gestão Financeira',
    institution: 'Creditas Estudantil',
    category: 'Estudantil',
    totalInstallments: 12,
    originalInstallmentValue: 450.0,
    currentInstallmentValue: 450.0,
    startDate: f4StartDate,
    dueDay: 10,
    contractNumber: 'CRD-110293',
    notes: 'Financiamento 100% quitado!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    installments: f4Installments,
    renegotiations: [],
  };

  return [f1, f2, f3, f4];
}
