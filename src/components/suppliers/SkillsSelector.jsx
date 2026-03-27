import React from "react";
import { cn } from "@/lib/utils";

const ALL_SKILLS = [
  { group: "Plumbing & Heating", skills: ["Plumbing", "Gas Safe", "Boiler Service", "Central Heating", "Hot Water Systems", "Drainage"] },
  { group: "Electrical", skills: ["Electrical (Part P)", "Rewiring", "Consumer Units", "PAT Testing", "EV Chargers", "Security Lighting"] },
  { group: "Roofing & Exterior", skills: ["Roofing", "Guttering", "Fascias & Soffits", "Chimney Repairs", "Flat Roofing", "UPVC Windows"] },
  { group: "Plastering & Drywall", skills: ["Plastering", "Dry Lining", "Rendering", "Coving", "Artexing"] },
  { group: "Carpentry & Joinery", skills: ["Carpentry", "Joinery", "Door Fitting", "Flooring", "Kitchen Fitting", "Staircase Repair"] },
  { group: "Decorating", skills: ["Painting & Decorating", "Wallpapering", "Tiling"] },
  { group: "Groundworks & Landscaping", skills: ["Landscaping", "Fencing", "Paving", "Groundworks", "Tree Surgery", "Garden Maintenance"] },
  { group: "Specialist", skills: ["Asbestos Removal", "Damp Proofing", "Structural Work", "Adaptation Works", "Stairlift Installation", "Access Equipment"] },
  { group: "General", skills: ["General Handyman", "Flat Pack Assembly", "Picture Hanging", "Cleaning", "Waste Removal", "Pest Control"] },
];

export default function SkillsSelector({ selected = [], onChange }) {
  const toggle = (skill) => {
    if (selected.includes(skill)) {
      onChange(selected.filter(s => s !== skill));
    } else {
      onChange([...selected, skill]);
    }
  };

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {ALL_SKILLS.map(({ group, skills }) => (
        <div key={group}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
          <div className="flex flex-wrap gap-1.5">
            {skills.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => toggle(skill)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border font-medium transition-colors",
                  selected.includes(skill)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                )}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}