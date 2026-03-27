import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Users, Wrench, Truck, TrendingUp, AlertCircle } from 'lucide-react';

// UK Postcode to coordinates mapping (sample data for Bury area)
const postcodeToCoords = {
  'BL9': [53.5959, -2.2962],
  'BL0': [53.6478, -2.1628],
  'BL8': [53.6088, -2.4378],
  'M25': [53.5522, -2.2813],
  'M26': [53.5316, -2.2980],
  'M45': [53.5697, -2.3361],
};

const buryBounds = [[53.48, -2.45], [53.68, -2.15]];

export default function MapDashboard() {
  const [showProspects, setShowProspects] = useState(true);
  const [showJobs, setShowJobs] = useState(true);
  const [showSuppliers, setShowSuppliers] = useState(true);
  const [selectedTown, setSelectedTown] = useState(null);

  // Fetch data
  const { data: prospects = [] } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => base44.entities.Prospect.list(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
  });

  // Extract postcode prefixes and get coordinates
  const getCoords = (postcode) => {
    if (!postcode) return null;
    const prefix = postcode.slice(0, 3).toUpperCase();
    return postcodeToCoords[prefix] || null;
  };

  // Prospect locations with conversion status
  const prospectMarkers = useMemo(() => {
    return prospects
      .map(p => ({
        ...p,
        coords: getCoords(p.postcode),
        converted: p.contact_status === 'converted_to_client',
        interested: p.contact_status === 'interested',
      }))
      .filter(p => p.coords);
  }, [prospects]);

  // Job locations
  const jobMarkers = useMemo(() => {
    return jobs
      .map(j => ({
        ...j,
        coords: j.address ? getCoords(j.address.split(' ').pop()) : null,
        active: ['scheduled', 'in_progress'].includes(j.status),
      }))
      .filter(j => j.coords);
  }, [jobs]);

  // Supplier locations
  const supplierMarkers = useMemo(() => {
    return suppliers
      .map(s => ({
        ...s,
        coords: getCoords(s.postcode),
        preferred: s.preferred,
      }))
      .filter(s => s.coords);
  }, [suppliers]);

  // Coverage analysis
  const coverageAnalysis = useMemo(() => {
    const townMap = {};
    
    prospectMarkers.forEach(p => {
      if (!townMap[p.town]) {
        townMap[p.town] = { prospects: 0, jobs: 0, suppliers: 0, converted: 0 };
      }
      townMap[p.town].prospects++;
      if (p.converted) townMap[p.town].converted++;
    });

    jobMarkers.forEach(j => {
      const town = j.address?.split(' ').pop();
      if (town && townMap[town]) {
        townMap[town].jobs++;
      }
    });

    supplierMarkers.forEach(s => {
      if (townMap[s.town]) {
        townMap[s.town].suppliers++;
      }
    });

    return Object.entries(townMap)
      .map(([town, data]) => ({
        town,
        ...data,
        conversionRate: data.prospects > 0 ? ((data.converted / data.prospects) * 100).toFixed(1) : 0,
        gap: data.suppliers === 0 ? 'CRITICAL' : data.suppliers < 3 ? 'WARNING' : 'GOOD',
      }))
      .sort((a, b) => b.prospects - a.prospects);
  }, [prospectMarkers, jobMarkers, supplierMarkers]);

  const iconProspect = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const iconJob = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  const iconSupplier = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Geographic Service Map</h1>
          <p className="text-muted-foreground mt-1">Prospect density, job locations, and supplier coverage across Bury</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden h-[600px]">
              <MapContainer
                center={[53.59, -2.30]}
                zoom={12}
                maxBounds={buryBounds}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />

                {/* Prospects */}
                {showProspects &&
                  prospectMarkers.map((prospect) => (
                    <CircleMarker
                      key={`prospect-${prospect.id}`}
                      center={prospect.coords}
                      radius={prospect.converted ? 7 : prospect.interested ? 5 : 4}
                      fillColor={prospect.converted ? '#10b981' : prospect.interested ? '#3b82f6' : '#94a3b8'}
                      color={prospect.converted ? '#059669' : prospect.interested ? '#1d4ed8' : '#64748b'}
                      weight={2}
                      opacity={0.8}
                      fillOpacity={0.7}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold">{prospect.first_name} {prospect.last_name}</p>
                          <p>{prospect.town}</p>
                          <Badge className="text-xs">{prospect.contact_status}</Badge>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                {/* Jobs */}
                {showJobs &&
                  jobMarkers.map((job) => (
                    <Marker
                      key={`job-${job.id}`}
                      position={job.coords}
                      icon={iconJob}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold">{job.title}</p>
                          <p>{job.client_name}</p>
                          <Badge className="text-xs">{job.status}</Badge>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* Suppliers */}
                {showSuppliers &&
                  supplierMarkers.map((supplier) => (
                    <Marker
                      key={`supplier-${supplier.id}`}
                      position={supplier.coords}
                      icon={iconSupplier}
                    >
                      <Popup>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold">{supplier.company_name}</p>
                          <p className="text-muted-foreground">{supplier.supplier_type}</p>
                          <Badge className="text-xs">{supplier.status}</Badge>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </Card>

            {/* Legend */}
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span className="text-xs">Converted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="text-xs">Interested</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                    <span className="text-xs">Not Contacted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-5 rounded-sm bg-green-500"></div>
                    <span className="text-xs">Active Jobs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-5 rounded-sm bg-orange-500"></div>
                    <span className="text-xs">Suppliers</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls & Analysis */}
          <div className="space-y-4">
            {/* Toggle Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Map Layers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prospects"
                    checked={showProspects}
                    onCheckedChange={setShowProspects}
                  />
                  <label htmlFor="prospects" className="text-sm cursor-pointer flex items-center gap-2">
                    <Users className="w-4 h-4" /> Prospects ({prospectMarkers.length})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jobs"
                    checked={showJobs}
                    onCheckedChange={setShowJobs}
                  />
                  <label htmlFor="jobs" className="text-sm cursor-pointer flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Jobs ({jobMarkers.length})
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="suppliers"
                    checked={showSuppliers}
                    onCheckedChange={setShowSuppliers}
                  />
                  <label htmlFor="suppliers" className="text-sm cursor-pointer flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Suppliers ({supplierMarkers.length})
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Coverage Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {coverageAnalysis.slice(0, 5).map((area) => (
                  <div key={area.town} className="p-2 bg-muted rounded text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold">{area.town}</p>
                      <Badge variant={area.gap === 'CRITICAL' ? 'destructive' : area.gap === 'WARNING' ? 'secondary' : 'default'} className="text-xs">
                        {area.gap}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <p>Prospects: {area.prospects}</p>
                      <p>Conversion: {area.conversionRate}%</p>
                      <p>Suppliers: {area.suppliers}</p>
                      <p>Jobs: {area.jobs}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Coverage Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Area-by-Area Coverage Analysis</CardTitle>
            <CardDescription>Identify service gaps and prioritize outreach</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {coverageAnalysis.map((area) => (
                <div key={area.town} className="p-4 border rounded-lg hover:bg-muted/50 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {area.town}
                      </p>
                      <p className="text-xs text-muted-foreground">{area.prospects} prospects</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={area.gap === 'CRITICAL' ? 'destructive' : area.gap === 'WARNING' ? 'secondary' : 'default'}>
                        {area.gap}
                      </Badge>
                      <Badge variant="outline">{area.conversionRate}% conversion</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="bg-background p-2 rounded">
                      <p className="text-xs text-muted-foreground">Prospects</p>
                      <p className="font-bold text-lg">{area.prospects}</p>
                    </div>
                    <div className="bg-background p-2 rounded">
                      <p className="text-xs text-muted-foreground">Converted</p>
                      <p className="font-bold text-lg">{area.converted}</p>
                    </div>
                    <div className="bg-background p-2 rounded">
                      <p className="text-xs text-muted-foreground">Suppliers</p>
                      <p className="font-bold text-lg">{area.suppliers}</p>
                    </div>
                    <div className="bg-background p-2 rounded">
                      <p className="text-xs text-muted-foreground">Active Jobs</p>
                      <p className="font-bold text-lg">{area.jobs}</p>
                    </div>
                  </div>

                  {area.gap === 'CRITICAL' && (
                    <div className="mt-3 p-2 bg-destructive/10 border border-destructive/50 rounded text-xs text-destructive flex items-gap-2">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>No supplier coverage—prioritize recruitment or partner development</span>
                    </div>
                  )}
                  {area.gap === 'WARNING' && (
                    <div className="mt-3 p-2 bg-amber-100/50 border border-amber-300 rounded text-xs text-amber-900 flex items-gap-2">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Limited supplier coverage—consider expanding local network</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Service Gap Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {coverageAnalysis.filter(a => a.gap === 'CRITICAL').length > 0 && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded">
                  <p className="font-semibold text-destructive mb-1">Critical Gaps Detected</p>
                  <p className="text-muted-foreground">{coverageAnalysis.filter(a => a.gap === 'CRITICAL').map(a => a.town).join(', ')} have no supplier coverage. Immediate recruitment or partnership needed.</p>
                </div>
              )}
              {coverageAnalysis.filter(a => a.gap === 'WARNING').length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                  <p className="font-semibold text-amber-900 mb-1">Areas for Growth</p>
                  <p className="text-muted-foreground">{coverageAnalysis.filter(a => a.gap === 'WARNING').map(a => a.town).join(', ')} have limited capacity—expand supplier roster.</p>
                </div>
              )}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="font-semibold text-blue-900 mb-1">Conversion Optimization</p>
                <p className="text-muted-foreground">Focus outreach on areas with high prospect density but low conversion rates.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}