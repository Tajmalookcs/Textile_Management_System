import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'

function fmtDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

function numFmt(n, dec = 0) {
  if (n == null || n === '' || isNaN(Number(n))) return '—'
  return Number(Number(n).toFixed(dec)).toLocaleString('en-PK')
}

const PRINT_CSS = `
@media print {
  body { font-size: 11pt; margin: 0; background: #fff !important; color: #000 !important; }
  .no-print { display: none !important; }
  .invoice-wrapper { padding: 8mm !important; box-shadow: none !important; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #000 !important; padding: 4px 8px !important; }
  @page { size: A4; margin: 12mm; }
}
`

export default function InvoicePrint() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const [inv, setInv]         = useState(null)
  const [items, setItems]     = useState([])
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (!document.getElementById('invoice-print-css')) {
      const style = document.createElement('style')
      style.id = 'invoice-print-css'
      style.textContent = PRINT_CSS
      document.head.appendChild(style)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, itemsRes, compRes] = await Promise.all([
          api.get(`invoices/${id}/`),
          api.get('invoice-items/', { params: { invoice: id } }),
          api.get('company/').catch(() => ({ data: [] })),
        ])
        setInv(invRes.data)
        setItems(itemsRes.data.results ?? itemsRes.data)
        const d = compRes.data
        setCompany(d?.results?.[0] || d?.[0] || d || null)
      } catch { setError('Failed to load invoice.') }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial,sans-serif', color:'#555' }}>Loading invoice…</div>
  if (error)   return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'Arial,sans-serif', color:'#c00' }}>{error}</div>
  if (!inv)    return null

  const totals = items.reduce((acc, item) => ({
    qty:  acc.qty  + (Number(item.quantity)         || 0),
    excl: acc.excl + (Number(item.value_excl_tax)   || 0),
    tax:  acc.tax  + (Number(item.sales_tax_amount) || 0),
    incl: acc.incl + (Number(item.value_incl_tax)   || 0),
  }), { qty: 0, excl: 0, tax: 0, incl: 0 })

  const hasFbr = inv.fbr_status === 'accepted' && inv.fbr_irn

  const s = {
    page:      { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '11pt', color: '#000', background: '#fff' },
    wrapper:   { maxWidth: '210mm', margin: '0 auto', padding: '20px 30px', background: '#fff', boxShadow: '0 0 30px rgba(0,0,0,0.1)', minHeight: '297mm' },
    header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '8px' },
    logo:      { width: '90px', height: '90px', objectFit: 'contain' },
    logoPlaceholder: { width: '90px', height: '90px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt', color: '#999', textAlign: 'center' },
    companyCenter: { flex: 1, textAlign: 'center', padding: '0 16px' },
    companyName:   { fontSize: '18pt', fontWeight: 'bold', color: '#1a1a1a', margin: 0 },
    companyRight:  { textAlign: 'right', fontSize: '9pt', color: '#333', minWidth: '160px' },
    regBox:    { textAlign: 'center', padding: '4px 0', fontSize: '9pt', borderBottom: '1px solid #000', marginBottom: '8px' },
    bigTitle:  { textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', letterSpacing: '2px', textDecoration: 'underline', margin: '8px 0', textTransform: 'uppercase' },
    buyerSection: { borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '6px 0', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' },
    buyerLeft:    { flex: 1, fontSize: '9.5pt', lineHeight: '1.7' },
    buyerRight:   { textAlign: 'right', fontSize: '9.5pt', lineHeight: '1.7', minWidth: '180px' },
    table:  { width: '100%', borderCollapse: 'collapse', fontSize: '9pt', marginBottom: '0' },
    th:     { border: '1px solid #000', padding: '5px 7px', background: '#f0f0f0', fontWeight: 'bold', textAlign: 'center', fontSize: '8.5pt' },
    td:     { border: '1px solid #000', padding: '5px 7px', verticalAlign: 'middle' },
    tdR:    { border: '1px solid #000', padding: '5px 7px', textAlign: 'right', verticalAlign: 'middle' },
    tdC:    { border: '1px solid #000', padding: '5px 7px', textAlign: 'center', verticalAlign: 'middle' },
    totalRow: { background: '#f9f9f9', fontWeight: 'bold' },
    label: { fontWeight: 'bold' },
    fbrBox: {
      marginTop: '14px',
      border: '1px solid #000',
      padding: '8px 12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '9pt',
      background: '#f9f9f9',
    },
    fbrLeft: { lineHeight: '1.8' },
    signatureSection: { marginTop: '40px', display: 'flex', justifyContent: 'flex-end', fontSize: '10pt' },
    signatureBox:     { textAlign: 'center', minWidth: '160px' },
    signatureLine:    { borderTop: '1px solid #000', paddingTop: '4px', marginTop: '40px', textAlign: 'center' },
  }

  return (
    <div style={s.page}>
      {/* Print toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <button onClick={() => navigate('/invoices')}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', fontSize: '13px', cursor: 'pointer' }}>
          ← Back
        </button>
        <span style={{ color: '#fff', fontFamily: 'Arial', fontSize: '14px', fontWeight: 'bold', flex: 1 }}>
          Invoice Preview — {inv.invoice_no}
          {hasFbr && <span style={{ marginLeft: '12px', fontSize: '11px', color: '#6ee7b7' }}>✓ FBR Verified — IRN: {inv.fbr_irn}</span>}
        </span>
        <button onClick={() => window.print()}
          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#fff', color: '#7c3aed', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
          Print / Save PDF
        </button>
      </div>

      {/* Invoice Document */}
      <div className="invoice-wrapper" style={s.wrapper}>

        {/* Header */}
        <div style={s.header}>
          <div>
            {company?.logo
              ? <img src={company.logo} alt="logo" style={s.logo} />
              : <div style={s.logoPlaceholder}>Company<br />Logo</div>
            }
          </div>
          <div style={s.companyCenter}>
            <p style={s.companyName}>{company?.name || 'Company Name'}</p>
          </div>
          <div style={s.companyRight}>
            {company?.address && <div>{company.address}</div>}
            {company?.city    && <div>{company.city}</div>}
            {company?.phone   && <div>Ph: {company.phone}</div>}
            {company?.email   && <div>{company.email}</div>}
          </div>
        </div>

        {/* STR / NTN */}
        <div style={s.regBox}>
          {company?.str_number && <span><b>STR#:</b> {company.str_number}&nbsp;&nbsp;&nbsp;</span>}
          {company?.ntn_number && <span><b>NTN#:</b> {company.ntn_number}</span>}
        </div>

        {/* Title */}
        <div style={s.bigTitle}>Sales Tax Invoice</div>

        {/* Buyer */}
        <div style={s.buyerSection}>
          <div style={s.buyerLeft}>
            <div><span style={s.label}>Buyer's Name: </span>{inv.customer_name || '—'}</div>
            <div><span style={s.label}>Address: </span>{inv.customer_address || '—'}</div>
            <div>
              <span style={s.label}>ST. Registration #: </span>{inv.customer_str || '—'}
              &nbsp;&nbsp;&nbsp;
              <span style={s.label}>NTN: </span>{inv.customer_ntn || '—'}
            </div>
          </div>
          <div style={s.buyerRight}>
            <div><span style={s.label}>Invoice No: </span>{inv.invoice_no || '—'}</div>
            <div><span style={s.label}>Date: </span>{fmtDate(inv.date)}</div>
            {hasFbr && <div><span style={s.label}>IRN: </span>{inv.fbr_irn}</div>}
          </div>
        </div>

        {/* Items Table */}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, textAlign: 'left', width: '28%' }}>Description of Goods</th>
              <th style={{ ...s.th, width: '11%' }}>H.S Code</th>
              <th style={{ ...s.th, width: '10%' }}>Qty Mtr/Yds</th>
              <th style={{ ...s.th, width: '12%' }}>Value Excl. ST</th>
              <th style={{ ...s.th, width: '9%' }}>Rate of ST</th>
              <th style={{ ...s.th, width: '12%' }}>Sales Tax</th>
              <th style={{ ...s.th, width: '14%' }}>Value Incl. ST</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ ...s.td, textAlign: 'center', color: '#888' }}>No items</td></tr>
            ) : items.map((item, i) => (
              <tr key={item.id || i}>
                <td style={s.td}>{item.description}</td>
                <td style={s.tdC}>{item.pct_code_display || item.pct_code || '—'}</td>
                <td style={s.tdR}>{numFmt(item.quantity, 0)}</td>
                <td style={s.tdR}>{numFmt(item.value_excl_tax, 0)}</td>
                <td style={s.tdC}>{item.sales_tax_rate != null ? `${item.sales_tax_rate}%` : '—'}</td>
                <td style={s.tdR}>{numFmt(item.sales_tax_amount, 0)}</td>
                <td style={s.tdR}>{numFmt(item.value_incl_tax, 0)}</td>
              </tr>
            ))}
            <tr style={s.totalRow}>
              <td colSpan={2} style={{ ...s.td, fontWeight: 'bold', textAlign: 'right' }}>Grand Total:</td>
              <td style={{ ...s.tdR, fontWeight: 'bold' }}>{numFmt(totals.qty, 0)}</td>
              <td style={{ ...s.tdR, fontWeight: 'bold' }}>{numFmt(totals.excl, 0)}</td>
              <td style={s.tdC} />
              <td style={{ ...s.tdR, fontWeight: 'bold' }}>{numFmt(totals.tax, 0)}</td>
              <td style={{ ...s.tdR, fontWeight: 'bold' }}>{numFmt(totals.incl, 0)}</td>
            </tr>
          </tbody>
        </table>

        {inv.notes && (
          <div style={{ marginTop: '10px', fontSize: '9pt', color: '#444' }}>
            <b>Notes:</b> {inv.notes}
          </div>
        )}

        {/* FBR verification block — only prints when IRN is present */}
        {hasFbr && (
          <div style={s.fbrBox}>
            <div style={s.fbrLeft}>
              <div><b>FBR Verified Invoice</b></div>
              <div><b>Invoice Reference Number (IRN):</b> {inv.fbr_irn}</div>
              <div style={{ fontSize: '8pt', color: '#555', marginTop: '2px' }}>
                Verify this invoice at: <span style={{ color: '#1a5ccc' }}>https://iris.fbr.gov.pk</span>
              </div>
            </div>
            {inv.fbr_qr_code && (
              <div style={{ textAlign: 'center' }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(inv.fbr_qr_code)}`}
                  alt="FBR QR Code"
                  style={{ width: '80px', height: '80px' }}
                />
                <div style={{ fontSize: '7pt', color: '#777', marginTop: '2px' }}>Scan to verify</div>
              </div>
            )}
          </div>
        )}

        {/* Signature */}
        <div style={s.signatureSection}>
          <div style={s.signatureBox}>
            <div style={s.signatureLine}>
              <div>Signature</div>
              <div style={{ fontWeight: 'bold', marginTop: '4px' }}>{company?.name || ''}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
