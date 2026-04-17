import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Wand2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function JobDescriptionGenerator({ isOpen, onClose, onSelect }) {
  const [jobTitle, setJobTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleGenerate = async () => {
    if (!jobTitle.trim() || !skills.trim() || !responsibilities.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generateJobDescription', {
        job_title: jobTitle,
        required_skills: skills,
        responsibilities: responsibilities
      });

      if (result.data.success) {
        setGenerated(result.data.generated_content);
      } else {
        toast.error('Failed to generate description');
      }
    } catch (error) {
      toast.error('Error generating description');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyField = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopied(fieldName);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSelect = () => {
    if (onSelect && generated) {
      onSelect(generated);
      handleReset();
    }
  };

  const handleReset = () => {
    setJobTitle('');
    setSkills('');
    setResponsibilities('');
    setGenerated(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleReset()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Job Description Generator</DialogTitle>
          <DialogDescription>
            Fill in the basics and let AI create a compelling job description with tags and categories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!generated ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Job Title</label>
                <Input
                  placeholder="e.g. Handyperson Specialist"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Required Skills (comma-separated)</label>
                <Textarea
                  placeholder="e.g. Plumbing, Carpentry, Electrical work, Problem-solving"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Key Responsibilities</label>
                <Textarea
                  placeholder="e.g. Complete home repairs, Visit clients, Provide excellent service, Work safely"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Wand2 className="w-4 h-4" />
                Generate Description
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{generated.title}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyField(generated.title, 'title')}
                    >
                      {copied === 'title' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{generated.description}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyField(generated.description, 'description')}
                      className="mt-2"
                    >
                      {copied === 'description' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      Copy
                    </Button>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Responsibilities</h4>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      {generated.key_responsibilities?.map((resp, idx) => (
                        <li key={idx}>• {resp}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {generated.required_skills?.map((skill, idx) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Suggested Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {generated.suggested_tags?.map((tag, idx) => (
                        <Badge key={idx} className="bg-primary/10 text-primary">{tag}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Category</h4>
                    <Badge>{generated.category}</Badge>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button
                  onClick={() => setGenerated(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={handleSelect}
                  className="flex-1"
                >
                  Use This Description
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}