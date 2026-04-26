import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import BuryAssistCSVImporter from '@/components/import/BuryAssistCSVImporter';
import { AlertCircle, Upload } from 'lucide-react';

export default function DataImport() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Import</h1>
        <p className="text-muted-foreground mt-2">Securely migrate BuryAssist data to Age UK Network Hub</p>
      </div>

      {/* Security Notice */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <strong>Privacy & Security:</strong> All data is imported to your branch only. CSV files are processed locally and never stored. Branch isolation ensures data security.
          </div>
        </CardContent>
      </Card>

      {/* Import Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            BuryAssist CSV Importer
          </CardTitle>
          <CardDescription>
            Upload CSV files from BuryAssist and automatically map fields to Age UK entities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BuryAssistCSVImporter />
        </CardContent>
      </Card>

      {/* Field Mapping Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">CSV Field Mapping Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Clients</h4>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">BuryAssist Column</th>
                  <th className="px-3 py-2 text-left font-medium">Age UK Field</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['ClientID', 'id'],
                  ['FirstName', 'first_name'],
                  ['LastName', 'last_name'],
                  ['Phone', 'phone (required)'],
                  ['Email', 'email'],
                  ['Address1', 'address_line_1'],
                  ['Address2', 'address_line_2'],
                  ['Town', 'town'],
                  ['Postcode', 'postcode'],
                  ['DateOfBirth', 'date_of_birth'],
                ].map(([bury, internal]) => (
                  <tr key={bury} className="border-b hover:bg-accent/30">
                    <td className="px-3 py-2">{bury}</td>
                    <td className="px-3 py-2 text-muted-foreground">{internal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Volunteers</h4>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">BuryAssist Column</th>
                  <th className="px-3 py-2 text-left font-medium">Age UK Field</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['VolunteerID', 'id'],
                  ['Name', 'name (required)'],
                  ['Email', 'email (required)'],
                  ['Phone', 'phone'],
                  ['Location', 'location'],
                  ['Skills', 'skills'],
                  ['JoinedDate', 'joined_date'],
                  ['Status', 'status'],
                ].map(([bury, internal]) => (
                  <tr key={bury} className="border-b hover:bg-accent/30">
                    <td className="px-3 py-2">{bury}</td>
                    <td className="px-3 py-2 text-muted-foreground">{internal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Jobs</h4>
            <table className="w-full text-sm border-collapse">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">BuryAssist Column</th>
                  <th className="px-3 py-2 text-left font-medium">Age UK Field</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['JobID', 'id'],
                  ['Title', 'title (required)'],
                  ['Description', 'description'],
                  ['ClientID', 'client_id (required)'],
                  ['AssignedTo', 'assigned_to_name'],
                  ['Status', 'status'],
                  ['ScheduledDate', 'scheduled_date'],
                  ['DurationHours', 'duration_hours'],
                  ['CostEstimate', 'cost_estimate'],
                ].map(([bury, internal]) => (
                  <tr key={bury} className="border-b hover:bg-accent/30">
                    <td className="px-3 py-2">{bury}</td>
                    <td className="px-3 py-2 text-muted-foreground">{internal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Prepare Your CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>Export from BuryAssist:</strong> Open your database and export Clients, Volunteers, and Jobs tables as CSV files</li>
            <li><strong>Select Entity Type:</strong> Choose which data you're importing (Clients, Volunteers, or Jobs)</li>
            <li><strong>Upload CSV:</strong> Drag & drop or click to upload your file</li>
            <li><strong>Verify Preview:</strong> Check the preview for any validation errors before import</li>
            <li><strong>Confirm Import:</strong> Click "Import" to add records to your branch</li>
            <li><strong>Check Results:</strong> Verify the data was imported correctly in the relevant section</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}