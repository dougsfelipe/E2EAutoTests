import React, { useState } from 'react';
import { Upload, FileText, Play, Settings, Download, AlertCircle } from 'lucide-react';

interface TestCase {
    "Test Case ID": string;
    Title: string;
    Objective: string;
    Preconditions: string;
    Steps: string;
    "Expected Result": string;
}

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Config State
    const [framework, setFramework] = useState("selenium-python-pytest");
    const [mode, setMode] = useState("full");
    const [url, setUrl] = useState("");
    const [provider, setProvider] = useState("openai");

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        try {
            const response = await fetch(`${apiUrl}/api/parse-csv`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to parse CSV');

            const data = await response.json();
            setTestCases(data.test_cases);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setFile(null);
        }
    };

    const handleGenerate = async () => {
        if (!testCases.length) return;

        setGenerating(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        try {
            const response = await fetch(`${apiUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    test_plan: testCases,
                    framework,
                    url,
                    mode,
                    api_key: "",
                    provider
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.detail || 'Generation failed';
                throw new Error(errorMessage);
            }

            // Handle File Download
            const blob = await response.blob();

            // Extract filename from header
            const disposition = response.headers.get('Content-Disposition');
            let filename = 'test_automation_project.zip';
            if (disposition && disposition.includes('filename=')) {
                filename = disposition.split('filename=')[1].replace(/"/g, '');
            }

            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const downloadTemplate = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const headers = ["Test Case ID", "Title", "Objective", "Preconditions", "Steps", "Expected Result"];
        const exampleRow = ["TC-001", "Validate search with a valid keyword", "Verify that Google returns relevant search results", "Browser open, internet available", "1. Go to google.com\n2. Enter \"Selenium WebDriver\"\n3. Click Search", "Google shows results page with links related to \"Selenium WebDriver\""];
        const csvContent = [headers.join(","), exampleRow.map(f => `"${f.replace(/"/g, '""')}"`).join(",")].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'test_case_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                        AI Test Automation Generator
                    </h1>
                    <p className="text-slate-600">Transform CSV test cases into production-ready Selenium code instantly.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-blue-600" /> Configuration
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">AI Provider</label>
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    >
                                        <option value="mock">Mock (Free/Test)</option>
                                        <option value="openai">OpenAI (GPT-4o)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Test Framework</label>
                                    <select
                                        value={framework}
                                        onChange={(e) => setFramework(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    >
                                        <option value="selenium-python-pytest">Python + Selenium</option>
                                        <option value="cypress-javascript">Cypress + JavaScript</option>
                                    </select>
                                </div>



                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Target URL (Optional)</label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Generation Mode</label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setMode('template')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${mode === 'template' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Template
                                        </button>
                                        <button
                                            onClick={() => setMode('full')}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border ${mode === 'full' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            Full Code
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-600 to-violet-600 p-6 rounded-2xl shadow-lg text-white">
                            <h3 className="font-semibold text-lg mb-2">Ready to Generate?</h3>
                            <p className="text-blue-100 text-sm mb-4">
                                {testCases.length > 0
                                    ? `${testCases.length} test cases loaded and ready.`
                                    : "Upload a CSV file to get started."}
                            </p>
                            <button
                                onClick={handleGenerate}
                                disabled={!testCases.length || generating}
                                className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg
                  ${!testCases.length || generating
                                        ? 'bg-white/20 cursor-not-allowed text-white/50'
                                        : 'bg-white text-blue-600 hover:bg-blue-50'}`}
                            >
                                {generating ? (
                                    <>Processing...</>
                                ) : (
                                    <><Play className="w-5 h-5" /> Generate Code</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Upload & Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upload Area */}
                        <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${file ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}>
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                                    <Upload className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">
                                    {file ? file.name : "Upload Test Plan CSV"}
                                </h3>
                                <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto">
                                    Drag and drop or click to browse. Must follow the required CSV format.
                                </p>

                                <button
                                    onClick={downloadTemplate}
                                    className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center justify-center gap-1 transition-colors z-10 relative"
                                >
                                    <Download className="w-4 h-4" /> Download CSV Template
                                </button>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className={`p-4 rounded-xl flex items-center gap-3 border ${error.includes('429') || error.includes('quota') ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{error.includes('429') || error.includes('quota') ? 'OpenAI API Quota Exceeded' : 'Error Occurred'}</p>
                                    <p className="text-sm">
                                        {error.includes('429') || error.includes('quota')
                                            ? 'The OpenAI API key has run out of credits. Please check your billing at platform.openai.com.'
                                            : error}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Preview Table */}
                        {testCases.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4" /> Test Cases Preview
                                    </h3>
                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {testCases.length} Items
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="p-4">ID</th>
                                                <th className="p-4">Title</th>
                                                <th className="p-4">Steps</th>
                                                <th className="p-4">Expected Result</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {testCases.slice(0, 5).map((tc, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-medium text-slate-900">{tc["Test Case ID"]}</td>
                                                    <td className="p-4 text-slate-700">{tc.Title}</td>
                                                    <td className="p-4 text-slate-600 max-w-xs truncate" title={tc.Steps}>{tc.Steps}</td>
                                                    <td className="p-4 text-slate-600 max-w-xs truncate">{tc["Expected Result"]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {testCases.length > 5 && (
                                    <div className="p-3 text-center text-xs text-slate-400 border-t border-slate-100">
                                        And {testCases.length - 5} more...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
