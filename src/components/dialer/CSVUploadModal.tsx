import React, { useState, useRef, useCallback } from 'react';

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (leads: Array<{ company: string; phone: string; email: string; website: string }>) => void;
}

const COLUMN_MAPPINGS: Record<string, string> = {
  virksomhedsnavn: 'company', company: 'company', virksomhed: 'company', name: 'company', navn: 'company', firma: 'company',
  telefon: 'phone', phone: 'phone', tlf: 'phone', tel: 'phone', telefonnummer: 'phone',
  email: 'email', 'e-mail': 'email', mail: 'email',
  hjemmeside: 'website', website: 'website', web: 'website', url: 'website', link: 'website',
};

function parseCSV(text: string): string[][] {
  const lines = text.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if ((char === ',' || char === ';') && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  });
}

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({ open, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) return;
      setHeaders(rows[0]);
      const dataRows = rows.slice(1).filter(r => r.some(cell => cell.trim()));
      setAllRows(dataRows);
      setPreview(dataRows.slice(0, 5));
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.csv') || f.type === 'text/csv')) {
      processFile(f);
    }
  }, [processFile]);

  const handleImport = () => {
    if (!allRows.length || !headers.length) return;
    setImporting(true);

    const mapping: Record<number, string> = {};
    headers.forEach((h, i) => {
      const key = h.toLowerCase().trim();
      if (COLUMN_MAPPINGS[key]) mapping[i] = COLUMN_MAPPINGS[key];
    });

    const leads = allRows.map(row => {
      const lead = { company: '', phone: '', email: '', website: '' };
      Object.entries(mapping).forEach(([idx, field]) => {
        (lead as any)[field] = row[parseInt(idx)] || '';
      });
      return lead;
    }).filter(l => l.company.trim());

    setTimeout(() => {
      onImport(leads);
      setImporting(false);
      setFile(null);
      setPreview(null);
      setHeaders([]);
      setAllRows([]);
    }, 800);
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setHeaders([]);
    setAllRows([]);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in" onClick={reset}>
      <div className="card-surface rounded-2xl w-full max-w-[640px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg tracking-tight">📂 Importer CSV</h2>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground text-xl cursor-pointer bg-transparent border-none">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-5">
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
                ${dragOver ? 'border-primary bg-accent/50 scale-[1.01]' : 'border-border/60 hover:border-primary/40 hover:bg-accent/20'}`}
            >
              <div className="text-4xl mb-3">📄</div>
              <div className="font-medium text-sm">Træk og slip din CSV-fil her</div>
              <div className="text-xs text-muted-foreground mt-2">eller klik for at vælge en fil</div>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-accent/30 rounded-xl px-4 py-3">
                <span className="text-xl">📄</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{allRows.length} rækker fundet</div>
                </div>
                <button onClick={() => { setFile(null); setPreview(null); }} className="text-xs text-muted-foreground hover:text-destructive cursor-pointer bg-transparent border-none">✕ Fjern</button>
              </div>

              {preview && (
                <div>
                  <div className="label-clean mb-2">Forhåndsvisning (første {preview.length} rækker)</div>
                  <div className="overflow-x-auto rounded-xl border border-border/50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary/60">
                          {headers.map((h, i) => (
                            <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, ri) => (
                          <tr key={ri} className="border-t border-border/30">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-3 py-2 text-foreground/80">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {file && (
          <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{allRows.length} emner klar til import</span>
            <div className="flex gap-3">
              <button onClick={reset} className="btn-ghost-smooth text-sm">Annuller</button>
              <button onClick={handleImport} disabled={importing} className="btn-primary-smooth text-sm flex items-center gap-2">
                {importing ? (
                  <>⏳ Importerer...</>
                ) : (
                  <>📥 Importer {allRows.length} emner</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
