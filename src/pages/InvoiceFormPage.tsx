import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, type InvoiceItem, type InvoiceStatus } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/format';

const emptyItem = (): InvoiceItem => ({
  productId: '', name: '', quantity: 1, price: 0, discount: 0, taxPercent: 18,
});

export default function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customers, products, invoices, addInvoice, updateInvoice } = useStore();
  const existing = id ? invoices.find((i) => i.id === id) : null;

  const [customerId, setCustomerId] = useState(existing?.customerId ?? '');
  const [items, setItems] = useState<InvoiceItem[]>(existing?.items?.length ? existing.items : [emptyItem()]);
  const [status, setStatus] = useState<InvoiceStatus>(existing?.status ?? 'draft');
  const [dueDate, setDueDate] = useState(existing?.dueDate ?? new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [notes, setNotes] = useState(existing?.notes ?? '');

  const updateItem = (idx: number, changes: Partial<InvoiceItem>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...changes } : item)));
  };

  const selectProduct = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    if (p) updateItem(idx, { productId: p.id, name: p.name, price: p.price, taxPercent: p.taxPercent });
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((s, item) => {
    const line = item.quantity * item.price;
    return s + line - (line * item.discount / 100);
  }, 0);

  const tax = items.reduce((s, item) => {
    const line = item.quantity * item.price;
    const afterDiscount = line - (line * item.discount / 100);
    return s + (afterDiscount * item.taxPercent / 100);
  }, 0);

  const handleSave = () => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) { toast.error('Select a customer'); return; }
    if (items.some((i) => !i.name || i.quantity <= 0)) { toast.error('Fill all item details'); return; }

    const data = {
      customerId,
      customerName: customer.name,
      items,
      status,
      dueDate,
      notes,
    };

    if (existing) {
      updateInvoice(existing.id, data);
      toast.success('Invoice updated');
    } else {
      addInvoice(data);
      toast.success('Invoice created');
    }
    navigate('/invoices');
  };

  return (
    <div className="max-w-4xl">
      <div className="page-header flex-col sm:flex-row gap-3">
        <h1 className="page-title">{existing ? `Edit ${existing.invoiceNumber}` : 'New Invoice'}</h1>
      </div>

      <div className="stat-card space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Customer *</label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as InvoiceStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['draft', 'sent', 'paid', 'overdue'].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 md:col-span-1">
            <label className="text-sm font-medium text-foreground mb-1 block">Due Date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Items</h3>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-border p-3 sm:p-0 sm:border-0">
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  <div className="col-span-2 sm:col-span-4">
                    {idx === 0 && <label className="text-xs text-muted-foreground mb-1 block">Product</label>}
                    <Select value={item.productId} onValueChange={(v) => selectProduct(idx, v)}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    {idx === 0 && <label className="text-xs text-muted-foreground mb-1 block hidden sm:block">Qty</label>}
                    <Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 0 })} placeholder="Qty" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    {idx === 0 && <label className="text-xs text-muted-foreground mb-1 block hidden sm:block">Price</label>}
                    <Input type="number" value={item.price} onChange={(e) => updateItem(idx, { price: parseFloat(e.target.value) || 0 })} placeholder="Price" />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    {idx === 0 && <label className="text-xs text-muted-foreground mb-1 block hidden sm:block">Disc %</label>}
                    <Input type="number" value={item.discount} onChange={(e) => updateItem(idx, { discount: parseFloat(e.target.value) || 0 })} placeholder="Disc %" />
                  </div>
                  <div className="col-span-1 sm:col-span-1">
                    {idx === 0 && <label className="text-xs text-muted-foreground mb-1 block hidden sm:block">Tax%</label>}
                    <Input type="number" value={item.taxPercent} onChange={(e) => updateItem(idx, { taxPercent: parseFloat(e.target.value) || 0 })} placeholder="Tax%" />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex justify-end">
                    <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setItems([...items, emptyItem()])}>
            <Plus className="w-4 h-4 mr-1" />Add Item
          </Button>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-4 border-t border-border">
          <div className="space-y-1 text-sm">
            <div className="text-muted-foreground">Subtotal: <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span></div>
            <div className="text-muted-foreground">Tax: <span className="font-medium text-foreground">{formatCurrency(tax)}</span></div>
            <div className="text-lg font-bold text-foreground">Total: {formatCurrency(subtotal + tax)}</div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => navigate('/invoices')}>Cancel</Button>
            <Button className="flex-1 sm:flex-none" onClick={handleSave}>Save Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
