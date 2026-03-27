import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Download, Book, Search, PoundSterling, Heart, Home, Briefcase, TrendingUp } from 'lucide-react';

export default function InformationHub() {
  const [searchTerm, setSearchTerm] = useState('');

  const guides = [
    {
      id: 1,
      title: 'Benefits Entitlements Checklist',
      category: 'Money & Legal',
      icon: PoundSterling,
      description: 'Understand what benefits you may be eligible for, including pension credit, housing benefit, and council tax support.',
      downloadUrl: '#',
      keywords: ['benefits', 'pension', 'allowance', 'money']
    },
    {
      id: 2,
      title: 'Winter Fuel Payment Guide',
      category: 'Money & Legal',
      icon: PoundSterling,
      description: 'How to apply for winter fuel payment, eligibility criteria, and tips for staying warm on a budget.',
      downloadUrl: '#',
      keywords: ['winter', 'heating', 'fuel', 'payment', 'energy']
    },
    {
      id: 3,
      title: 'Power of Attorney Explained',
      category: 'Money & Legal',
      icon: Briefcase,
      description: 'What power of attorney is, when you might need it, and step-by-step instructions for setting one up.',
      downloadUrl: '#',
      keywords: ['attorney', 'legal', 'decisions', 'family']
    },
    {
      id: 4,
      title: 'Home Safety Checklist',
      category: 'Health & Wellbeing',
      icon: Home,
      description: 'Self-assessment guide to identify fall risks, security issues, and accessibility improvements in your home.',
      downloadUrl: '#',
      keywords: ['safety', 'falls', 'home', 'accidents', 'security']
    },
    {
      id: 5,
      title: 'Managing Loneliness',
      category: 'Health & Wellbeing',
      icon: Heart,
      description: 'Practical advice on combating loneliness, finding social activities, and building connections.',
      downloadUrl: '#',
      keywords: ['loneliness', 'isolation', 'social', 'friends', 'mental health']
    },
    {
      id: 6,
      title: 'IT Skills for Older Adults',
      category: 'Work & Learning',
      icon: Briefcase,
      description: 'Basic guide to getting online, email, video calls (Zoom), and staying safe on the internet.',
      downloadUrl: '#',
      keywords: ['technology', 'internet', 'email', 'zoom', 'online', 'computer']
    },
    {
      id: 7,
      title: 'Arranging Care: A Beginner\'s Guide',
      category: 'Health & Wellbeing',
      icon: Heart,
      description: 'Navigate the care system, understand options (home care, day centres, care homes), and assess your needs.',
      downloadUrl: '#',
      keywords: ['care', 'social services', 'support', 'needs', 'assessment']
    },
    {
      id: 8,
      title: 'Scams & Fraud Prevention',
      category: 'Money & Legal',
      icon: PoundSterling,
      description: 'Identify common scams targeting older people, protection tips, and what to do if you\'re targeted.',
      downloadUrl: '#',
      keywords: ['scams', 'fraud', 'protection', 'money', 'identity']
    },
    {
      id: 9,
      title: 'Local Services Directory',
      category: 'Health & Wellbeing',
      icon: TrendingUp,
      description: 'Complete guide to Age UK Bury services and complementary services in Bury (transport, housing, health).',
      downloadUrl: '#',
      keywords: ['services', 'directory', 'bury', 'transport', 'housing']
    },
  ];

  const categories = ['All', 'Money & Legal', 'Health & Wellbeing', 'Work & Learning'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = guides.filter(guide => {
    const matchesCategory = selectedCategory === 'All' || guide.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guide.keywords.some(k => k.includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Information Hub</h1>
          <p className="text-muted-foreground mt-1">Free guides and resources to help you navigate age, health, and wellbeing</p>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search guides..."
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

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((guide) => {
            const Icon = guide.icon;
            return (
              <Card key={guide.id} className="hover:shadow-lg transition flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <Badge variant="secondary">{guide.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{guide.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <p className="text-sm text-muted-foreground flex-1">{guide.description}</p>

                  <button className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition text-sm font-medium">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Book className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No guides found. Try a different search or category.</p>
            </CardContent>
          </Card>
        )}

        {/* Additional Resources */}
        <Card className="bg-accent/50 border-accent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-5 h-5" />
              External Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-foreground">Age UK National Advice Line</p>
              <p className="text-muted-foreground">Free, confidential advice on benefits, care, health, and more.</p>
              <p className="text-primary font-mono mt-1">0800 678 1602 (8am–7pm, 365 days)</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold text-foreground">The Silver Line Helpline</p>
              <p className="text-muted-foreground">24-hour confidential helpline for conversation and support.</p>
              <p className="text-primary font-mono mt-1">0800 716 1616</p>
            </div>
            <div className="border-t pt-3">
              <p className="font-semibold text-foreground">Bury Council Adult Social Care</p>
              <p className="text-muted-foreground">Assessment and support planning for care needs.</p>
              <p className="text-primary font-mono mt-1">0161 253 5858</p>
            </div>
          </CardContent>
        </Card>

        {/* How to Use */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Hub</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-3">
              <span className="text-primary font-bold">1.</span>
              <span><strong>Search or browse</strong> by category to find guides relevant to you.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-bold">2.</span>
              <span><strong>Download the PDF</strong> and save it for reference. All guides are free and printable.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-bold">3.</span>
              <span><strong>Contact us</strong> if you need help understanding any guide or want personalized advice.</span>
            </div>
            <div className="flex gap-3">
              <span className="text-primary font-bold">4.</span>
              <span><strong>Share with friends and family</strong> who may benefit from the information.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}