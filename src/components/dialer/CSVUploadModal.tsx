import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Download } from 'lucide-react';

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (leads: Array<{ company: string; phone: string; email: string; website: string; contact_person: string }>) => void;
}

const COLUMN_MAPPINGS: Record<string, string> = {
  virksomhedsnavn: 'company', company: 'company', virksomhed: 'company', name: 'company', navn: 'company', firma: 'company',
  telefon: 'phone', phone: 'phone', tlf: 'phone', tel: 'phone', telefonnummer: 'phone',
  email: 'email', 'e-mail': 'email', mail: 'email',
  hjemmeside: 'website', website: 'website', web: 'website', url: 'website', link: 'website',
  kontaktperson: 'contact_person', kontakt: 'contact_person', contact: 'contact_person', 'contact person': 'contact_person', person: 'contact_person',
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
    }, 600);
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
    <div className="fixed inset-0 bg-background/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-fade-in" onClick={reset}>
      <div className="card-surface rounded-xl w-full max-w-[600px] max-h-[78vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <h2 className="font-heading font-bold text-[15px] tracking-tight flex items-center gap-2">
            <Upload size={16} className="text-muted-foreground" strokeWidth={1.8} />
            Importer CSV
          </h2>
          <button onClick={reset} className="text-muted-foreground/40 hover:text-foreground cursor-pointer bg-transparent border-none transition-colors duration-150">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {!file ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center gap-3
                ${dragOver ? 'border-primary bg-accent/40' : 'border-border/50 hover:border-primary/30 hover:bg-accent/15'}`}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <FileText size={22} className="text-muted-foreground/50" strokeWidth={1.5} />
              </div>
              <div className="font-medium text-[13px]">Træk og slip din CSV-fil her</div>
              <div className="text-[12px] text-muted-foreground/50">eller klik for at vælge</div>
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
              <div className="flex items-center gap-3 bg-accent/20 rounded-lg px-3.5 py-2.5">
                <FileText size={18} className="text-primary shrink-0" strokeWidth={1.8} />
                <div className="flex-1">
                  <div className="font-medium text-[13px]">{file.name}</div>
                  <div className="text-[11px] text-muted-foreground/50">{allRows.length} rækker fundet</div>
                </div>
                <button onClick={() => { setFile(null); setPreview(null); }} className="text-muted-foreground/40 hover:text-destructive cursor-pointer bg-transparent border-none">
                  <X size={14} />
                </button>
              </div>

              {preview && (
                <div>
                  <div className="label-clean mb-1.5">Forhåndsvisning ({preview.length} rækker)</div>
                  <div className="overflow-x-auto rounded-lg border border-border/40">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr className="bg-secondary/40">
                          {headers.map((h, i) => (
                            <th key={i} className="px-2.5 py-1.5 text-left font-medium text-muted-foreground/60">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, ri) => (
                          <tr key={ri} className="border-t border-border/20">
                            {row.map((cell, ci) => (
                              <td key={ci} className="px-2.5 py-1.5 text-foreground/70">{cell}</td>
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
          <div className="px-5 py-3.5 border-t border-border/40 flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground/50">{allRows.length} emner klar</span>
            <div className="flex gap-2.5">
              <button onClick={reset} className="btn-ghost-smooth text-[12px]">Annuller</button>
              <button onClick={handleImport} disabled={importing} className="btn-primary-smooth text-[12px] flex items-center gap-1.5">
                {importing ? (
                  <>Importerer...</>
                ) : (
                  <><Download size={13} strokeWidth={2} /> Importer {allRows.length} emner</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
