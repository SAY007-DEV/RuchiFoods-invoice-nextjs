import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore, calcInvoiceSubtotal, calcInvoiceTax, calcInvoiceTotal } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';
import { Printer, Pencil, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, customers, updateInvoice } = useStore();
  const inv = invoices.find((i) => i.id === id);
  const customer = inv ? customers.find((c) => c.id === inv.customerId) : null;

  if (!inv) return <div className="text-center py-16 text-muted-foreground">Invoice not found.</div>;

  const handlePrint = () => window.print();

  const markPaid = () => {
    updateInvoice(inv.id, { status: 'paid' });
    toast.success('Marked as paid');
  };

  return (
    <div>
      <div className="page-header no-print flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/invoices')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="page-title text-lg sm:text-2xl">{inv.invoiceNumber}</h1>
          <StatusBadge status={inv.status} />
        </div>
        <div className="flex gap-2 flex-wrap">
          {inv.status !== 'paid' && (
            <Button variant="outline" size="sm" onClick={markPaid}><CheckCircle className="w-4 h-4 mr-1" />Mark Paid</Button>
          )}
          <Link to={`/invoices/${inv.id}/edit`}><Button variant="outline" size="sm"><Pencil className="w-4 h-4 mr-1" />Edit</Button></Link>
          <Button size="sm" onClick={handlePrint}><Printer className="w-4 h-4 mr-1" />Print</Button>
        </div>
      </div>

      <div className="stat-card max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-primary mb-1">InvoiceApp</h2>
            <p className="text-xs text-muted-foreground">123 Business Street<br />New York, NY 10001</p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{inv.invoiceNumber}</h2>
            <p className="text-sm text-muted-foreground">Date: {formatDate(inv.createdAt)}</p>
            <p className="text-sm text-muted-foreground">Due: {formatDate(inv.dueDate)}</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Bill To</p>
          <p className="font-semibold text-foreground">{inv.customerName}</p>
          {customer && (
            <>
              <p className="text-sm text-muted-foreground">{customer.email}</p>
              <p className="text-sm text-muted-foreground">{customer.address}</p>
              {customer.gstId && <p className="text-sm text-muted-foreground">GST: {customer.gstId}</p>}
            </>
          )}
        </div>

        {/* Items - Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Item</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Qty</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Price</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Disc</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Tax</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => {
                const line = item.quantity * item.price;
                const afterDisc = line - (line * item.discount / 100);
                const total = afterDisc + (afterDisc * item.taxPercent / 100);
                return (
                  <tr key={i} className="border-b border-border">
                    <td className="py-2 px-3 text-foreground">{item.name}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{item.discount}%</td>
                    <td className="py-2 px-3 text-right text-muted-foreground">{item.taxPercent}%</td>
                    <td className="py-2 px-3 text-right font-medium text-foreground">{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Items - Mobile cards */}
        <div className="sm:hidden space-y-3 mb-6">
          {inv.items.map((item, i) => {
            const line = item.quantity * item.price;
            const afterDisc = line - (line * item.discount / 100);
            const total = afterDisc + (afterDisc * item.taxPercent / 100);
            return (
              <div key={i} className="rounded-lg border border-border p-3">
                <p className="font-medium text-foreground mb-1">{item.name}</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  <span>Qty: {item.quantity}</span>
                  <span>Price: {formatCurrency(item.price)}</span>
                  <span>Disc: {item.discount}%</span>
                  <span>Tax: {item.taxPercent}%</span>
                </div>
                <p className="text-right font-semibold text-foreground mt-1">{formatCurrency(total)}</p>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatCurrency(calcInvoiceSubtotal(inv.items))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-foreground">{formatCurrency(calcInvoiceTax(inv.items))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span className="text-foreground">Total</span>
              <span className="text-primary">{formatCurrency(calcInvoiceTotal(inv.items))}</span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-muted-foreground">{inv.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
