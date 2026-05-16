import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: string;
  before: unknown;
  after: unknown;
  note?: string | null;
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-xs text-muted-foreground italic">—</p>;
  }
  return (
    <pre className="text-xs bg-slate-50 rounded p-3 overflow-auto max-h-64 whitespace-pre-wrap break-all">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AuditDiffDialog({ open, onOpenChange, action, before, after, note }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diff: {action}</DialogTitle>
        </DialogHeader>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">До</p>
            <JsonBlock value={before} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase">После</p>
            <JsonBlock value={after} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
