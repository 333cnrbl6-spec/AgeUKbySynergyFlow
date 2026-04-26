import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { useBranch } from '@/lib/BranchContext';

const FIELD_MAPPING = {
  clients: {
    'ClientID': 'id',
    'FirstName': 'first_name',
    'LastName': 'last_name',
    'Phone': 'phone',
    'Email': 'email',
    'Address1': 'address_line_1',
    'Address2': 'address_line_2',
    'Town': 'town',
    'Postcode': 'postcode',
    'DateOfBirth': 'date_of_birth',
    'Notes': 'notes',
    'Status': 'status'
  },
  volunteers: {
    'VolunteerID': 'id',
    'Name': 'name',
    'Email': 'email',
    'Phone': 'phone',
    'Location': 'location',
    'Skills': 'skills',
    'JoinedDate': 'joined_date',
    'Status': 'status',
    'Notes': 'notes'
  },
  jobs: {
    'JobID': 'id',
    'Title': 'title',
    'Description': 'description',
    'ClientID': 'client_id',
    'AssignedTo': 'assigned_to_name',
    'Status': 'status',
    'ScheduledDate': 'scheduled_date',
    'DurationHours': 'duration_hours',
    'CostEstimate': 'cost_estimate',
    'Notes': 'notes'
  }
};

const REQUIRED_FIELDS = {
  clients: ['FirstName', 'LastName', 'Phone'],
  volunteers: ['Name', 'Email'],
  jobs: ['Title', 'ClientID']
};

