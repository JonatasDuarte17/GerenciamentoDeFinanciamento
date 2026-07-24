import React from 'react';
import { Financiamento } from '../types';
import { getFinancingSummary, formatCurrency } from '../utils/financing';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingDown } from 'lucide-react';

interface AnalyticsChartsProps {
  financings: Financiamento[];
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ financings }) => {
  if (financings.length === 0) return null;

  // 1. Data for Category Distribution (Pie Chart)
  const categoryMap: Record<string, number> = {};
  financings.forEach((f) => {
    const sum = getFinancingSummary(f);
    if (sum.overallStatus !== 'QUITADO') {
      categoryMap[f.category] = (categoryMap[f.category] || 0) + sum.remainingBalance;
    }
  });

  const categoryData = Object.keys(categoryMap).map((cat) => ({
    name: cat,
    value: categoryMap[cat],
  }));

  // 2. Data for Balance vs Paid per Loan (Bar Chart)
  const loanComparisonData = financings.map((f) => {
    const sum = getFinancingSummary(f);
    return {
      name: f.name.length > 18 ? f.name.substring(0, 16) + '...' : f.name,
      paid: sum.totalAmountPaid,
      remaining: sum.remainingBalance,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
      
      {/* Category Distribution Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Saldo Devedor por Categoria
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Contratos Ativos</span>
        </div>

        {categoryData.length > 0 ? (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Saldo Devedor']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
                />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48 flex items-center justify-center text-xs text-slate-500">
            Nenhum saldo devedor ativo para exibir no gráfico.
          </div>
        )}
      </div>

      {/* Paid vs Remaining per Loan Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Valor Pago vs Saldo Restante por Financiamento
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Visão Geral (R$)</span>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loanComparisonData}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(v) => `R$${v / 1000}k`} />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value)),
                  name === 'paid' ? 'Total Pago' : 'Saldo Restante',
                ]}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#f8fafc', fontSize: '12px' }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-300">
                    {value === 'paid' ? 'Total Pago' : 'Saldo Restante'}
                  </span>
                )}
              />
              <Bar dataKey="paid" stackId="a" fill="#0d9488" name="paid" radius={[0, 0, 4, 4]} />
              <Bar dataKey="remaining" stackId="a" fill="#10b981" name="remaining" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
