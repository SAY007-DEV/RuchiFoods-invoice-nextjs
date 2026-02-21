import { useState } from 'react';
import { useStore, type Customer } from '@/store/useStore';
import { formatDate } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, Users, Download } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

export default function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', gstId: '' });

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', address: '', gstId: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, address: c.address, gstId: c.gstId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (editing) {
      updateCustomer(editing.id, form);
      toast.success('Customer updated');
    } else {
      addCustomer(form);
      toast.success('Customer added');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCustomer(id);
    toast.success('Customer deleted');
  };

  const handleExport = () => {
    const data = filtered.map((c) => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Address: c.address,
      'GST/Tax ID': c.gstId,
      Created: formatDate(c.createdAt),
    }));
    exportToExcel(data, 'customers');
    toast.success('Exported to Excel');
  };

  return (
    <div>
      <div className="page-header flex-col sm:flex-row gap-3">
        <h1 className="page-title">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Add Customer</Button>
        </div>
      </div>

      <div className="stat-card mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No customers" description="Add your first customer to get started." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Email</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Phone</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden lg:table-cell">Created</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium text-foreground">{c.name}</td>
                      <td className="py-3 px-2 text-muted-foreground">{c.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">{c.phone}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary mr-2"><Pencil className="w-4 h-4 inline" /></button>
                        <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {c.phone && <p className="text-sm text-muted-foreground">{c.phone}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="Billing Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="GST / Tax ID" value={form.gstId} onChange={(e) => setForm({ ...form, gstId: e.target.value })} />
            <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Add'} Customer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
