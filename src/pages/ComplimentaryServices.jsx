import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Bus, Home, Heart, Briefcase, Phone, MapPin, ExternalLink, Search } from 'lucide-react';

export default function ComplimentaryServices() {
  const [searchTerm, setSearchTerm] = useState('');

  const services = [
    // Transport
    {
      id: 1,
      name: 'Bury Community Transport',
      category: 'Transport',
      icon: Bus,
      description: 'Subsidized community transport for older people, people with disabilities, and those with limited mobility.',
      details: 'Door-to-door service for medical appointments, shopping, social outings. Operating Mon–Fri 8am–5pm.',
      contact: '0161 704 5555',
      website: 'https://www.bury.gov.uk/community-transport',
      area: 'Bury Borough',
      cost: 'Subsidized (sliding scale)'
    },
    {
      id: 2,
      name: 'Greater Manchester Bus Pass',
      category: 'Transport',
      icon: Bus,
      description: 'Free bus travel for people aged 60+ and registered disabled people.',
      details: 'Unlimited free travel on buses across Greater Manchester. Apply at local Bury Council office or online.',
      contact: '0161 253 5000',
      website: 'https://www.greatermanchester-ca.gov.uk/transport/buses/concessionary-fares/',
      area: 'Greater Manchester',
      cost: 'Free'
    },
    // Housing & Care
    {
      id: 3,
      name: 'Bury Council Adult Social Care',
      category: 'Housing & Care',
      icon: Home,
      description: 'Assessment, support planning, and care services for older people and people with disabilities.',
      details: 'Free assessment of care needs. Arranges home care, day centres, residential care, and support. Available 24/7 for emergencies.',
      contact: '0161 253 5858',
      website: 'https://www.bury.gov.uk/adult-social-care',
      area: 'Bury Borough',
      cost: 'Free assessment; care costs assessed'
    },
    {
      id: 4,
      name: 'Bury Housing Trust',
      category: 'Housing & Care',
      icon: Home,
      description: 'Affordable housing and supported living for older people.',
      details: 'Various housing options including sheltered housing, independent living, and supported accommodation.',
      contact: '0161 796 5000',
      website: 'https://www.buryhousingtrust.org.uk/',
      area: 'Bury Borough',
      cost: 'Sliding scale based on income'
    },
    // Health
    {
      id: 5,
      name: 'NHS Bury ICB Health Services',
      category: 'Health',
      icon: Heart,
      description: 'GP services, community health, mental health support, and preventative programs for older people.',
      details: 'Access to GPs, district nurses, occupational therapy, falls prevention, memory clinics, and wellbeing programs.',
      contact: '111 (non-emergency) / 999 (emergency)',
      website: 'https://www.nhs.uk/nhs-services/mental-health-services/',
      area: 'Bury ICB',
      cost: 'Free (NHS)'
    },
    {
      id: 6,
      name: 'Bury Wellbeing Hub',
      category: 'Health',
      icon: Heart,
      description: 'Free health and wellbeing services including exercise, mental health support, nutrition, and screening.',
      details: 'Weekly exercise classes, mental health support groups, healthy eating workshops, blood pressure checks.',
      contact: '0161 253 5000',
      website: 'https://www.bury.gov.uk/health-wellbeing',
      area: 'Bury Borough',
      cost: 'Free'
    },
    // Benefits & Money Advice
    {
      id: 7,
      name: 'Citizens Advice Bury',
      category: 'Benefits & Money',
      icon: Briefcase,
      description: 'Free advice on benefits, debt, housing, employment, and legal issues.',
      details: 'Drop-in and appointment-based advice. Specialist advisers for benefits appeals, debt negotiation, fuel poverty.',
      contact: '0161 252 5499',
      website: 'https://www.citizensadvice.org.uk/local/bury',
      area: 'Bury Borough',
      cost: 'Free'
    },
    {
      id: 8,
      name: 'Bury Council Welfare Support',
      category: 'Benefits & Money',
      icon: Briefcase,
      description: 'Hardship funds, fuel poverty support, and cost-of-living assistance.',
      details: 'Crisis support, winter fuel payments, energy crisis support. Application through Bury Council.',
      contact: '0161 253 5000',
      website: 'https://www.bury.gov.uk/welfare-support',
      area: 'Bury Borough',
      cost: 'Varies (grants/support)'
    },
    // Social & Community
    {
      id: 9,
      name: 'Bury Library Service – Community Programs',
      category: 'Social & Community',
      icon: Briefcase,
      description: 'Free community groups, activities, and services for older people.',
      details: 'Reading groups, IT classes, knitting circles, craft sessions, cultural events. All free or low-cost.',
      contact: '0161 253 5871',
      website: 'https://www.bury.gov.uk/libraries',
      area: 'Bury Borough',
      cost: 'Free or low-cost'
    },
    {
      id: 10,
      name: 'Voluntary Action Bury',
      category: 'Social & Community',
      icon: Briefcase,
      description: 'Volunteer-led community support, befriending, and practical help.',
      details: 'Befriending schemes, practical support (shopping, dog walking), social groups, volunteer opportunities.',
      contact: '0161 796 3333',
      website: 'https://www.vab.org.uk/',
      area: 'Bury Borough',
      cost: 'Free'
    },
    {
      id: 11,
      name: 'Bury Foodbank',
      category: 'Benefits & Money',
      icon: Briefcase,
      description: 'Emergency food support for people in crisis or hardship.',
      details: 'Provides 3-day emergency food parcels. Referral required from professional.',
      contact: '0161 253 5000',
      website: 'https://www.trusselltrust.org/find-a-foodbank/bury/',
      area: 'Bury Borough',
      cost: 'Free'
    },
    // Specific Groups
    {
      id: 12,
      name: 'Bury Dementia Support Services',
      category: 'Health',
      icon: Heart,
      description: 'Specialized support, activities, and respite care for people with dementia and carers.',
      details: 'Day centre, support groups for carers, home support, early diagnosis services, advice line.',
      contact: '0161 253 5858',
      website: 'https://www.bury.gov.uk/dementia-support',
      area: 'Bury Borough',
      cost: 'Free assessment; care costs assessed'
    },
  ];

  const categories = ['All', 'Transport', 'Housing & Care', 'Health', 'Benefits & Money', 'Social & Community'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = services.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryColor = (category) => {
    const colors = {
      'Transport': 'bg-blue-100 text-blue-800',
      'Housing & Care': 'bg-purple-100 text-purple-800',
      'Health': 'bg-red-100 text-red-800',
      'Benefits & Money': 'bg-green-100 text-green-800',
      'Social & Community': 'bg-amber-100 text-amber-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Complimentary Services in Bury</h1>
          <p className="text-muted-foreground mt-1">Partner services and local resources to support your health, wellbeing, and independence</p>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.id} className="hover:shadow-lg transition flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <Badge className={getCategoryColor(service.category)}>
                      {service.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                  <CardDescription>{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <p className="text-sm text-foreground">{service.details}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-mono text-sm">{service.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{service.area}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Cost:</span>
                      <span className="text-sm font-medium text-foreground">{service.cost}</span>
                    </div>
                  </div>

                  <a
                    href={service.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-secondary text-secondary-foreground py-2 rounded-md hover:bg-secondary/80 transition text-sm font-medium mt-auto"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No services found. Try a different search or category.</p>
            </CardContent>
          </Card>
        )}

        {/* Integration Note */}
        <Card className="bg-accent/50 border-accent">
          <CardHeader>
            <CardTitle>Working Together</CardTitle>
            <CardDescription>How Age UK Bury partners with these services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>Age UK Bury works closely with these local organizations to provide holistic support. When you contact us, we can:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Refer you to partner services based on your needs</li>
              <li>Coordinate support across multiple organizations</li>
              <li>Provide information about eligibility and how to apply</li>
              <li>Advocate for you when accessing services</li>
              <li>Help you navigate the support system</li>
            </ul>
            <p className="pt-3 border-t">
              <strong>Don't know where to start?</strong> Contact us on <span className="text-primary font-mono">0161 793 8000</span> and we'll help you find the right support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}