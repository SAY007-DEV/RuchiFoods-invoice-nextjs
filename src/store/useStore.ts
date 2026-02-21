import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  taxPercent: number;
  sku: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  discount: number;
  taxPercent: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  dueDate: string;
  createdAt: string;
  notes: string;
}

interface AppState {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  nextInvoiceNum: number;
  addCustomer: (c: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addInvoice: (inv: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => void;
  updateInvoice: (id: string, inv: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const sampleCustomers: Customer[] = [
  { id: 'c1', name: 'Acme Corp', email: 'billing@acme.com', phone: '+1-555-0101', address: '123 Business Ave, NY 10001', gstId: 'GST001', createdAt: '2024-01-15' },
  { id: 'c2', name: 'TechStart Inc', email: 'accounts@techstart.io', phone: '+1-555-0202', address: '456 Innovation Blvd, SF 94105', gstId: 'GST002', createdAt: '2024-02-10' },
  { id: 'c3', name: 'Global Services LLC', email: 'finance@globalsvcs.com', phone: '+1-555-0303', address: '789 Enterprise Dr, Chicago 60601', gstId: 'GST003', createdAt: '2024-03-05' },
];

const sampleProducts: Product[] = [
  { id: 'p1', name: 'Web Development', description: 'Full-stack web development services', price: 150, taxPercent: 18, sku: 'SVC-WEB' },
  { id: 'p2', name: 'UI/UX Design', description: 'User interface and experience design', price: 120, taxPercent: 18, sku: 'SVC-UX' },
  { id: 'p3', name: 'Cloud Hosting', description: 'Monthly cloud hosting package', price: 49.99, taxPercent: 18, sku: 'SVC-HOST' },
  { id: 'p4', name: 'SEO Optimization', description: 'Search engine optimization package', price: 200, taxPercent: 18, sku: 'SVC-SEO' },
];

const sampleInvoices: Invoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-001', customerId: 'c1', customerName: 'Acme Corp',
    items: [
      { productId: 'p1', name: 'Web Development', quantity: 40, price: 150, discount: 0, taxPercent: 18 },
      { productId: 'p3', name: 'Cloud Hosting', quantity: 12, price: 49.99, discount: 10, taxPercent: 18 },
    ],
    status: 'paid', dueDate: '2025-01-30', createdAt: '2025-01-01', notes: '',
  },
  {
    id: 'inv2', invoiceNumber: 'INV-002', customerId: 'c2', customerName: 'TechStart Inc',
    items: [
      { productId: 'p2', name: 'UI/UX Design', quantity: 20, price: 120, discount: 5, taxPercent: 18 },
    ],
    status: 'sent', dueDate: '2025-02-28', createdAt: '2025-02-05', notes: 'Net 30',
  },
  {
    id: 'inv3', invoiceNumber: 'INV-003', customerId: 'c3', customerName: 'Global Services LLC',
    items: [
      { productId: 'p4', name: 'SEO Optimization', quantity: 3, price: 200, discount: 0, taxPercent: 18 },
      { productId: 'p1', name: 'Web Development', quantity: 10, price: 150, discount: 0, taxPercent: 18 },
    ],
    status: 'overdue', dueDate: '2025-01-15', createdAt: '2024-12-15', notes: '',
  },
  {
    id: 'inv4', invoiceNumber: 'INV-004', customerId: 'c1', customerName: 'Acme Corp',
    items: [
      { productId: 'p2', name: 'UI/UX Design', quantity: 15, price: 120, discount: 0, taxPercent: 18 },
    ],
    status: 'draft', dueDate: '2025-03-15', createdAt: '2025-02-20', notes: 'Draft pending review',
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: sampleCustomers,
      products: sampleProducts,
      invoices: sampleInvoices,
      nextInvoiceNum: 5,

      addCustomer: (c) => set((s) => ({
        customers: [...s.customers, { ...c, id: uid(), createdAt: new Date().toISOString().slice(0, 10) }],
      })),
      updateCustomer: (id, c) => set((s) => ({
        customers: s.customers.map((x) => (x.id === id ? { ...x, ...c } : x)),
      })),
      deleteCustomer: (id) => set((s) => ({
        customers: s.customers.filter((x) => x.id !== id),
      })),

      addProduct: (p) => set((s) => ({
        products: [...s.products, { ...p, id: uid() }],
      })),
      updateProduct: (id, p) => set((s) => ({
        products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)),
      })),
      deleteProduct: (id) => set((s) => ({
        products: s.products.filter((x) => x.id !== id),
      })),

      addInvoice: (inv) => {
        const num = get().nextInvoiceNum;
        set((s) => ({
          invoices: [...s.invoices, { ...inv, id: uid(), invoiceNumber: `INV-${String(num).padStart(3, '0')}`, createdAt: new Date().toISOString().slice(0, 10) }],
          nextInvoiceNum: num + 1,
        }));
      },
      updateInvoice: (id, inv) => set((s) => ({
        invoices: s.invoices.map((x) => (x.id === id ? { ...x, ...inv } : x)),
      })),
      deleteInvoice: (id) => set((s) => ({
        invoices: s.invoices.filter((x) => x.id !== id),
      })),
    }),
    { name: 'invoice-app-store' }
  )
);

// Utility functions
export function calcInvoiceSubtotal(items: InvoiceItem[]) {
  return items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.price;
    const afterDiscount = lineTotal - (lineTotal * item.discount / 100);
    return sum + afterDiscount;
  }, 0);
}

export function calcInvoiceTax(items: InvoiceItem[]) {
  return items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.price;
    const afterDiscount = lineTotal - (lineTotal * item.discount / 100);
    return sum + (afterDiscount * item.taxPercent / 100);
  }, 0);
}

export function calcInvoiceTotal(items: InvoiceItem[]) {
  return calcInvoiceSubtotal(items) + calcInvoiceTax(items);
}
