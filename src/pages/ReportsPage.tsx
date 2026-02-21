import { useMemo } from 'react';
import { useStore, calcInvoiceTotal, calcInvoiceTax } from '@/store/useStore';
import { formatCurrency } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function ReportsPage() {
  const invoices = useStore((s) => s.invoices);

  const monthlyData = useMemo(() => {
    const months: Record<string, { revenue: number; count: number; tax: number }> = {};
    invoices.forEach((inv) => {
      const m = inv.createdAt.slice(0, 7);
      if (!months[m]) months[m] = { revenue: 0, count: 0, tax: 0 };
      months[m].revenue += calcInvoiceTotal(inv.items);
      months[m].tax += calcInvoiceTax(inv.items);
      months[m].count++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        ...d,
      }));
  }, [invoices]);

  const totals = useMemo(() => {
    return {
      revenue: invoices.reduce((s, i) => s + calcInvoiceTotal(i.items), 0),
      tax: invoices.reduce((s, i) => s + calcInvoiceTax(i.items), 0),
      count: invoices.length,
      paid: invoices.filter((i) => i.status === 'paid').length,
      unpaid: invoices.filter((i) => i.status !== 'paid').length,
    };
  }, [invoices]);

  const handleExport = () => {
    const data = monthlyData.map((m) => ({
      Month: m.month,
      Invoices: m.count,
      Revenue: m.revenue,
      Tax: m.tax,
    }));
    exportToExcel(data, 'monthly-report');
    toast.success('Exported to Excel');
  };

  return (
    <div>
      <div className="page-header flex-col sm:flex-row gap-3">
        <h1 className="page-title">Reports</h1>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export Report</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total Tax Collected</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totals.tax)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Invoices</p>
          <p className="text-2xl font-bold text-foreground">{totals.count} <span className="text-sm font-normal text-muted-foreground">({totals.paid} paid, {totals.unpaid} unpaid)</span></p>
        </div>
      </div>

      <div className="stat-card mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Monthly Revenue Breakdown</h2>
        <div className="h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tax" name="Tax" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="stat-card">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Monthly Summary</h2>
        {/* Desktop table */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Month</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Invoices</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Revenue</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Tax</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((m) => (
                <tr key={m.month} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium text-foreground">{m.month}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{m.count}</td>
                  <td className="py-3 px-2 text-right font-medium text-foreground">{formatCurrency(m.revenue)}</td>
                  <td className="py-3 px-2 text-right text-muted-foreground">{formatCurrency(m.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {monthlyData.map((m) => (
            <div key={m.month} className="rounded-lg border border-border p-3">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-foreground">{m.month}</span>
                <span className="text-xs text-muted-foreground">{m.count} invoices</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue: <span className="font-medium text-foreground">{formatCurrency(m.revenue)}</span></span>
                <span className="text-muted-foreground">Tax: {formatCurrency(m.tax)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
