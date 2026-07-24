import React, { useRef } from 'react';
import { Landmark, Plus, Download, Upload, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  onOpenNewModal: () => void;
  onExport: () => void;
  onImportJSON: (jsonStr: string) => void;
  onResetSample: () => void;
  onClearAll: () => void;
  overdueCount: number;
  hasItems: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewModal,
  onExport,
  onImportJSON,
  onResetSample,
  onClearAll,
  overdueCount,
  hasItems,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportJSON(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <Landmark className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-5">
                FinanControl
              </h1>
              <span className="hidden sm:inline-block bg-slate-800 text-emerald-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
                Gestão de Financiamentos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Acompanhamento de parcelas, renegociações e saldo devedor
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Overdue Warning Badge if any */}
          {overdueCount > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-lg animate-pulse">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>{overdueCount} {overdueCount === 1 ? 'financiamento em atraso' : 'financiamentos em atraso'}</span>
            </div>
          )}

          {/* Import / Export / Clear Controls */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/80">
            {hasItems && (
              <button
                onClick={onExport}
                title="Exportar dados em arquivo JSON"
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-slate-400" />
                <span>Exportar</span>
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              title="Importar dados de arquivo JSON"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 text-slate-400" />
              <span>Importar</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            {hasItems ? (
              <button
                onClick={onClearAll}
                title="Remover todos os financiamentos"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Limpar Tudo</span>
              </button>
            ) : (
              <button
                onClick={onResetSample}
                title="Carregar financiamentos demonstrativos de exemplo"
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">Carregar Exemplo</span>
              </button>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Novo Financiamento</span>
          </button>

        </div>
      </div>
    </header>
  );
};
