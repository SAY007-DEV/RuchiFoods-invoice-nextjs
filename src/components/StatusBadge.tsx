import type { InvoiceStatus } from '@/store/useStore';

const styles: Record<InvoiceStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-info/10 text-info',
  paid: 'bg-success/10 text-success',
  overdue: 'bg-destructive/10 text-destructive',
};

export default function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}
