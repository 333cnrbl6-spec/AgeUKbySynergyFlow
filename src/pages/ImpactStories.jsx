import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Quote, Heart, Users, Wrench, Coffee, BookOpen } from 'lucide-react';

export default function ImpactStories() {
  const stories = [
    {
      id: 1,
      title: "Jack's Independence Restored",
      category: "handyperson",
      icon: Wrench,
      summary: "Handyperson service helped install grab rails and improved home safety.",
      story: "Jack, 78, was struggling with mobility and felt unsafe in his own home. After our handyperson service installed grab rails in the bathroom and kitchen, fixed loose carpets, and improved lighting, he regained confidence. 'I can move around without fear now,' Jack says. Three months later, he's returned to his hobby of gardening.",
      outcome: "Enabled independent living; reduced fall risk; improved wellbeing",
      timeframe: "3 months"
    },
    {
      id: 2,
      title: "Margaret Overcame Isolation",
      category: "befriending",
      icon: Users,
      summary: "Weekly befriending visits transformed her social life and mental health.",
      story: "Margaret, 82, lost her husband two years ago and had become increasingly isolated. Our befriending volunteer, Sarah, began visiting weekly. They share tea, chat about Margaret's life, and have become close friends. Margaret now attends our day centre on Thursdays and has made new friends there too.",
      outcome: "Reduced loneliness score by 60%; increased social connections; improved mood",
      timeframe: "6 months"
    },
    {
      id: 3,
      title: "Tom's Health Confidence",
      category: "information",
      icon: BookOpen,
      summary: "Information and advice service helped him navigate benefits and health support.",
      story: "Tom, 70, was confused about his pension entitlements and eligibility for support. Our advisers helped him understand the benefits calculator, identified £2,400/year in unclaimed benefits, and signposted him to NHS services for his arthritis. Armed with knowledge, Tom feels more in control.",
      outcome: "Increased annual income by £2,400; connected to health services; improved confidence",
      timeframe: "2 months"
    },
    {
      id: 4,
      title: "Rita's Social Reboost",
      category: "activities",
      icon: Coffee,
      summary: "Day centre activities brought joy, purpose, and new friendships.",
      story: "Rita, 75, was grieving and unoccupied after retirement. She joined our Tuesday luncheon club and Wednesday exercise class. She's now an active participant, helps other members, and looks forward to coming in. 'I have a reason to get up now,' Rita shares.",
      outcome: "Improved sense of purpose; built social circle; increased physical activity",
      timeframe: "4 months"
    },
    {
      id: 5,
      title: "David's Digital Breakthrough",
      category: "information",
      icon: BookOpen,
      summary: "IT training helped him stay connected with family during lockdown.",
      story: "David, 73, had never used a computer. When isolation struck, he was cut off from video calls with grandchildren. Our IT trainer, Marcus, taught him Zoom basics in three sessions. Now David FaceTimes his grandkids every week and even manages his own email.",
      outcome: "Bridged digital divide; strengthened family bonds; increased independence",
      timeframe: "1 month"
    },
    {
      id: 6,
      title: "Jean's Support Network",
      category: "handyperson",
      icon: Wrench,
      summary: "Holistic service integration: handyperson job led to befriending and day centre referral.",
      story: "Jean, 80, called for a handyperson job (loose handrail). During the visit, the worker noticed she seemed lonely and suggested befriending. Our adviser also flagged that Jean was eligible for pension credit. Now she gets weekly visits from a befriender, attends day centre, and has regained confidence.",
      outcome: "Integrated 3 services; increased income; reduced isolation; improved safety",
      timeframe: "5 months"
    }
  ];

  const stats = [
    { label: 'Clients Served', value: '450+', icon: Users },
    { label: 'Jobs Completed', value: '890+', icon: Wrench },
    { label: 'Befriending Hours', value: '2,100+', icon: Heart },
    { label: 'Average Conversion Rate', value: '68%', icon: BookOpen }
  ];

  const getCategoryColor = (category) => {
    const colors = {
      handyperson: 'bg-blue-100 text-blue-800',
      befriending: 'bg-pink-100 text-pink-800',
      activities: 'bg-green-100 text-green-800',
      information: 'bg-amber-100 text-amber-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredStories = selectedCategory
    ? stories.filter(s => s.category === selectedCategory)
    : stories;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Impact Stories</h1>
          <p className="text-muted-foreground mt-1">Real stories of how Age UK Bury has made a difference</p>
        </div>

        {/* Impact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="text-center space-y-2">
                    <Icon className="w-8 h-8 mx-auto text-primary" />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All Stories
          </button>
          {['handyperson', 'befriending', 'activities', 'information'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStories.map((story) => {
            const Icon = story.icon;
            return (
              <Card key={story.id} className="hover:shadow-lg transition flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-8 h-8 text-primary" />
                    <Badge className={getCategoryColor(story.category)}>
                      {story.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{story.title}</CardTitle>
                  <CardDescription>{story.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <p className="text-sm text-foreground">{story.story}</p>
                  
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Outcome</p>
                    <p className="text-sm text-foreground">{story.outcome}</p>
                  </div>

                  <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 mt-auto">
                    <span>Timeframe: {story.timeframe}</span>
                    <Quote className="w-4 h-4 opacity-30" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Takeaways */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Key Takeaways
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Integration works:</strong> Services are most effective when coordinated (handyperson → befriending → day centre).</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Independence matters:</strong> Clients prioritize safety, confidence, and ability to live independently.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Isolation is real:</strong> Befriending and activities are transformative for loneliness and mental health.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span><strong>Knowledge is power:</strong> Information and advice empower clients to claim entitlements and navigate support.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}