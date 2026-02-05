import type { Examination, Anamnesis } from '../stores/healthStore';

export interface Ek2WorkerData {
  name: string;
  tckn: string;
  jobTitle: string;
  companyName: string;
}

interface Ek2PrintViewProps {
  examData: Examination;
  workerData: Ek2WorkerData;
  /** When true, show print/close buttons (preview). When false, hide for actual print. */
  showActions?: boolean;
  onPrint?: () => void;
  onClose?: () => void;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR');
}

/** Check if free text contains a keyword (case-insensitive) for checkbox display */
function mentions(text: string, ...keywords: string[]): boolean {
  const t = (text || '').toLowerCase();
  return keywords.some((k) => t.includes(k.toLowerCase()));
}

const HISTORY_ITEMS: { label: string; check: (a: Anamnesis) => boolean }[] = [
  { label: 'Diyabet', check: (a) => mentions(a.chronicIllnesses, 'diyabet', 'şeker') },
  { label: 'Hipertansiyon', check: (a) => mentions(a.chronicIllnesses, 'hipertansiyon', 'tansiyon') },
  { label: 'Kalp Hastalığı', check: (a) => mentions(a.chronicIllnesses, 'kalp', 'kardiyak') },
  { label: 'Ameliyat', check: (a) => mentions(a.surgeries, 'ameliyat', 'operasyon') || a.surgeries.trim().length > 0 },
  { label: 'Alerji', check: (a) => mentions(a.chronicIllnesses, 'alerji') },
  { label: 'Astım / Solunum', check: (a) => mentions(a.chronicIllnesses, 'astım', 'solunum', 'koah') },
];

