import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Clock, Users, Search, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TOWNS = ["Bolton", "Farnworth", "Horwich", "Westhoughton", "Kearsley", "Little Lever"];

const TOWN_COLORS = {
  "Bolton": "bg-blue-50 border-blue-200",
  "Farnworth": "bg-purple-50 border-purple-200",
  "Horwich": "bg-green-50 border-green-200",
  "Westhoughton": "bg-orange-50 border-orange-200",
  "Kearsley": "bg-pink-50 border-pink-200",
  "Little Lever": "bg-yellow-50 border-yellow-200",
};

const TOWN_BADGES = {
  "Bolton": "bg-blue-100 text-blue-800",
  "Farnworth": "bg-purple-100 text-purple-800",
  "Horwich": "bg-green-100 text-green-800",
  "Westhoughton": "bg-orange-100 text-orange-800",
  "Kearsley": "bg-pink-100 text-pink-800",
  "Little Lever": "bg-yellow-100 text-yellow-800",
};

export default function Services() {
  const [selectedTown, setSelectedTown] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("by-town");
  const [filterType, setFilterType] = useState("");

  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => base44.entities.RoomBooking.filter({ recurring: true }),
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: () => base44.entities.Facility.list(),
  });

  // Extract facility locations
  const facilityMap = useMemo(() => {
    const map = {};
    facilities.forEach(f => {
      if (!map[f.town]) map[f.town] = [];
      map[f.town].push(f);
    });
    return map;
  }, [facilities]);

  // Identify activity types from data
  const activityTypes = useMemo(() => {
    const types = new Set();
    activities.forEach(a => {
      if (a.activity_name) {
        const keywords = a.activity_name.toLowerCase();
        if (keywords.includes('exercise') || keywords.includes('fitness')) types.add('exercise');
        if (keywords.includes('dementia') || keywords.includes('music in mind')) types.add('dementia');
        if (keywords.includes('social') || keywords.includes('lunch')) types.add('social');
        if (keywords.includes('befriend') || keywords.includes('visiting')) types.add('befriending');
        if (keywords.includes('craft') || keywords.includes('art')) types.add('creative');
      }
    });
    return Array.from(types);
  }, [activities]);

  // Filter activities
  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchSearch = a.activity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         a.facility_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTown = !selectedTown || a.facility_name?.includes(selectedTown) || 
                       facilityMap[selectedTown]?.some(f => f.name === a.facility_name);
      
      let matchType = true;
      if (filterType) {
        const name = a.activity_name.toLowerCase();
        matchType = (filterType === 'exercise' && (name.includes('exercise') || name.includes('fitness'))) ||
                   (filterType === 'dementia' && (name.includes('dementia') || name.includes('music in mind'))) ||
                   (filterType === 'social' && (name.includes('social') || name.includes('lunch'))) ||
                   (filterType === 'befriending' && (name.includes('befriend') || name.includes('visiting'))) ||
                   (filterType === 'creative' && (name.includes('craft') || name.includes('art')));
      }
      
      return matchSearch && matchTown && matchType;
    });
  }, [activities, searchQuery, selectedTown, filterType, facilityMap]);

  // Group by town
  const groupedByTown = useMemo(() => {
    const grouped = {};
    TOWNS.forEach(town => {
      grouped[town] = filtered.filter(a => 
        a.facility_name?.includes(town) || facilityMap[town]?.some(f => f.name === a.facility_name)
      );
    });
    return grouped;
  }, [filtered, facilityMap]);

  // Get town for a client context card
  const getTownStats = (town) => {
    const townActivities = groupedByTown[town] || [];
    const townFacilities = facilityMap[town] || [];
    return { activities: townActivities.length, facilities: townFacilities.length };
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Services & Locations</h1>
        <p className="text-muted-foreground mt-1">Find activities and services available across Age UK Bolton's catchment areas</p>
      </div>

      {/* Quick Town Selection Cards */}
      <div>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground">QUICK SELECT BY AREA</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => { setSelectedTown(""); setSearchQuery(""); }}
            className={`p-3 rounded-lg border-2 transition-all ${!selectedTown ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
          >
            <div className="text-sm font-semibold">All Towns</div>
            <div className="text-xs text-muted-foreground mt-1">{activities.length} services</div>
          </button>
          {TOWNS.map(town => {
            const stats = getTownStats(town);
            return (
              <button
                key={town}
                onClick={() => setSelectedTown(town)}
                className={`p-3 rounded-lg border-2 transition-all ${selectedTown === town ? `border-primary bg-primary/5` : "border-border hover:border-primary/50"}`}
              >
                <div className="text-sm font-semibold">{town}</div>
                <div className="text-xs text-muted-foreground mt-1">{stats.activities} activities</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search activities or facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        {activityTypes.length > 0 && (
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Types</SelectItem>
              {activityTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={setViewMode}>
        <TabsList>
          <TabsTrigger value="by-town">Grouped by Town</TabsTrigger>
          <TabsTrigger value="list">Full List</TabsTrigger>
          <TabsTrigger value="facilities">Venues</TabsTrigger>
        </TabsList>

        {/* By Town View */}
        <TabsContent value="by-town" className="mt-6 space-y-8">
          {TOWNS.map(town => {
            const townActivities = groupedByTown[town] || [];
            if (selectedTown && selectedTown !== town) return null;

            return (
              <div key={town}>
                <h2 className={`text-lg font-heading font-semibold mb-3 flex items-center gap-2 p-3 rounded-lg ${TOWN_COLORS[town]}`}>
                  <MapPin className="w-5 h-5" /> {town} ({townActivities.length})
                </h2>
                
                {townActivities.length === 0 ? (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      No activities match your filters in {town}.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {townActivities.sort((a, b) => (a.start_time || "").localeCompare(b.start_time || "")).map(activity => (
                      <Card key={activity.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base">{activity.activity_name}</CardTitle>
                              <Badge className={TOWN_BADGES[town]} variant="secondary" className="text-xs mt-2">
                                {town}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            {activity.facility_name}
                          </div>
                          {activity.start_time && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {activity.start_time} - {activity.end_time}
                            </div>
                          )}
                          {activity.expected_attendees && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              Up to {activity.expected_attendees} people
                            </div>
                          )}
                          {activity.organiser_name && (
                            <div className="text-xs text-muted-foreground">
                              Run by: {activity.organiser_name}
                            </div>
                          )}
                          {activity.rate_type === 'free' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Free</Badge>
                          ) : (
                            <Badge variant="outline">£{activity.agreed_rate || 0}/session</Badge>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No services match your search criteria.</AlertDescription>
            </Alert>
          ) : (
            filtered.sort((a, b) => (a.facility_name || "").localeCompare(b.facility_name || "")).map(activity => (
              <Card key={activity.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{activity.activity_name}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {activity.facility_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> {activity.start_time} - {activity.end_time}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <Badge className={TOWN_BADGES[activity.facility_name?.split(" ")[0]] || "bg-gray-100"}>
                        {activity.facility_name?.split(" ")[0]}
                      </Badge>
                      {activity.rate_type === 'free' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">Free</Badge>
                      ) : (
                        <Badge variant="outline">£{activity.agreed_rate || 0}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Venues View */}
        <TabsContent value="facilities" className="mt-6 space-y-8">
          {TOWNS.map(town => {
            const townFacilities = facilityMap[town] || [];
            if (selectedTown && selectedTown !== town) return null;

            return (
              <div key={town}>
                <h2 className={`text-lg font-heading font-semibold mb-3 flex items-center gap-2 p-3 rounded-lg ${TOWN_COLORS[town]}`}>
                  <Building2 className="w-5 h-5" /> Venues in {town} ({townFacilities.length})
                </h2>
                
                {townFacilities.length === 0 ? (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      No venues in {town}.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {townFacilities.map(facility => {
                      const facilityActivities = filtered.filter(a => a.facility_id === facility.id);
                      return (
                        <Card key={facility.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{facility.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground">TYPE</p>
                              <p className="capitalize">{facility.type?.replace(/_/g, " ")}</p>
                            </div>
                            {facility.address_line_1 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">ADDRESS</p>
                                <p>{facility.address_line_1}</p>
                              </div>
                            )}
                            {facility.phone && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground">CONTACT</p>
                                <p>{facility.phone}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">ACTIVITIES HERE</p>
                              {facilityActivities.length === 0 ? (
                                <p className="text-muted-foreground text-xs">No activities listed</p>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {facilityActivities.map(a => (
                                    <Badge key={a.id} variant="outline" className="text-xs">{a.activity_name}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            {facility.capacity && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Users className="w-3 h-3" /> Capacity: {facility.capacity}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}