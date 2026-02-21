import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore, calcInvoiceTotal } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, FileText, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoicesListPage() {
  const { invoices, deleteInvoice } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = invoices
    .filter((inv) => statusFilter === 'all' || inv.status === statusFilter)
    .filter((inv) =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const handleExport = () => {
    const data = filtered.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      Customer: inv.customerName,
      Date: formatDate(inv.createdAt),
      'Due Date': formatDate(inv.dueDate),
      Status: inv.status,
      Amount: calcInvoiceTotal(inv.items),
    }));
    exportToExcel(data, 'invoices');
    toast.success('Exported to Excel');
  };

  return (
    <div>
      <div className="page-header flex-col sm:flex-row gap-3">
        <h1 className="page-title">Invoices</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Link to="/invoices/new"><Button size="sm"><Plus className="w-4 h-4 mr-1" />New Invoice</Button></Link>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {['all', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                  statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices" description="Create your first invoice." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Invoice #</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Customer</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Due Date</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">
                        <Link to={`/invoices/${inv.id}`} className="text-primary hover:underline">{inv.invoiceNumber}</Link>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{inv.customerName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                      <td className="py-3 px-2 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-2"><StatusBadge status={inv.status} /></td>
                      <td className="py-3 px-2 text-right font-medium text-foreground">{formatCurrency(calcInvoiceTotal(inv.items))}</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => { deleteInvoice(inv.id); toast.success('Deleted'); }} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((inv) => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} className="block rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-primary">{inv.invoiceNumber}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{inv.customerName}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(inv.createdAt)}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(calcInvoiceTotal(inv.items))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
