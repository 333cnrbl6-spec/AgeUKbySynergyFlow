import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, AlertCircle, Pill, Stethoscope, Clock, CheckCircle2, ChevronRight, Heart, Monitor } from 'lucide-react';

export default function HealthServices() {
  const [activeTab, setActiveTab] = useState('overview');

  const nhs111Services = [
    {
      title: 'Symptoms & Self-Care Advice',
      description: 'Describe your symptoms and get professional guidance on whether you need urgent care, can self-manage, or should see a GP.',
      icon: '🔍'
    },
    {
      title: 'Prescription Issues',
      description: 'Help with prescription problems, medication queries, or when to contact your pharmacy.',
      icon: '💊'
    },
    {
      title: 'Out-of-Hours GP Support',
      description: 'When your GP is closed, NHS 111 can assess your condition and arrange urgent GP appointments or home visits.',
      icon: '🕒'
    },
    {
      title: 'Urgent Care Clinic Booking',
      description: 'NHS 111 can book you into an urgent care clinic, walk-in centre, or A&E if needed—with your consent.',
      icon: '🏥'
    },
    {
      title: 'Health Conditions Management',
      description: 'Guidance on managing chronic conditions (diabetes, asthma, heart disease) and when to seek help.',
      icon: '❤️'
    },
    {
      title: 'Mental Health Support',
      description: 'NHS 111 can signpost you to mental health services, crisis lines, or emergency support.',
      icon: '🧠'
    }
  ];

  const pharmacyServices = [
    {
      title: 'Prescription Dispensing',
      description: 'Collect prescribed medicines from your GP. Pharmacists review for interactions and side effects.',
      availability: 'Mon–Sat (most pharmacies); some open Sun'
    },
    {
      title: 'Repeat Prescriptions',
      description: 'Can request repeat prescriptions on your behalf from GPs, saving you time and visits.',
      availability: 'Available most days'
    },
    {
      title: 'Medicines Management & Reviews',
      description: 'Pharmacist checks if your medicines are working well, reviews side effects, and ensures you take them correctly.',
      availability: 'Free service; by appointment'
    },
    {
      title: 'Blood Pressure Checks',
      description: 'Free health checks to monitor blood pressure, cholesterol, blood sugar. Can identify early warning signs.',
      availability: 'Walk-in or appointment'
    },
    {
      title: 'Minor Ailment Advice',
      description: 'Treat common issues (coughs, colds, sore throats, allergies) without needing a GP appointment.',
      availability: 'Walk-in or call ahead'
    },
    {
      title: 'Health Screening Programs',
      description: 'Participate in smoking cessation, weight management, healthy eating, and NHS health checks.',
      availability: 'Varies by pharmacy'
    },
    {
      title: 'Medication Queries',
      description: 'Ask questions about how to take medicines, side effects, interactions, or alternatives.',
      availability: 'Anytime during opening hours'
    },
    {
      title: 'Vaccination Services',
      description: 'Flu, shingles, pneumococcal vaccines and other age-appropriate vaccinations.',
      availability: 'Seasonal and ongoing'
    }
  ];

  const howToAccess = [
    {
      service: 'NHS 111',
      phone: '111',
      online: 'https://111.nhs.uk',
      app: 'NHS 111 App',
      timing: '24/7, 365 days',
      cost: 'Free'
    },
    {
      service: 'GP Appointments',
      phone: 'Your local GP surgery',
      online: 'eConsult (online form)',
      app: 'GP practice app (if available)',
      timing: 'Mon–Fri (often open Sat mornings)',
      cost: 'Free'
    },
    {
      service: 'NHS Online (Symptom Checker)',
      phone: 'N/A',
      online: 'https://www.nhs.uk/symptoms',
      app: 'NHS App',
      timing: '24/7',
      cost: 'Free'
    },
    {
      service: 'Pharmacy',
      phone: 'Local pharmacy (local directory)',
      online: 'Online consultation (some pharmacies)',
      app: 'Pharmacy apps (Boots, Lloyds, Superdrug)',
      timing: 'Varies by location',
      cost: 'Free (most services)'
    }
  ];

  const whenToUse = [
    {
      scenario: 'Unsure if condition is urgent',
      use: 'NHS 111',
      why: 'Trained advisers assess your symptoms 24/7 and guide you to right care level.'
    },
    {
      scenario: 'Feeling unwell but not emergency',
      use: 'NHS 111 or Pharmacy',
      why: 'Get quick advice without GP appointment. Pharmacy can treat many minor issues.'
    },
    {
      scenario: 'Need prescription advice or medication review',
      use: 'Pharmacy',
      why: 'Pharmacists are medicines experts and offer free advice without lengthy waits.'
    },
    {
      scenario: 'Ongoing health management (diabetes, asthma, heart disease)',
      use: 'GP + Pharmacy',
      why: 'GPs manage chronic conditions; pharmacists support with medicines and lifestyle.'
    },
    {
      scenario: 'Running low on prescription',
      use: 'Pharmacy (repeat request)',
      why: 'Pharmacists can order from GP without you needing an appointment.'
    },
    {
      scenario: 'Serious symptoms or chest pain',
      use: '999 or A&E',
      why: 'Emergency services for life-threatening conditions. Call 999 immediately.'
    },
    {
      scenario: 'Health check or screening (blood pressure, cholesterol)',
      use: 'Pharmacy or GP',
      why: 'Pharmacies offer free preventative health checks to catch early problems.'
    }
  ];

  const tips = [
    {
      title: 'Use NHS 111 Wisely',
      points: [
        'Use 111 instead of A&E for non-emergencies—you\'ll be seen faster.',
        'NHS 111 advisers can book urgent appointments, so you don\'t waste time on the phone.',
        'Call early in the day to avoid peak times.'
      ]
    },
    {
      title: 'Build a Pharmacy Relationship',
      points: [
        'Use the same pharmacy so pharmacists know your medicines and health history.',
        'Ask pharmacist to review your medicines annually for interactions or side effects.',
        'Pharmacy apps (Boots, Lloyds) let you order repeat prescriptions without calling GP.'
      ]
    },
    {
      title: 'Prepare for GP Appointments',
      points: [
        'Write down symptoms, questions, and when they started.',
        'Bring all medicines (or a list) so GP has full picture.',
        'Ask for results and explanations—understanding your condition helps you manage it.'
      ]
    },
    {
      title: 'Use Digital Services',
      points: [
        'NHS App: manage appointments, view prescriptions, use symptom checker.',
        'eConsult: describe symptoms online and GP responds in 24–48 hours (faster than phone).',
        'NHS 111 online: chat-based assessment if you prefer not to call.'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Health Services Guide for Older Adults</h1>
          <p className="text-muted-foreground mt-1">How to access NHS 111, pharmacy services, GPs, and get the right care when you need it</p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                <p className="font-bold text-lg text-primary">111</p>
              </div>
              <p className="text-sm text-foreground">Non-emergency health advice</p>
              <p className="text-xs text-muted-foreground">24/7 free</p>
            </CardContent>
          </Card>

          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="font-bold text-lg text-red-500">999</p>
              </div>
              <p className="text-sm text-foreground">Emergency only</p>
              <p className="text-xs text-muted-foreground">Life-threatening</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Pill className="w-6 h-6 text-primary" />
                <p className="font-bold text-sm">Pharmacy</p>
              </div>
              <p className="text-sm text-foreground">Medicines & health advice</p>
              <p className="text-xs text-muted-foreground">Local opening hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-6 h-6 text-primary" />
                <p className="font-bold text-sm">GP Surgery</p>
              </div>
              <p className="text-sm text-foreground">Regular health care</p>
              <p className="text-xs text-muted-foreground">Mon–Fri (usually)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="nhs111">NHS 111</TabsTrigger>
            <TabsTrigger value="pharmacy">Pharmacy</TabsTrigger>
            <TabsTrigger value="access">How to Access</TabsTrigger>
            <TabsTrigger value="when">When to Use</TabsTrigger>
            <TabsTrigger value="tips">Tips</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Healthcare Options Explained</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" /> NHS 111
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Free phone/online service (24/7) for non-emergency health advice. Trained advisers assess your symptoms and recommend the right care level.
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ When unsure if condition is urgent</li>
                      <li>✓ Out-of-hours medical advice</li>
                      <li>✓ Booking urgent appointments</li>
                      <li>✓ Medicine/prescription queries</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Pill className="w-5 h-5 text-green-600" /> Pharmacy Services
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Local pharmacy for medicines, health checks, and advice. Pharmacists are medicines experts and can treat minor ailments without GP referral.
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Prescription collection & review</li>
                      <li>✓ Free health checks (BP, cholesterol)</li>
                      <li>✓ Minor ailment treatment</li>
                      <li>✓ Medicines management advice</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-primary" /> GP Surgery
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your regular doctor for ongoing health management, diagnosis, and chronic disease care. First point of contact for most health issues.
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Chronic disease management</li>
                      <li>✓ Diagnosis & investigations</li>
                      <li>✓ Long-term prescriptions</li>
                      <li>✓ Health monitoring & screening</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" /> Emergency (999/A&E)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      For life-threatening emergencies only. Call 999 for chest pain, difficulty breathing, severe bleeding, loss of consciousness.
                    </p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>✓ Severe chest pain</li>
                      <li>✓ Difficulty breathing</li>
                      <li>✓ Loss of consciousness</li>
                      <li>✓ Severe bleeding or injuries</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why This Matters for Older Adults</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>Older adults often have multiple health conditions and take several medicines. Having the right healthcare information helps you:</p>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li><strong>Get faster care:</strong> Using NHS 111 or pharmacy first avoids A&E delays</li>
                  <li><strong>Manage medicines safely:</strong> Pharmacists check for interactions and side effects</li>
                  <li><strong>Prevent emergencies:</strong> Regular GP care and pharmacy health checks catch early problems</li>
                  <li><strong>Understand conditions:</strong> Clear advice helps you manage health confidently</li>
                  <li><strong>Save time:</strong> Know which service suits your need—don't queue unnecessarily</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* NHS 111 */}
          <TabsContent value="nhs111" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>NHS 111: Non-Emergency Health Advice</CardTitle>
                <CardDescription>24/7 free phone and online service for health concerns that aren't emergencies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">How to Access NHS 111</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Call 111
                      </p>
                      <p className="text-sm text-muted-foreground">Free call anytime. Trained adviser assesses your symptoms.</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="font-semibold">🌐 Online Assessment</p>
                      <p className="text-sm text-muted-foreground">Visit 111.nhs.uk to describe symptoms in a form. Response within an hour.</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="font-semibold">📱 NHS 111 App</p>
                      <p className="text-sm text-muted-foreground">Download app to assess symptoms and get care guidance anytime.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">What NHS 111 Can Help With</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nhs111Services.map((service, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <p className="text-lg">{service.icon}</p>
                        <p className="font-semibold text-sm">{service.title}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-sm text-blue-900">💡 Top Tip</p>
                  <p className="text-sm text-blue-800">NHS 111 can book you a same-day or next-day GP appointment, or direct you to urgent care without waiting in A&E. This saves time and gets you the right help faster.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PHARMACY */}
          <TabsContent value="pharmacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pharmacy Services: Your Local Medicine Expert</CardTitle>
                <CardDescription>Pharmacists offer free advice, health checks, and treatment for common issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Pharmacy Services Available</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pharmacyServices.map((service, idx) => (
                      <div key={idx} className="p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-semibold text-sm">{service.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <p className="text-xs text-primary font-medium">{service.availability}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Why Use Your Local Pharmacy?</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Quick access:</strong> No appointment needed for most services</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Expertise:</strong> Pharmacists are medicines specialists</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Safety:</strong> Check for drug interactions and side effects</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Saves GP time:</strong> Treat minor issues without GP visit</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span><strong>Convenience:</strong> Manage prescriptions and refills without calling GP</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
                  <p className="font-semibold text-sm text-green-900">💊 Medicines Management Review</p>
                  <p className="text-sm text-green-800">Ask your pharmacist to review all your medicines annually. They check if each medicine is still needed, if doses are right, and if there are any interactions or side effects you can address.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HOW TO ACCESS */}
          <TabsContent value="access" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>How to Access Each Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left font-semibold">Service</th>
                        <th className="p-3 text-left font-semibold">Phone</th>
                        <th className="p-3 text-left font-semibold">Online</th>
                        <th className="p-3 text-left font-semibold">App</th>
                        <th className="p-3 text-left font-semibold">Hours</th>
                        <th className="p-3 text-left font-semibold">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {howToAccess.map((row, idx) => (
                        <tr key={idx} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-semibold">{row.service}</td>
                          <td className="p-3 text-muted-foreground">{row.phone}</td>
                          <td className="p-3 text-muted-foreground">{row.online}</td>
                          <td className="p-3 text-muted-foreground">{row.app}</td>
                          <td className="p-3 text-muted-foreground">{row.timing}</td>
                          <td className="p-3 font-medium text-primary">{row.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Using the NHS App</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>The NHS App is a free digital tool for managing your health. Download it from your phone's app store.</p>
                <div className="space-y-2">
                  <p className="font-semibold">Features:</p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li>View and manage GP appointments</li>
                    <li>Request repeat prescriptions</li>
                    <li>View your health records</li>
                    <li>Use symptom checker (similar to NHS 111)</li>
                    <li>Find services near you</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WHEN TO USE */}
          <TabsContent value="when" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>When to Use Which Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {whenToUse.map((item, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1">{item.scenario}</p>
                          <p className="text-sm text-muted-foreground">{item.why}</p>
                        </div>
                        <Badge className="flex-shrink-0 whitespace-nowrap">{item.use}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Emergency Warning Signs – Call 999 Immediately
                </CardTitle>
              </CardHeader>
              <CardContent className="text-red-900 space-y-2 text-sm">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Chest pain or pressure</li>
                  <li>Difficulty breathing or shortness of breath</li>
                  <li>Coughing up blood</li>
                  <li>Loss of consciousness or fainting</li>
                  <li>Severe bleeding</li>
                  <li>Severe injury (fall, accident)</li>
                  <li>Suspected stroke (facial drooping, arm weakness, speech difficulty)</li>
                  <li>Choking</li>
                  <li>Acute severe pain</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TIPS */}
          <TabsContent value="tips" className="space-y-6">
            {tips.map((tip, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{tip.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tip.points.map((point, pidx) => (
                      <li key={pidx} className="flex gap-3 text-sm">
                        <span className="text-primary font-bold">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Contact Bury Services */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Bury-Specific Health Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>In addition to NHS services, Age UK Bury can:</p>
            <ul className="space-y-2 list-disc list-inside text-muted-foreground">
              <li>Help you register with a GP if you're new to the area</li>
              <li>Explain your health options and support services</li>
              <li>Signpost you to NHS Bury services and health programs</li>
              <li>Coordinate health support with our other services (handyperson, befriending, day centre)</li>
              <li>Help you access health information and support groups</li>
            </ul>
            <p className="pt-3 font-semibold">Contact us: <span className="text-primary font-mono">0161 793 8000</span></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}