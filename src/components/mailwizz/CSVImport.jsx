import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  importSubscribersCSV,
  fetchListSubscribers,
  selectImportStatus,
  selectMailwizzLoading,
  selectMailwizzError
} from '../../store/slices/mailwizzSlice';

const CSVImport = ({ listId }) => {
  const dispatch = useDispatch();
  const importStatus = useSelector(selectImportStatus);
  const loading = useSelector(selectMailwizzLoading);
  const error = useSelector(selectMailwizzError);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    if (!listId || listId === 'undefined') {
      alert('Invalid list selected');
      return;
    }

    const result = await dispatch(importSubscribersCSV({ listUid: listId, file: selectedFile }));
    
    if (result.type === 'mailwizz/importSubscribersCSV/fulfilled') {
      // Refresh subscribers list after successful import
      dispatch(fetchListSubscribers({ listUid: listId }));
      setSelectedFile(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            CSV Import
          </h3>
          <p className="text-sm text-gray-500">
            Import subscribers from a CSV file. The CSV should have columns: email, first_name, last_name
          </p>
        </div>

        {/* CSV Format Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>First row should contain headers: <code>email,first_name,last_name</code></li>
            <li>Email column is required</li>
            <li>First name and last name are optional</li>
            <li>Maximum file size: 10MB</li>
          </ul>
          <div className="mt-2 text-xs text-blue-600">
            Example: <code>email,first_name,last_name<br/>john@example.com,John,Doe</code>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : selectedFile 
                ? 'border-green-400 bg-green-50' 
                : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-700">
                {selectedFile.name}
              </p>
              <p className="text-xs text-green-600">
                Size: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={clearFile}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">
                Drag and drop your CSV file here, or{' '}
                <label className="text-blue-600 hover:text-blue-800 cursor-pointer underline">
                  browse
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="sr-only"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500">CSV files only, max 10MB</p>
            </div>
          )}
        </div>

        {/* Import Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleImport}
            disabled={!selectedFile || loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !selectedFile || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </div>
            ) : (
              'Import Subscribers'
            )}
          </button>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className={`mt-4 p-4 rounded-md ${
            importStatus.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  importStatus.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {importStatus.success ? 'Import Successful' : 'Import Failed'}
                </h3>
                <div className={`mt-2 text-sm ${
                  importStatus.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {importStatus.message}
                </div>
                {importStatus.success && importStatus.imported && (
                  <div className="mt-2 text-sm text-green-700">
                    Successfully imported {importStatus.imported} subscribers
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImport;
