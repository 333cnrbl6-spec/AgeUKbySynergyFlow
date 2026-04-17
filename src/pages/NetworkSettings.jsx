import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network, Wifi, WifiOff, AlertCircle, CheckCircle2, RefreshCw, Send, Info } from "lucide-react";
import { format } from "date-fns";

const STATUS_CONFIG = {
  connected:    { icon: CheckCircle2, colour: "text-green-600",  bg: "bg-green-50 border-green-200",  label: "Connected" },
  disconnected: { icon: WifiOff,      colour: "text-slate-400",  bg: "bg-slate-50 border-slate-200",  label: "Not Connected" },
  error:        { icon: AlertCircle,  colour: "text-red-600",    bg: "bg-red-50 border-red-200",      label: "Connection Error" },
};

const EMPTY = {
  branch_name: "Age UK Bury",
  branch_id: "bury",
  hub_api_url: "",
  hub_api_key: "",
  auto_sync_enabled: false,
  connection_status: "disconnected",
};

export default function NetworkSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [configId, setConfigId] = useState(null);
  const [pinging, setPinging] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [actionResult, setActionResult] = useState(null);

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["networkConfig"],
    queryFn: () => base44.entities.NetworkConfig.list(),
  });

  useEffect(() => {
    if (configs.length > 0) {
      const c = configs[0];
      setConfigId(c.id);
      setForm({
        branch_name: c.branch_name || "Age UK Bury",
        branch_id: c.branch_id || "bury",
        hub_api_url: c.hub_api_url || "",
        hub_api_key: c.hub_api_key || "",
        auto_sync_enabled: c.auto_sync_enabled || false,
        connection_status: c.connection_status || "disconnected",
        last_sync_date: c.last_sync_date,
        last_sync_result: c.last_sync_result,
      });
    }
  }, [configs]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (configId) {
        return base44.entities.NetworkConfig.update(configId, data);
      } else {
        return base44.entities.NetworkConfig.create(data);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["networkConfig"] });
      setActionResult({ type: "success", message: "Settings saved." });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(form);
  };

  const handlePing = async () => {
    setPinging(true);
    setActionResult(null);
    const res = await base44.functions.invoke("networkPing", {});
    setPinging(false);
    qc.invalidateQueries({ queryKey: ["networkConfig"] });
    if (res.data?.connected) {
      setActionResult({ type: "success", message: "Hub is reachable — connection confirmed." });
    } else {
      setActionResult({ type: "error", message: res.data?.error || "Could not reach the Hub. Check the URL and API key." });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setActionResult(null);
    const res = await base44.functions.invoke("networkSync", {});
    setSyncing(false);
    qc.invalidateQueries({ queryKey: ["networkConfig"] });
    if (res.data?.success) {
      setActionResult({ type: "success", message: `Sync complete. ${Object.keys(res.data.stats_sent || {}).length} metrics sent to Hub.` });
    } else {
      setActionResult({ type: "error", message: res.data?.error || res.data?.message || "Sync failed." });
    }
  };

  const status = form.connection_status || "disconnected";
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;
  const StatusIcon = statusCfg.icon;

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" />
          Network Connector
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect this branch to the Age UK Network Hub to share anonymised statistics. No client data is ever shared.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl border p-4 flex items-start gap-3 ${statusCfg.bg}`}>
        <StatusIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${statusCfg.colour}`} />
        <div className="flex-1">
          <p className={`font-semibold text-sm ${statusCfg.colour}`}>
            {statusCfg.label}
          </p>
          {form.last_sync_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last sync: {format(new Date(form.last_sync_date), "dd MMM yyyy HH:mm")}
              {form.last_sync_result && ` — ${form.last_sync_result}`}
            </p>
          )}
          {!form.last_sync_date && (
            <p className="text-xs text-muted-foreground mt-0.5">Never synced — configure the Hub URL and API key below.</p>
          )}
        </div>
        <Badge variant="outline" className={`text-xs ${statusCfg.colour}`}>{statusCfg.label}</Badge>
      </div>

      {/* Action Result */}
      {actionResult && (
        <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
          actionResult.type === "success" ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
        }`}>
          {actionResult.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {actionResult.message}
        </div>
      )}

      {/* Branch Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branch Identity</CardTitle>
          <CardDescription>How this branch appears on the Network Hub.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Branch Name</Label>
              <Input value={form.branch_name} onChange={e => setForm(f => ({ ...f, branch_name: e.target.value }))} placeholder="Age UK Bury" />
            </div>
            <div>
              <Label>Branch ID</Label>
              <Input value={form.branch_id} onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))} placeholder="bury" />
              <p className="text-xs text-muted-foreground mt-1">Lowercase, no spaces. e.g. "bury" or "bolton"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hub Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hub Connection</CardTitle>
          <CardDescription>The Hub URL and API key are provided by your Network Hub administrator.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Hub API URL</Label>
            <Input
              value={form.hub_api_url}
              onChange={e => setForm(f => ({ ...f, hub_api_url: e.target.value }))}
              placeholder="https://your-hub-app.base44.app/api/functions/hubReceive"
            />
          </div>
          <div>
            <Label>Hub API Key</Label>
            <Input
              type="password"
              value={form.hub_api_key}
              onChange={e => setForm(f => ({ ...f, hub_api_key: e.target.value }))}
              placeholder="Paste the key provided by the Hub"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch
              checked={form.auto_sync_enabled}
              onCheckedChange={v => setForm(f => ({ ...f, auto_sync_enabled: v }))}
            />
            <div>
              <Label className="cursor-pointer">Auto-sync monthly stats</Label>
              <p className="text-xs text-muted-foreground">Automatically push anonymised stats to the Hub on the 1st of each month.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What gets shared */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Info className="w-4 h-4 text-blue-600" /> What is shared with the Hub?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Only anonymised aggregate statistics are ever sent. No names, addresses, or personal client data.</p>
          <div className="grid grid-cols-2 gap-1 text-sm text-slate-700">
            {[
              "Total active clients (count only)",
              "New clients this month (count only)",
              "Clients with dementia support (count)",
              "Isolated clients (count)",
              "Jobs active / completed (counts)",
              "Revenue collected (£ total)",
              "Referrals received (count)",
              "Active grants & funding total",
              "Staff & volunteer headcount",
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="text-xs">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
        <Button variant="outline" onClick={handlePing} disabled={pinging || !form.hub_api_url}>
          <Wifi className="w-4 h-4 mr-1" />
          {pinging ? "Testing..." : "Test Connection"}
        </Button>
        <Button variant="outline" onClick={handleSync} disabled={syncing || status !== "connected"}>
          <Send className="w-4 h-4 mr-1" />
          {syncing ? "Syncing..." : "Push Stats to Hub Now"}
        </Button>
      </div>
    </div>
  );
}