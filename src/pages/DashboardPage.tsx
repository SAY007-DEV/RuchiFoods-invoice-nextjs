import { useMemo } from 'react';
import { useStore, calcInvoiceTotal } from '@/store/useStore';
import { formatCurrency, formatDate } from '@/utils/format';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import { DollarSign, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const PIE_COLORS = [
  'hsl(220, 10%, 70%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(0, 72%, 51%)',
];

export default function DashboardPage() {
  const invoices = useStore((s) => s.invoices);

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((s, inv) => s + calcInvoiceTotal(inv.items), 0);
    const paid = invoices.filter((i) => i.status === 'paid');
    const unpaid = invoices.filter((i) => i.status === 'sent' || i.status === 'draft');
    const overdue = invoices.filter((i) => i.status === 'overdue');
    return {
      totalRevenue,
      paidTotal: paid.reduce((s, i) => s + calcInvoiceTotal(i.items), 0),
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
    };
  }, [invoices]);

  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    invoices.forEach((inv) => {
      const m = inv.createdAt.slice(0, 7);
      months[m] = (months[m] || 0) + calcInvoiceTotal(inv.items);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue,
      }));
  }, [invoices]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = { draft: 0, sent: 0, paid: 0, overdue: 0 };
    invoices.forEach((inv) => { counts[inv.status]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} color="primary" />
        <StatCard title="Paid" value={formatCurrency(stats.paidTotal)} icon={CheckCircle} color="success" />
        <StatCard title="Unpaid Invoices" value={String(stats.unpaidCount)} icon={Clock} color="warning" />
        <StatCard title="Overdue" value={String(stats.overdueCount)} icon={AlertTriangle} color="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="lg:col-span-2 stat-card">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Monthly Revenue</h2>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stat-card">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Invoice Status</h2>
          <div className="h-52 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Invoices</h2>
          <Link to="/invoices" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {/* Desktop table */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Invoice</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Date</th>
                <th className="text-left py-3 px-2 text-muted-foreground font-medium">Status</th>
                <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(-5).reverse().map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2 font-medium text-foreground">
                    <Link to={`/invoices/${inv.id}`} className="hover:text-primary">{inv.invoiceNumber}</Link>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{inv.customerName}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">{formatDate(inv.createdAt)}</td>
                  <td className="py-3 px-2"><StatusBadge status={inv.status} /></td>
                  <td className="py-3 px-2 text-right font-medium text-foreground">{formatCurrency(calcInvoiceTotal(inv.items))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {invoices.slice(-5).reverse().map((inv) => (
            <Link key={inv.id} to={`/invoices/${inv.id}`} className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground">{inv.invoiceNumber}</span>
                <StatusBadge status={inv.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{inv.customerName}</span>
                <span className="font-semibold text-foreground">{formatCurrency(calcInvoiceTotal(inv.items))}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
