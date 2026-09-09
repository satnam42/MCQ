import React, { useState } from 'react';
import api from '../../services/api';
import { Upload, FileText, CheckCircle2, AlertTriangle, Download, RefreshCw, XCircle, FileCheck, SkipForward, Code, Copy, Check } from 'lucide-react';

const ImportQuestionsPage = () => {
  const [activeTab, setActiveTab] = useState('csv'); // 'csv' | 'json'

  // CSV Tab State
  const [csvFile, setCsvFile] = useState(null);

  // JSON Tab State
  const [jsonFile, setJsonFile] = useState(null);
  const [jsonText, setJsonText] = useState('');

  // General State
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const sampleCsvContent = `question,optionA,optionB,optionC,optionD,correctOption,explanation,topic,difficulty,source
"ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਕਿਸ ਸਾਹਿਤਕ ਧਾਰਾ ਨਾਲ ਸੰਬੰਧਿਤ ਹਨ?","ਗੁਰਮਤਿ ਕਾਵਿ","ਸੂਫ਼ੀ ਕਾਵਿ","ਕਿੱਸਾ ਕਾਵਿ","ਬੀਰ ਕਾਵਿ","B","ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਪੰਜਾਬ ਦੇ ਪ੍ਰਮੁੱਖ ਸੂਫ਼ੀ ਕਵੀ ਹਨ।","ਸੂਫ਼ੀ ਸਾਹਿਤ","easy","ਪੰਜਾਬੀ ਸਾਹਿਤ ਇਤਿਹਾਸ"
"ਨਾਓ ਦੀਆਂ ਕਿੰਨੀਆਂ ਕਿਸਮਾਂ ਹੁੰਦੀਆਂ ਹਨ?","3","4","5","6","C","ਨਾਓ ਦੀਆਂ 5 ਕਿਸਮਾਂ ਹੁੰਦੀਆਂ ਹਨ।","ਪੰਜਾਬੀ ਵਿਆਕਰਣ","medium","ਵਿਆਕਰਣ ਸਰੋਤ"`;

  const sampleJsonStructure = [
    {
      question: "ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਕਿਸ ਸਾਹਿਤਕ ਧਾਰਾ ਨਾਲ ਸੰਬੰਧਿਤ ਹਨ?",
      optionA: "ਗੁਰਮਤਿ ਕਾਵਿ",
      optionB: "ਸੂਫ਼ੀ ਕਾਵਿ",
      optionC: "ਕਿੱਸਾ ਕਾਵਿ",
      optionD: "ਬੀਰ ਕਾਵਿ",
      correctOption: "B",
      explanation: "ਬੁੱਲ੍ਹੇ ਸ਼ਾਹ ਪੰਜਾਬ ਦੇ ਪ੍ਰਮੁੱਖ ਸੂਫ਼ੀ ਕਵੀ ਹਨ।",
      topic: "ਸੂਫ਼ੀ ਸਾਹਿਤ",
      difficulty: "easy",
      source: "ਪੰਜਾਬੀ ਸਾਹਿਤ ਇਤਿਹਾਸ"
    },
    {
      question: "ਨਾਓ ਦੀਆਂ ਕਿੰਨੀਆਂ ਕਿਸਮਾਂ ਹੁੰਦੀਆਂ ਹਨ?",
      optionA: "3",
      optionB: "4",
      optionC: "5",
      optionD: "6",
      correctOption: "C",
      explanation: "ਨਾਓ ਦੀਆਂ 5 ਕਿਸਮਾਂ ਹੁੰਦੀਆਂ ਹਨ: ਆਮ ਨਾਂਵ, ਖਾਸ ਨਾਂਵ, ਇਕੱਠਵਾਚਕ, ਵਸਤੂਵਾਚਕ, ਭਾਵਵਾਚਕ।",
      topic: "ਪੰਜਾਬੀ ਵਿਆਕਰਣ",
      difficulty: "medium",
      source: "ਪੰਜਾਬੀ ਵਿਆਕਰਣ ਸਰੋਤ"
    }
  ];

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_punjabi_mcqs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySampleJson = () => {
    const formatted = JSON.stringify(sampleJsonStructure, null, 2);
    setJsonText(formatted);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) return alert('Please select a CSV file to upload.');

    const formData = new FormData();
    formData.append('file', csvFile);

    setUploading(true);
    setImportResult(null);
    setErrorMessage('');

    try {
      const res = await api.post('/questions/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setImportResult(res.data.data?.summary || res.data.data);
      } else {
        setErrorMessage(res.data.message || 'CSV Import failed.');
      }
    } catch (err) {
      console.error('CSV Import Error:', err);
      setErrorMessage(err.response?.data?.message || 'CSV file import failed. Check file format.');
    } finally {
      setUploading(false);
    }
  };

  const handleJsonUpload = async (e) => {
    e.preventDefault();

    if (!jsonFile && !jsonText.trim()) {
      return alert('Please select a .json file OR paste JSON text in the text area.');
    }

    setUploading(true);
    setImportResult(null);
    setErrorMessage('');

    try {
      let res;
      if (jsonFile) {
        const formData = new FormData();
        formData.append('file', jsonFile);
        res = await api.post('/questions/import-json', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/questions/import-json', {
          jsonContent: jsonText.trim(),
        });
      }

      if (res.data.success) {
        setImportResult(res.data.data?.summary || res.data.data);
      } else {
        setErrorMessage(res.data.message || 'JSON Import failed.');
      }
    } catch (err) {
      console.error('JSON Import Error:', err);
      setErrorMessage(err.response?.data?.message || 'JSON import failed. Check JSON syntax.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-2">
        <div className="flex items-center space-x-3 text-amber-600">
          <Upload className="w-8 h-8" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bulk Question Importer
          </h1>
        </div>
        <p className="text-sm text-slate-600">
          Upload bulk Punjabi MCQs via CSV file or paste JSON structure directly. Existing records are automatically skipped.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => {
            setActiveTab('csv');
            setImportResult(null);
            setErrorMessage('');
          }}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'csv'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-500" />
          <span>CSV File Upload</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('json');
            setImportResult(null);
            setErrorMessage('');
          }}
          className={`flex-1 py-3 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center space-x-2 ${
            activeTab === 'json'
              ? 'bg-white text-slate-900 shadow-md'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Code className="w-4 h-4 text-purple-500" />
          <span>JSON Upload & Text Area</span>
        </button>
      </div>

      {/* TAB 1: CSV FILE UPLOAD */}
      {activeTab === 'csv' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-950 text-sm">Download Sample CSV Template</h3>
                <p className="text-xs text-amber-800">Headers: question, optionA, optionB, optionC, optionD, correctOption, explanation, topic, difficulty, source</p>
              </div>
            </div>
            <button
              onClick={handleDownloadSampleCsv}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Template</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <form onSubmit={handleCsvUpload} className="space-y-6">
              <div className={`border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${
                csvFile ? 'border-amber-500 bg-amber-50/40' : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
              }`}>
                {csvFile ? (
                  <div className="space-y-2">
                    <FileCheck className="w-12 h-12 text-amber-600 mx-auto" />
                    <p className="text-sm font-bold text-slate-900">{csvFile.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{(csvFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">Select or Drag CSV File</p>
                    <p className="text-xs text-slate-500">File format: .csv</p>
                  </div>
                )}
                
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCsvFile(e.target.files[0]);
                      setImportResult(null);
                    }
                  }}
                  className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={!csvFile || uploading}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-base shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
                    <span>Processing CSV Questions...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span>Start CSV Import</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: JSON FILE & DIRECT TEXTAREA UPLOAD */}
      {activeTab === 'json' && (
        <div className="space-y-6">
          {/* Sample JSON Action Header */}
          <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Code className="w-6 h-6 text-purple-600 shrink-0" />
              <div>
                <h3 className="font-bold text-purple-950 text-sm">Sample JSON Data Template</h3>
                <p className="text-xs text-purple-800">Copy sample JSON array structure directly into the text area below</p>
              </div>
            </div>
            <button
              onClick={handleCopySampleJson}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shrink-0 shadow-sm transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Sample Copied!' : 'Copy Sample JSON'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-6">
            <form onSubmit={handleJsonUpload} className="space-y-6">
              
              {/* Option A: Select .json file */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Option A: Select .json File</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setJsonFile(e.target.files[0]);
                      setImportResult(null);
                    }
                  }}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Option B: Copy Paste JSON Textarea */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-700">Option B: Copy-Paste JSON Array Text</label>
                  <span className="text-[11px] text-slate-400 font-mono">Format: [ {`{ question, optionA, ... }`} ]</span>
                </div>
                <textarea
                  rows={8}
                  placeholder={`[\n  {\n    "question": "ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਦੀ ਲਿਪੀ ਕਿਹੜੀ ਹੈ?",\n    "optionA": "ਦੇਵਨਾਗਰੀ",\n    "optionB": "ਗੁਰਮੁਖੀ",\n    "optionC": "ਸ਼ਾਹਮੁਖੀ",\n    "optionD": "ਰੋਮਨ",\n    "correctOption": "B",\n    "topic": "ਪੰਜਾਬੀ ਭਾਸ਼ਾ",\n    "difficulty": "easy"\n  }\n]`}
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (e.target.value) setJsonFile(null);
                  }}
                  className="w-full p-4 rounded-2xl border border-slate-300 font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
                />
              </div>

              <button
                type="submit"
                disabled={(!jsonFile && !jsonText.trim()) || uploading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl text-base shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-200" />
                    <span>Processing JSON Questions...</span>
                  </>
                ) : (
                  <>
                    <Code className="w-5 h-5 text-purple-200" />
                    <span>Process JSON Import</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 flex items-start space-x-3 text-rose-800">
          <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm text-rose-900">Import Error</h3>
            <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* IMPORT SUMMARY RESULTS CARD */}
      {importResult && (
        <div className="bg-white rounded-3xl p-8 shadow-md border border-slate-200 space-y-6 animate-in fade-in duration-300">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <span>Import Summary Results</span>
            </h2>
            <span className="text-xs font-mono font-bold bg-slate-100 px-3 py-1 rounded-full text-slate-700">
              Total Processed: {importResult.totalRows || 0}
            </span>
          </div>

          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
              <span className="block text-2xl font-black text-slate-900">
                {importResult.totalRows || 0}
              </span>
              <span className="text-xs font-semibold text-slate-600">Total Records</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
              <span className="block text-2xl font-black text-emerald-800">
                {importResult.successful || importResult.inserted || 0}
              </span>
              <span className="text-xs font-semibold text-emerald-700">Added to Database</span>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-center">
              <span className="block text-2xl font-black text-amber-800">
                {importResult.skipped || importResult.duplicates || 0}
              </span>
              <span className="text-xs font-semibold text-amber-700">Skipped (Already Present)</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center">
              <span className="block text-2xl font-black text-rose-800">
                {importResult.invalid || importResult.failed || 0}
              </span>
              <span className="text-xs font-semibold text-rose-700">Failed / Invalid</span>
            </div>

          </div>

          {/* Error & Skipped Log Details Table */}
          {importResult.errors && importResult.errors.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                <SkipForward className="w-4 h-4 text-amber-500" />
                <span>Skipped & Failed Records Log ({importResult.errors.length}):</span>
              </h3>

              <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs">
                {importResult.errors.map((err, idx) => {
                  const isSkipped = err.status?.includes('Skipped') || err.message?.includes('Duplicate') || err.message?.includes('present');
                  return (
                    <div key={idx} className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSkipped ? 'bg-amber-50/50' : 'bg-rose-50/50'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                          Item #{err.row}
                        </span>
                        <span className="font-gurmukhi text-slate-800 font-medium truncate max-w-xs">
                          {err.question || 'N/A'}
                        </span>
                      </div>
                      <div className={`font-semibold text-[11px] ${isSkipped ? 'text-amber-700' : 'text-rose-700'}`}>
                        {err.message || err.reason || 'Skipped'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold text-center">
              🎉 All records were validated and successfully added to the database!
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default ImportQuestionsPage;
