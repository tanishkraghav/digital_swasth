import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Minus, Plus, Package, AlertTriangle } from 'lucide-react';
import { AshaLayout } from '@/components/AshaLayout';
import { Card } from '@/components/ui/card';
import { useAsha } from '@/lib/ashaStore';
import { useToast } from '@/hooks/use-toast';

const AshaStock = () => {
  const navigate = useNavigate();
  const { stock, adjustStock } = useAsha();
  const { toast } = useToast();

  const lowCount = stock.filter((s) => s.count <= s.threshold).length;

  return (
    <AshaLayout>
      <header className="px-5 pt-6 pb-3 flex items-center gap-2">
        <button onClick={() => navigate('/asha/home')} className="text-muted-foreground" aria-label="Back">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Stock register</h1>
          <p className="text-xs text-muted-foreground">{lowCount > 0 ? `${lowCount} item${lowCount > 1 ? 's' : ''} low` : 'All items in stock'}</p>
        </div>
        <Package className="w-5 h-5 text-muted-foreground" />
      </header>

      <div className="px-5 space-y-2.5 pb-6">
        {stock.map((s) => {
          const low = s.count <= s.threshold;
          return (
            <Card key={s.id} className={`p-4 border-border ${low ? 'border-warning/40 bg-warning-soft/40' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Threshold: {s.threshold}
                    {low && (
                      <span className="ml-2 inline-flex items-center gap-1 text-warning font-medium">
                        <AlertTriangle className="w-3 h-3" /> Low stock
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustStock(s.id, -1)}
                    disabled={s.count === 0}
                    className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center disabled:opacity-40 active:scale-95"
                    aria-label="Decrease"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-bold w-12 text-center tabular-nums">{s.count}</span>
                  <button
                    onClick={() => { adjustStock(s.id, 1); if (s.count + 1 === s.threshold + 1 && low) toast({ title: `${s.label} restocked` }); }}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-95"
                    aria-label="Increase"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AshaLayout>
  );
};

export default AshaStock;
