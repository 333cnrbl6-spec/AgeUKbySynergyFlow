import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";
import { format } from "date-fns";

const statusStyles = {
  enquiry: "bg-blue-50 text-blue-700 border-blue-200",
  assessment_booked: "bg-amber-50 text-amber-700 border-amber-200",
  quoted: "bg-purple-50 text-purple-700 border-purple-200",
  scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  referred_out: "bg-gray-50 text-gray-600 border-gray-200",
};

export default function RecentJobsList({ jobs }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No recent jobs to display
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {jobs.slice(0, 6).map((job) => (
        <Link 
          key={job.id} 
          to={`/jobs?id=${job.id}`}
          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground truncate">{job.client_name}</p>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {job.scheduled_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(job.scheduled_date), "dd MMM")}
              </span>
            )}
            <Badge variant="outline" className={`text-xs border ${statusStyles[job.status] || ""}`}>
              {(job.status || "").replace(/_/g, " ")}
            </Badge>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </Link>
      ))}
    </div>
  );
}