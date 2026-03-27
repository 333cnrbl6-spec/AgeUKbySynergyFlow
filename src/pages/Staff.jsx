import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Phone, Mail, ShieldCheck, ShieldAlert, Pencil } from "lucide-react";
import StaffFormDialog from "../components/staff/StaffFormDialog";

const roleStyles = {
  admin: "bg-purple-50 text-purple-700 border-purple-200",
  handyperson: "bg-blue-50 text-blue-700 border-blue-200",
  manager: "bg-amber-50 text-amber-700 border-amber-200",
  volunteer: "bg-green-50 text-green-700 border-green-200",
};

export default function Staff() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const queryClient = useQueryClient();

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.StaffMember.list("name", 50),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StaffMember.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StaffMember.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  const handleSave = async (form) => {
    if (editingStaff) {
      await updateMutation.mutateAsync({ id: editingStaff.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditingStaff(null);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Staff</h1>
          <p className="text-sm text-muted-foreground">Manage team members</p>
        </div>
        <Button onClick={() => { setEditingStaff(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="bg-card rounded-xl h-36 animate-pulse border border-border/50" />)}
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No staff members yet. Add your first team member.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(member => (
            <div key={member.id} className="bg-card rounded-xl p-5 border border-border/50 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-xs border ${roleStyles[member.role] || ""}`}>
                      {member.role}
                    </Badge>
                    <Badge variant="outline" className={`text-xs ${member.status === "active" ? "" : "opacity-50"}`}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="ghost" size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => { setEditingStaff(member); setDialogOpen(true); }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                {member.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {member.phone}</div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> {member.email}</div>
                )}
                <div className="flex items-center gap-2">
                  {member.dbs_checked ? (
                    <><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> <span className="text-emerald-600">DBS Checked</span>
                      {member.dbs_expiry && <span className="text-xs">• Expires {member.dbs_expiry}</span>}
                    </>
                  ) : (
                    <><ShieldAlert className="w-3.5 h-3.5 text-destructive" /> <span className="text-destructive">DBS Not Checked</span></>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <StaffFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editingStaff}
        onSave={handleSave}
      />
    </div>
  );
}