export function Ek2PrintView({
  examData,
  workerData,
  showActions = false,
  onPrint,
  onClose,
}: Ek2PrintViewProps) {
  const exam = examData;
  const w = workerData;
  const anam = exam.anamnesis;
  const phys = exam.physical;
  const labs = exam.labs;
  const conc = exam.conclusion;

  return (
    <div className="ek2-print-root">
      <style>{`
        .ek2-print-root {
          font-family: 'Times New Roman', Times, serif;
          font-size: 11px;
          max-width: 210mm;
          margin: 0 auto;
          padding: 12mm;
          color: #000;
          background: #fff;
        }
        .ek2-print-root table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
        }
        .ek2-print-root th,
        .ek2-print-root td {
          border: 1px solid #000;
          padding: 4px 6px;
          vertical-align: top;
        }
        .ek2-print-root th {
          background: #f0f0f0;
          font-weight: 600;
          width: 28%;
        }
        .ek2-print-root .section-title {
          font-weight: 700;
          margin: 10px 0 6px 0;
          font-size: 12px;
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
        }
        .ek2-print-root .header-main {
          text-align: center;
          font-weight: 700;
          font-size: 13px;
          margin-bottom: 2px;
        }
        .ek2-print-root .header-sub {
          text-align: center;
          font-size: 11px;
          margin-bottom: 12px;
        }
        .ek2-print-root .checkbox-cell {
          width: 22px;
          text-align: center;
        }
        .ek2-print-root .conclusion-box {
          border: 2px solid #000;
          padding: 10px;
          margin: 8px 0;
          min-height: 44px;
          font-weight: 600;
        }
        .ek2-print-root .signature-row {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          gap: 24px;
        }
        .ek2-print-root .signature-box {
          flex: 1;
          border-bottom: 1px solid #000;
          padding-top: 32px;
          text-align: center;
          font-size: 10px;
          color: #333;
        }
        .ek2-print-root .no-print {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        @media print {
          .ek2-print-root {
            padding: 10mm;
            font-size: 10px;
          }
          .ek2-print-root .no-print {
            display: none !important;
          }
          body * { visibility: hidden; }
          .ek2-print-root, .ek2-print-root * { visibility: visible; }
          .ek2-print-root { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      {showActions && (
        <div className="no-print">
          <button type="button" onClick={onPrint} style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Yazdır / PDF Olarak Kaydet
          </button>
          {onClose && (
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', cursor: 'pointer' }}>
              Kapat
            </button>
          )}
        </div>
      )}

      <div className="header-main">
        T.C. ÇALIŞMA VE SOSYAL GÜVENLİK BAKANLIĞI
      </div>
      <div className="header-sub">
        İşe Giriş / Periyodik Muayene Formu (EK-2)
      </div>

      {/* Section 1: Kimlik Bilgileri */}
      <div className="section-title">1. Kimlik Bilgileri</div>
      <table>
        <tbody>
          <tr>
            <th>Adı Soyadı</th>
            <td>{w.name || exam.employeeName || '—'}</td>
          </tr>
          <tr>
            <th>TC Kimlik No</th>
            <td>{w.tckn || '—'}</td>
          </tr>
          <tr>
            <th>Görevi / Ünvanı</th>
            <td>{w.jobTitle || '—'}</td>
          </tr>
          <tr>
            <th>İşyeri / Firma</th>
            <td>{w.companyName || '—'}</td>
          </tr>
          <tr>
            <th>Muayene Türü</th>
            <td>{exam.examType ?? 'Periyodik'}</td>
          </tr>
          <tr>
            <th>Muayene Tarihi</th>
            <td>{formatDate(exam.date)}</td>
          </tr>
          <tr>
            <th>Geçerlilik Tarihi</th>
            <td>{formatDate(exam.validUntil ?? exam.date)}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 2: Tıbbi Anamnez */}
      <div className="section-title">2. Tıbbi Anamnez</div>
      <table>
        <tbody>
          <tr>
            <th>Sigara</th>
            <td>
              <span className={anam.smoking ? 'checkbox-cell' : ''}>{anam.smoking ? '☑' : '☐'}</span> Evet
              <span className={!anam.smoking ? 'checkbox-cell' : ''} style={{ marginLeft: '12px' }}>{!anam.smoking ? '☑' : '☐'}</span> Hayır
            </td>
          </tr>
          <tr>
            <th>Alkol</th>
            <td>
              <span className={anam.alcohol ? 'checkbox-cell' : ''}>{anam.alcohol ? '☑' : '☐'}</span> Evet
              <span className={!anam.alcohol ? 'checkbox-cell' : ''} style={{ marginLeft: '12px' }}>{!anam.alcohol ? '☑' : '☐'}</span> Hayır
            </td>
          </tr>
          <tr>
            <th>Kronik Hastalıklar / Geçmiş</th>
            <td>
              <table style={{ border: 0, marginBottom: 6 }}>
                <tbody>
                  <tr>
                    {HISTORY_ITEMS.map((item) => (
                      <td key={item.label} style={{ border: 0, padding: '2px 8px 2px 0' }}>
                        {item.check(anam) ? '☑' : '☐'} {item.label}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
              {anam.chronicIllnesses?.trim() ? (
                <div style={{ marginTop: 4 }}><strong>Not:</strong> {anam.chronicIllnesses}</div>
              ) : null}
            </td>
          </tr>
          <tr>
            <th>Ameliyatlar</th>
            <td>{anam.surgeries?.trim() || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 3: Fizik Muayene */}
      <div className="section-title">3. Fizik Muayene</div>
      <table>
        <tbody>
          <tr>
            <th style={{ width: '18%' }}>Tansiyon</th>
            <td style={{ width: '32%' }}>{phys.bloodPressure || '—'}</td>
            <th style={{ width: '18%' }}>Nabız (/dk)</th>
            <td style={{ width: '32%' }}>{phys.heartRate ? String(phys.heartRate) : '—'}</td>
          </tr>
          <tr>
            <th>Kilo (kg)</th>
            <td>{phys.weight ? String(phys.weight) : '—'}</td>
            <th>Boy (cm)</th>
            <td>{phys.height ? String(phys.height) : '—'}</td>
          </tr>
          <tr>
            <th>BKİ</th>
            <td>{phys.bmi ? String(phys.bmi) : '—'}</td>
            <th>Görme</th>
            <td>{phys.vision || '—'}</td>
          </tr>
          <tr>
            <th>İşitme</th>
            <td>{phys.hearing || '—'}</td>
            <th>Solunum Sistemi</th>
            <td>—</td>
          </tr>
          <tr>
            <th>Kardiyovasküler</th>
            <td>—</td>
            <th>Diğer Sistemler</th>
            <td>—</td>
          </tr>
        </tbody>
      </table>

      {/* Section 4: Laboratuvar */}
      <div className="section-title">4. Laboratuvar / Tetkikler</div>
      <table>
        <tbody>
          <tr>
            <th>Hemogram / Kan Tetkikleri</th>
            <td>{labs.bloodAnalysis?.trim() || '—'}</td>
          </tr>
          <tr>
            <th>Odyometri</th>
            <td>{labs.audiometry?.trim() || '—'}</td>
          </tr>
          <tr>
            <th>Akciğer Grafisi / PFT</th>
            <td>{labs.lungXray?.trim() || '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* Section 5: Kanaat ve Sonuç */}
      <div className="section-title">5. Kanaat ve Sonuç</div>
      <div className="conclusion-box">
        {conc.result === 'Elverişli' && 'İşe elverişlidir.'}
        {conc.result === 'Şartlı' && `Şartlı elverişlidir.${conc.conditions?.trim() ? ` (${conc.conditions})` : ''}`}
        {conc.result === 'Elverişsiz' && `İşe elverişli değildir.${conc.conditions?.trim() ? ` (${conc.conditions})` : ''}`}
        {!conc.result && '—'}
      </div>
      <table>
        <tbody>
          <tr>
            <th>Sonraki Muayene Tarihi</th>
            <td>{formatDate(conc.nextExamDate)}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer: Signatures */}
      <div className="signature-row">
        <div className="signature-box">Çalışan İmzası</div>
        <div className="signature-box">İşyeri Hekimi İmzası</div>
      </div>
    </div>
  );
}
