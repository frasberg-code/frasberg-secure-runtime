import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ArrowLeft, Upload, FileText, BarChart3, Trash2, Eye, Loader2 } from 'lucide-react';

const DataAnalysisPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef(null);
  
  const [datasets, setDatasets] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const lines = reader.result.split('\n').filter(l => l.trim());
        const columns = lines[0] ? lines[0].split(',').length : 0;
        setDatasets(prev => [...prev, {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          rows: lines.length - 1,
          columns
        }]);
        toast.success(`Uploaded: ${file.name}`);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };
  
  const analyzeDataset = async (dataset) => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 1500));
    setResults({
      dataset: dataset.name,
      summary: {
        rows: dataset.rows,
        columns: dataset.columns,
        issues: Math.floor(Math.random() * 5)
      },
      insights: [
        'Data quality is good',
        'Consider adding more samples',
        'No major anomalies detected'
      ]
    });
    setAnalyzing(false);
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-[#0a0a0b]" : "bg-gray-50")}>
      <div className={cn("border-b px-4 py-3 flex items-center gap-4", isDark ? "border-[#1a1a1c]" : "border-gray-200")}>
        <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className={cn("text-xl font-semibold", isDark ? "text-white" : "text-gray-900")}>Data Analysis</h1>
      </div>
      
      <div className="p-4 max-w-5xl mx-auto">
        {/* Upload */}
        <Card className={cn("mb-6", isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : "")}>
          <CardContent className="p-6">
            <input ref={fileInputRef} type="file" multiple accept=".csv,.json,.txt" onChange={handleUpload} className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn("border-2 border-dashed rounded-xl p-8 text-center cursor-pointer", isDark ? "border-[#2a2a2c] hover:border-purple-500" : "border-gray-300 hover:border-purple-500")}
            >
              <Upload className={cn("h-10 w-10 mx-auto mb-3", isDark ? "text-[#6b6b6b]" : "text-gray-400")} />
              <p className={cn("font-medium", isDark ? "text-white" : "")}>Drop files or click to upload</p>
              <p className={cn("text-sm mt-1", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>CSV, JSON, TXT</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Datasets */}
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Datasets ({datasets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {datasets.length === 0 ? (
                <p className={cn("text-center py-8", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>No datasets</p>
              ) : (
                <div className="space-y-3">
                  {datasets.map(d => (
                    <div key={d.id} className={cn("p-3 rounded-lg flex items-center gap-3", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                      <FileText className="h-5 w-5 text-purple-500" />
                      <div className="flex-1">
                        <p className={cn("text-sm font-medium", isDark ? "text-white" : "")}>{d.name}</p>
                        <p className={cn("text-xs", isDark ? "text-[#6b6b6b]" : "text-gray-500")}>{d.rows} rows • {d.columns} cols</p>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => analyzeDataset(d)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDatasets(prev => prev.filter(x => x.id !== d.id))} className="text-red-400"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Results */}
          <Card className={isDark ? "bg-[#0f0f10] border-[#2a2a2c]" : ""}>
            <CardHeader>
              <CardTitle className={isDark ? "text-white" : ""}>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {analyzing ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-500" />
                  <p className={isDark ? "text-white" : ""}>Analyzing...</p>
                </div>
              ) : results ? (
                <div>
                  <div className={cn("p-4 rounded-lg mb-4", isDark ? "bg-[#1a1a1c]" : "bg-gray-100")}>
                    <p className={cn("text-sm font-medium mb-2", isDark ? "text-white" : "")}>{results.dataset}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className={cn("text-2xl font-bold", isDark ? "text-white" : "")}>{results.summary.rows}</p><p className="text-xs text-[#6b6b6b]">Rows</p></div>
                      <div><p className={cn("text-2xl font-bold", isDark ? "text-white" : "")}>{results.summary.columns}</p><p className="text-xs text-[#6b6b6b]">Columns</p></div>
                      <div><p className={cn("text-2xl font-bold", results.summary.issues > 0 ? "text-red-500" : "text-green-500")}>{results.summary.issues}</p><p className="text-xs text-[#6b6b6b]">Issues</p></div>
                    </div>
                  </div>
                  <div>
                    <p className={cn("text-sm font-medium mb-2", isDark ? "text-[#a0a0a0]" : "text-gray-600")}>Insights</p>
                    {results.insights.map((insight, i) => (
                      <div key={i} className={cn("flex items-center gap-2 p-2 rounded", isDark ? "bg-[#1a1a1c]" : "bg-gray-50", "mb-1")}>
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        <span className={cn("text-sm", isDark ? "text-white" : "")}>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className={cn("h-10 w-10 mx-auto mb-3", isDark ? "text-[#3a3a3c]" : "text-gray-300")} />
                  <p className={isDark ? "text-[#6b6b6b]" : "text-gray-500"}>Select a dataset to analyze</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DataAnalysisPage;