export default function BuryAssistCSVImporter() {
  const { currentBranch } = useBranch();
  const [file, setFile] = useState(null);
  const [entityType, setEntityType] = useState('clients');
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customMapping, setCustomMapping] = useState({});

  const parseCSV = (text) => {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid CSV file content');
    }

    const lines = text.trim().split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file is empty or has no data rows');
    }

    const headers = lines[0].split(',').map(h => h.trim());
    if (headers.length === 0) {
      throw new Error('CSV header row is empty');
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const row = {};
      const values = lines[i].split(',').map(v => v.trim());
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
    
    return { headers, rows };
  };

  const validateRow = (row, headers) => {
    const required = REQUIRED_FIELDS[entityType];
    const mapping = { ...FIELD_MAPPING[entityType], ...customMapping };
    const rowErrors = [];

    required.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        rowErrors.push(`Missing required field: ${field}`);
      }
    });

    return rowErrors;
  };

  const mapRow = (row) => {
    const mapping = { ...FIELD_MAPPING[entityType], ...customMapping };
    const mapped = { branch_id: currentBranch };

    Object.entries(mapping).forEach(([buryField, internalField]) => {
      if (row[buryField]) {
        mapped[internalField] = row[buryField];
      }
    });

    return mapped;
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Validate file type
    if (!uploadedFile.name.endsWith('.csv')) {
      setErrors([{ error: 'File must be a CSV (.csv)' }]);
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (uploadedFile.size > maxSize) {
      setErrors([{ error: `File is too large (${(uploadedFile.size / 1024 / 1024).toFixed(2)}MB). Maximum 5MB.` }]);
      return;
    }

    setFile(uploadedFile);
    setErrors([]);
    setPreview([]);
    setIsLoading(true);

    try {
      const text = await uploadedFile.text();
      const { headers, rows } = parseCSV(text);

      // Validate branch assigned
      if (!currentBranch) {
        throw new Error('No branch assigned. Contact your administrator.');
      }

      // Validate headers exist
      const mapping = FIELD_MAPPING[entityType];
      const availableFields = Object.keys(mapping).filter(f => headers.includes(f));

      if (availableFields.length === 0) {
        throw new Error(`No recognized BuryAssist fields found. Expected: ${Object.keys(mapping).slice(0, 3).join(', ')}...`);
      }

      // Limit preview to 10 rows, validate all rows in background
      const previewData = [];
      const rowErrors = [];
      let validRowCount = 0;

      rows.forEach((row, idx) => {
        const validationErrors = validateRow(row, headers);
        if (validationErrors.length > 0) {
          rowErrors.push({ row: idx + 2, errors: validationErrors });
        } else {
          validRowCount++;
          if (previewData.length < 10) {
            previewData.push(mapRow(row));
          }
        }
      });

      setPreview(previewData);
      setErrors(rowErrors);

      if (validRowCount === 0) {
        setErrors([...rowErrors, { error: 'No valid rows found in CSV' }]);
      }
    } catch (error) {
      setErrors([{ error: error?.message || 'Failed to parse CSV file' }]);
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    // Final validation
    if (!currentBranch) {
      setErrors([{ error: 'No branch assigned. Cannot import data.' }]);
      return;
    }

    setIsLoading(true);
    try {
      const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1, -1); // clients → Client
      
      // Validate entity exists
      if (!base44.entities[entityName]) {
        throw new Error(`Entity ${entityName} not found`);
      }

      // Perform bulk create with error handling
      const results = await base44.entities[entityName].bulkCreate(preview);
      
      if (!results || results.length === 0) {
        throw new Error('Import returned no results');
      }

      setImportSuccess({
        total: preview.length,
        imported: results.length,
        timestamp: new Date().toLocaleString()
      });

      // Reset state after 3 seconds
      setTimeout(() => {
        setFile(null);
        setPreview([]);
        setErrors([]);
        setImportSuccess(null);
      }, 3000);
    } catch (error) {
      const msg = error?.message || 'Unknown import error';
      console.error('[BuryAssistCSVImporter] Import failed:', msg);
      setErrors([{ error: `Import failed: ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload({ target: { files: [droppedFile] } });
    }
  };

  return (
    <div className="space-y-6">
      {/* Entity Type Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 1: Select Data Type</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {Object.keys(FIELD_MAPPING).map(type => (
            <Button
              key={type}
              variant={entityType === type ? 'default' : 'outline'}
              onClick={() => {
                setEntityType(type);
                setFile(null);
                setPreview([]);
                setErrors([]);
              }}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step 2: Upload CSV File</CardTitle>
          <CardDescription>
            File format: CSV with BuryAssist columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDrop={handleDragDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-accent/30 transition-colors"
          >
            <Upload className="mx-auto w-8 h-8 text-muted-foreground mb-3" />
            <p className="text-sm font-medium mb-1">Drag CSV file here or click to upload</p>
            <p className="text-xs text-muted-foreground mb-4">
              Maximum 5,000 rows, CSV format only
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button asChild variant="outline">
                <span>Select File</span>
              </Button>
            </label>
          </div>
          {file && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">{file.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Mapping */}
      {file && (
        <Card>
          <CardHeader>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 cursor-pointer w-full"
            >
              <CardTitle className="text-lg">Step 3: Field Mapping (Optional)</CardTitle>
              <ChevronDown className={`w-5 h-5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </CardHeader>
          {showAdvanced && (
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground">Customize field mappings (leave blank to use defaults)</p>
              {Object.keys(FIELD_MAPPING[entityType]).map(buryField => (
                <div key={buryField} className="flex gap-2 items-center">
                  <span className="text-sm font-medium w-32">{buryField}</span>
                  <input
                    type="text"
                    placeholder={FIELD_MAPPING[entityType][buryField]}
                    onChange={(e) => setCustomMapping({ ...customMapping, [buryField]: e.target.value || FIELD_MAPPING[entityType][buryField] })}
                    className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            <strong>{errors.length} rows have validation errors:</strong>
            <ul className="mt-2 text-sm space-y-1">
              {errors.slice(0, 5).map((err, idx) => (
                <li key={idx}>
                  {err.row ? `Row ${err.row}: ${err.errors.join(', ')}` : err.error}
                </li>
              ))}
              {errors.length > 5 && <li className="text-xs text-muted-foreground">... and {errors.length - 5} more</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Step 4: Preview ({preview.length} records ready)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {Object.keys(preview[0] || {}).filter(k => k !== 'branch_id').map(key => (
                      <th key={key} className="px-3 py-2 text-left font-medium border-b">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-accent/30">
                      {Object.entries(row).filter(([k]) => k !== 'branch_id').map(([key, value]) => (
                        <td key={key} className="px-3 py-2 text-xs">{String(value).substring(0, 30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              onClick={handleImport}
              disabled={isLoading || preview.length === 0}
              className="w-full"
            >
              {isLoading ? 'Importing...' : `Import ${preview.length} ${entityType}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {importSuccess && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>✓ Import successful!</strong> {importSuccess.imported} {entityType} imported on {importSuccess.timestamp}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}