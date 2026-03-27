import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const TOWNS = ["Bury", "Ramsbottom", "Tottington", "Prestwich", "Radcliffe", "Whitefield"];
const REFERRAL_SOURCES = [
  { value: "self_referral", label: "Self Referral" },
  { value: "gp", label: "GP" },
  { value: "social_services", label: "Social Services" },
  { value: "hospital", label: "Hospital" },
  { value: "family_friend", label: "Family/Friend" },
  { value: "age_uk_service", label: "Age UK Service" },
  { value: "other", label: "Other" },
];

const emptyForm = {
  first_name: "", last_name: "", phone: "", email: "",
  address_line_1: "", address_line_2: "", town: "", postcode: "",
  date_of_birth: "", notes: "", referral_source: "", status: "active",
  dementia_related: false,
};

export default function ClientOnboardingDialog({ open, onOpenChange, prospect, onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (prospect) {
      setForm({
        first_name: prospect.first_name || "",
        last_name: prospect.last_name || "",
        phone: prospect.phone || "",
        email: prospect.email || "",
        address_line_1: prospect.address_line_1 || "",
        address_line_2: prospect.address_line_2 || "",
        town: prospect.town || "",
        postcode: prospect.postcode || "",
        date_of_birth: prospect.date_of_birth || "",
        notes: prospect.notes || "",
        referral_source: "other",
        status: "active",
        dementia_related: false,
      });
    } else {
      setForm(emptyForm);
    }
    setStep(1);
    setErrors([]);
  }, [open, prospect]);

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const validateCatchment = () => {
    const newErrors = [];
    if (!form.town) newErrors.push("Town is required");
    if (!TOWNS.includes(form.town)) newErrors.push(`${form.town} is outside our catchment area`);
    if (!form.first_name) newErrors.push("First name is required");
    if (!form.last_name) newErrors.push("Last name is required");
    if (!form.phone) newErrors.push("Phone number is required");
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const validateComplete = () => {
    const newErrors = [];
    if (!form.referral_source) newErrors.push("Referral source is required");
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateCatchment()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateComplete()) return;
    setSaving(true);
    await onComplete(form);
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {prospect ? "Convert Prospect to Client" : "New Client Onboarding"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Step 1: Verify catchment area" : "Step 2: Complete onboarding"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Catchment Validation */}
        {step === 1 && (
          <div className="space-y-4">
            <Alert className={form.town && TOWNS.includes(form.town) ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
              <AlertCircle className={form.town && TOWNS.includes(form.town) ? "text-green-600" : "text-amber-600"} />
              <AlertDescription className={form.town && TOWNS.includes(form.town) ? "text-green-800" : "text-amber-800"}>
                {form.town && TOWNS.includes(form.town) ? (
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Within Age UK Bury catchment</span>
                ) : (
                  "Age UK Bury serves: Bury, Ramsbottom, Tottington, Prestwich, Radcliffe, Whitefield"
                )}
              </AlertDescription>
            </Alert>

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>First Name *</Label>
                  <Input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} />
                </div>
                <div>
                  <Label>Last Name *</Label>
                  <Input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Town *</Label>
                  <Select value={form.town} onValueChange={(v) => update("town", v)}>
                    <SelectTrigger><SelectValue placeholder="Select town" /></SelectTrigger>
                    <SelectContent>
                      {TOWNS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Postcode</Label>
                  <Input value={form.postcode} onChange={(e) => update("postcode", e.target.value)} placeholder="BL9 ..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Phone *</Label>
                  <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Address Line 1</Label>
                <Input value={form.address_line_1} onChange={(e) => update("address_line_1", e.target.value)} />
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc pl-5 mt-1">
                      {errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="button" onClick={handleNext}>Continue to Onboarding</Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Complete Onboarding */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">✓ {form.first_name} {form.last_name} ({form.town}) is in our catchment area.</p>
            </div>

            <div>
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
            </div>

            <div>
              <Label>Referral Source *</Label>
              <Select value={form.referral_source} onValueChange={(v) => update("referral_source", v)}>
                <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.dementia_related}
                  onChange={(e) => update("dementia_related", e.target.checked)}
                  className="rounded"
                />
                Requires dementia-related support
              </Label>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Any additional information..." />
            </div>

            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-1">
                    {errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Client"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}