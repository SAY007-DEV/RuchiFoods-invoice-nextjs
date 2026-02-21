import { useState } from 'react';
import { useStore, type Product } from '@/store/useStore';
import { formatCurrency } from '@/utils/format';
import { exportToExcel } from '@/utils/exportExcel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Pencil, Trash2, Package, Download } from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', taxPercent: '18', sku: '' });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', taxPercent: '18', sku: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description, price: String(p.price), taxPercent: String(p.taxPercent), sku: p.sku });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price) {
      toast.error('Name and price are required');
      return;
    }
    const data = { name: form.name, description: form.description, price: parseFloat(form.price), taxPercent: parseFloat(form.taxPercent) || 0, sku: form.sku };
    if (editing) {
      updateProduct(editing.id, data);
      toast.success('Product updated');
    } else {
      addProduct(data);
      toast.success('Product added');
    }
    setDialogOpen(false);
  };

  const handleExport = () => {
    const data = filtered.map((p) => ({
      Name: p.name,
      Description: p.description,
      SKU: p.sku,
      Price: p.price,
      'Tax %': p.taxPercent,
    }));
    exportToExcel(data, 'products');
    toast.success('Exported to Excel');
  };

  return (
    <div>
      <div className="page-header flex-col sm:flex-row gap-3">
        <h1 className="page-title">Products & Services</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="w-4 h-4 mr-1" />Export</Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-1" />Add Product</Button>
        </div>
      </div>

      <div className="stat-card mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No products" description="Add your first product or service." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Name</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">SKU</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Price</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Tax %</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="font-medium text-foreground">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.description}</div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{p.sku}</td>
                      <td className="py-3 px-2 text-right font-medium text-foreground">{formatCurrency(p.price)}</td>
                      <td className="py-3 px-2 text-right text-muted-foreground">{p.taxPercent}%</td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary mr-2"><Pencil className="w-4 h-4 inline" /></button>
                        <button onClick={() => { deleteProduct(p.id); toast.success('Deleted'); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { deleteProduct(p.id); toast.success('Deleted'); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">{p.sku}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(p.price)} <span className="text-xs text-muted-foreground font-normal">+{p.taxPercent}%</span></span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Price *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              <Input placeholder="Tax %" type="number" value={form.taxPercent} onChange={(e) => setForm({ ...form, taxPercent: e.target.value })} />
            </div>
            <Input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Button onClick={handleSave} className="w-full">{editing ? 'Update' : 'Add'} Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
