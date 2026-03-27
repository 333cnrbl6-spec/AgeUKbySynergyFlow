import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle2, XCircle, ExternalLink, AlertTriangle, ArrowRightLeft, FileText, TrendingUp, Building2 } from 'lucide-react';

// Xero brand colour
const XERO_BLUE = '#13B5EA';

function XeroLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#13B5EA" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="Arial">x</text>
    </svg>
  );
}

export default function XeroIntegration() {
  const [configured, setConfigured] = useState(null); // null=loading, true/false
  const [connected, setConnected] = useState(false);
  const [orgName, setOrgName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(null);
  const [syncResults, setSyncResults] = useState({});
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  useEffect(() => {
    // Check for OAuth callback code in URL
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      handleOAuthCallback(code);
      return;
    }
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('xeroAuth', { action: 'check_status' });
    if (res.data?.error === 'not_configured') {
      setConfigured(false);
    } else {
      setConfigured(true);
      setConnected(res.data?.connected || false);
      setOrgName(res.data?.org_name || null);
      if (res.data?.connected) fetchRecentInvoices();
    }
    setLoading(false);
  };

  const handleOAuthCallback = async (code) => {
    setLoading(true);
    const res = await base44.functions.invoke('xeroAuth', { action: 'exchange_code', code });
    if (res.data?.success) {
      setConfigured(true);
      setConnected(true);
      setOrgName(res.data.org_name);
      // Clean URL
      window.history.replaceState({}, document.title, '/xero');
      fetchRecentInvoices();
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('xeroAuth', { action: 'get_auth_url' });
    if (res.data?.url) window.location.href = res.data.url;
    setLoading(false);
  };

  const handleDisconnect = async () => {
    await base44.functions.invoke('xeroAuth', { action: 'disconnect' });
    setConnected(false);
    setOrgName(null);
    setRecentInvoices([]);
    setSyncResults({});
  };

  const fetchRecentInvoices = async () => {
    setLoadingInvoices(true);
    const res = await base44.functions.invoke('xeroSync', { action: 'get_invoices', status: 'AUTHORISED', type: 'ACCPAY' });
    setRecentInvoices(res.data?.invoices?.slice(0, 10) || []);
    setLoadingInvoices(false);
  };

  const runSync = async (action, label) => {
    setSyncing(action);
    const res = await base44.functions.invoke('xeroSync', { action });
    setSyncResults(prev => ({ ...prev, [action]: res.data }));
    setSyncing(null);
    if (action === 'sync_invoices') fetchRecentInvoices();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#13B5EA] border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Connecting to Xero...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: XERO_BLUE }}>
          <span className="text-white text-2xl font-bold italic">x</span>
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Xero Integration</h1>
          <p className="text-muted-foreground text-sm">Sync invoices, payments and grant spend with Xero accounting</p>
        </div>
        {connected && (
          <Badge className="ml-auto" style={{ backgroundColor: XERO_BLUE, color: 'white' }}>
            <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
          </Badge>
        )}
      </div>

      <Separator />

      {/* Not Configured State */}
      {configured === false && (
        <Alert className="border-amber-300 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <p className="font-semibold mb-2">Xero API credentials not configured</p>
            <p className="text-sm mb-3">To enable this integration, an admin needs to add the following secrets in the <strong>Base44 dashboard → Settings → Environment Variables</strong>:</p>
            <ul className="text-sm space-y-1 font-mono bg-amber-100 rounded p-3">
              <li><strong>XERO_CLIENT_ID</strong> — from developer.xero.com/app/manage</li>
              <li><strong>XERO_CLIENT_SECRET</strong> — from developer.xero.com/app/manage</li>
              <li><strong>XERO_REDIRECT_URI</strong> — e.g. https://your-app.base44.app/xero</li>
            </ul>
            <div className="mt-3">
              <a
                href="https://developer.xero.com/app/manage"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium underline"
                style={{ color: XERO_BLUE }}
              >
                Open Xero Developer Portal <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Connect / Connected State */}
      {configured === true && (
        <>
          <Card className={connected ? 'border-[#13B5EA]/40 bg-[#13B5EA]/5' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" style={{ color: XERO_BLUE }} />
                    Xero Organisation
                  </CardTitle>
                  <CardDescription>
                    {connected
                      ? `Connected to: ${orgName || 'Your Organisation'}`
                      : 'Authorise this app to access your Xero account'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {connected ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Authorised
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <XCircle className="w-4 h-4 mr-1" /> Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleConnect}
                      className="text-white font-semibold px-6"
                      style={{ backgroundColor: XERO_BLUE }}
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="12" fill="white" fillOpacity="0.2" />
                        <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="bold">x</text>
                      </svg>
                      Connect to Xero
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Sync Actions */}
          {connected && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SyncCard
                  icon={<ArrowRightLeft className="w-5 h-5" style={{ color: XERO_BLUE }} />}
                  title="Sync Paid Invoices"
                  description="Match paid Xero supplier bills to Purchase Orders and update payment status automatically."
                  action="sync_invoices"
                  result={syncResults['sync_invoices']}
                  syncing={syncing === 'sync_invoices'}
                  onSync={() => runSync('sync_invoices')}
                />
                <SyncCard
                  icon={<TrendingUp className="w-5 h-5" style={{ color: XERO_BLUE }} />}
                  title="Sync Grant Spend"
                  description="Pull bank transactions tagged to grant tracking categories and update the Grants tracker."
                  action="sync_grant_spend"
                  result={syncResults['sync_grant_spend']}
                  syncing={syncing === 'sync_grant_spend'}
                  onSync={() => runSync('sync_grant_spend')}
                />
                <SyncCard
                  icon={<FileText className="w-5 h-5" style={{ color: XERO_BLUE }} />}
                  title="Refresh Invoices"
                  description="Reload the list of outstanding supplier bills from Xero below."
                  action="get_invoices"
                  result={null}
                  syncing={loadingInvoices}
                  onSync={fetchRecentInvoices}
                />
              </div>

              {/* Recent Invoices Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: XERO_BLUE }} />
                    Outstanding Supplier Bills in Xero
                  </CardTitle>
                  <CardDescription>Awaiting payment — authorised bills from Xero</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvoices ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Loading invoices...
                    </div>
                  ) : recentInvoices.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">No outstanding invoices found in Xero.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs uppercase tracking-wide">
                            <th className="text-left py-2 pr-4">Invoice #</th>
                            <th className="text-left py-2 pr-4">Supplier</th>
                            <th className="text-left py-2 pr-4">Reference</th>
                            <th className="text-right py-2 pr-4">Amount Due</th>
                            <th className="text-left py-2">Due Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentInvoices.map((inv, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="py-2 pr-4 font-mono text-xs">{inv.InvoiceNumber}</td>
                              <td className="py-2 pr-4">{inv.Contact?.Name || '—'}</td>
                              <td className="py-2 pr-4 text-muted-foreground">{inv.Reference || '—'}</td>
                              <td className="py-2 pr-4 text-right font-medium">
                                £{(inv.AmountDue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2 text-muted-foreground">
                                {inv.DueDate ? inv.DueDate.replace('/Date(', '').replace('+0000)/', '') : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Setup Guide */}
      {configured === true && !connected && (
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: XERO_BLUE }}>1</span>
              <span>Go to <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: XERO_BLUE }}>developer.xero.com/app/manage</a> and create a <strong>Web App</strong></span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: XERO_BLUE }}>2</span>
              <span>Set the Redirect URI to your app's <strong>/xero</strong> path and save your Client ID &amp; Secret as environment variables</span>
            </div>
            <div className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: XERO_BLUE }}>3</span>
              <span>Click <strong>Connect to Xero</strong> above to authorise access</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SyncCard({ icon, title, description, result, syncing, onSync }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon} {title}
        </CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        {result && (
          <div className="mb-3 text-xs bg-green-50 border border-green-200 rounded p-2 text-green-800">
            {result.matched_pos !== undefined && <p>✓ {result.total_invoices} invoices checked, {result.matched_pos} POs updated</p>}
            {result.grants_updated !== undefined && <p>✓ {result.transactions_checked} transactions, {result.grants_updated?.length || 0} grants updated</p>}
          </div>
        )}
        <Button
          size="sm"
          className="w-full text-white"
          style={{ backgroundColor: XERO_BLUE }}
          onClick={onSync}
          disabled={syncing}
        >
          {syncing ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          {syncing ? 'Syncing...' : 'Run Sync'}
        </Button>
      </CardContent>
    </Card>
  );
}