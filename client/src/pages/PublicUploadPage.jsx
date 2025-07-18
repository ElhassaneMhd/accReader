import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Zap,
} from "lucide-react";
import { parseCSVFile } from "@/utils/csvParser";
import { analyzeEmailData } from "@/utils/dataAnalysis";
import StatsCards from "@/components/dashboard/StatsCards";
import ChartSection from "@/components/dashboard/ChartSection";

const PublicUploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [fileName, setFileName] = useState("");

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (
        selectedFile.type !== "text/csv" &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setError("Please select a valid CSV file");
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
    }
  }, []);

  // Handle file upload and processing
  const handleUpload = useCallback(async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      console.log("🔄 Processing uploaded file:", file.name);

      // Parse CSV file
      const parsedData = await parseCSVFile(file);

      if (!parsedData || parsedData.length === 0) {
        throw new Error("The CSV file appears to be empty or invalid");
      }

      console.log(`✅ Parsed ${parsedData.length} records from CSV`);

      // Set the data
      setData(parsedData);

      // Analyze the data
      const analysisResult = analyzeEmailData(parsedData);
      
      // Transform analysis to flatten overview properties for StatsCards compatibility
      const flattenedAnalysis = {
        ...analysisResult,
        ...analysisResult.overview, // Flatten overview properties to top level
      };
      
      setAnalysis(flattenedAnalysis);

      console.log("📊 Analysis completed:", flattenedAnalysis);
    } catch (err) {
      console.error("❌ Error processing file:", err);
      setError(err.message || "Failed to process the CSV file");
      setData([]);
      setAnalysis(null);
    } finally {
      setUploading(false);
    }
  }, [file]);

  // Handle drag and drop
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (
        droppedFile.type !== "text/csv" &&
        !droppedFile.name.endsWith(".csv")
      ) {
        setError("Please select a valid CSV file");
        return;
      }
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setError(null);
    }
  }, []);

  // Reset everything
  const handleReset = useCallback(() => {
    setFile(null);
    setFileName("");
    setData([]);
    setAnalysis(null);
    setError(null);
    setUploading(false);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Email Analytics Viewer
                </h1>
                <p className="text-gray-400 text-sm">
                  Upload your CSV file to analyze email delivery statistics
                </p>
              </div>
            </div>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload size={20} className="text-blue-400" />
                Upload CSV File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  file
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-600 hover:border-gray-500 bg-gray-700/30"
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  {file ? (
                    <>
                      <CheckCircle size={48} className="text-green-400" />
                      <div>
                        <p className="text-lg font-medium text-green-400">
                          File Selected
                        </p>
                        <p className="text-gray-300 font-medium">{fileName}</p>
                        <p className="text-gray-400 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText size={48} className="text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-300">
                          Drop your CSV file here or click to browse
                        </p>
                        <p className="text-gray-400 text-sm">
                          Supports CSV files up to 50MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* File Input */}
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="flex-1 cursor-pointer">
                  <Button
                    variant="outline"
                    className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    asChild
                  >
                    <span>
                      <FileText size={16} className="mr-2" />
                      Choose File
                    </span>
                  </Button>
                </label>

                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {uploading ? (
                    <>
                      <Clock size={16} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap size={16} className="mr-2" />
                      Analyze
                    </>
                  )}
                </Button>

                {(file || data.length > 0) && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Reset
                  </Button>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {data.length > 0 && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    <span className="text-green-300 text-sm">
                      Successfully processed {data.length.toLocaleString()}{" "}
                      records from {fileName}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Display */}
          {analysis && data.length > 0 && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCards analysis={analysis} />
              </div>

              {/* Chart Section */}
              <ChartSection
                analysis={analysis}
                filteredData={data}
                showFilters={false} // Hide filters for public view
              />

              {/* Additional Info Card */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity size={20} className="text-green-400" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {analysis?.totalEmails?.toLocaleString() || "0"}
                      </div>
                      <div className="text-gray-400 text-sm">Total Records</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {analysis?.deliveryRate?.toFixed(1) || "0"}%
                      </div>
                      <div className="text-gray-400 text-sm">Delivery Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">
                        {Object.keys(analysis?.vmtaPerformance || {}).length}
                      </div>
                      <div className="text-gray-400 text-sm">VMTA Sources</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Instructions */}
          {!data.length && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail size={20} className="text-blue-400" />
                  How to Use
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-300">
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white">1</Badge>
                    <div>
                      <h3 className="font-medium">Upload Your CSV File</h3>
                      <p className="text-gray-400 text-sm">
                        Select or drag & drop your email delivery CSV file. The
                        file should contain email delivery data with standard
                        PMTA log format.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white">2</Badge>
                    <div>
                      <h3 className="font-medium">Analyze Data</h3>
                      <p className="text-gray-400 text-sm">
                        Click "Analyze" to process your data and generate
                        comprehensive statistics about delivery rates, bounce
                        types, and performance metrics.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge className="bg-blue-600 text-white">3</Badge>
                    <div>
                      <h3 className="font-medium">View Results</h3>
                      <p className="text-gray-400 text-sm">
                        Explore detailed charts and statistics showing delivery
                        performance, bounce analysis, and time-based trends.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicUploadPage;
