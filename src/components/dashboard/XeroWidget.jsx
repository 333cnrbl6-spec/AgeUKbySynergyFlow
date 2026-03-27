import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function XeroWidget() {
  return (
    <div className="bg-card rounded-xl p-5 shadow-sm border border-border/50 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold italic" style={{ backgroundColor: "#13B5EA" }}>x</div>
          <div>
            <h2 className="font-heading font-semibold text-base leading-tight">Xero Integration</h2>
            <p className="text-xs text-muted-foreground">Accounting sync</p>
          </div>
        </div>
        <Link to="/xero">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            Open <ArrowRight className="w-3 h-3" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {[
          { label: "PO Matching", desc: "Match invoices to purchase orders", ok: true },
          { label: "Grant Spend Sync", desc: "Sync tracked expenses to grants", ok: true },
          { label: "Supplier Ledger", desc: "Reconcile outstanding bills", ok: false },
        ].map(item => (
          <div key={item.label} className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
            {item.ok
              ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />}
            <div>
              <p className="text-xs font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/xero" className="w-full">
        <Button variant="outline" size="sm" className="w-full gap-2 text-xs" style={{ borderColor: "#13B5EA", color: "#13B5EA" }}>
          <RefreshCw className="w-3 h-3" /> Run Sync
        </Button>
      </Link>
    </div>
  );
}