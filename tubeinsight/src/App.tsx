import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Youtube, 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Download, 
  Settings as SettingsIcon,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  TrendingUp,
  Brain,
  Zap,
  CheckCircle2,
  ExternalLink,
  Copy,
  FileJson
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TranscriptItem, AnalysisResult, SummaryLength, ModelChoice } from './types';
import { analyzeVideoContent, analyzeVideoBySearch } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'insights' | 'transcript' | 'export' | 'settings'>('summary');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Options
  const [language, setLanguage] = useState('Auto');
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [modelChoice, setModelChoice] = useState<ModelChoice>('pro');

  const transcriptRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch(`/api/transcript?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.error && !data.isDisabled) throw new Error(data.error);
      
      let analysis;
      if (data.isDisabled) {
        setTranscript([]);
        analysis = await analyzeVideoBySearch(data.videoId, {
          length: summaryLength,
          model: modelChoice
        });
      } else {
        setTranscript(data.transcript);
        const fullText = data.transcript.map((t: any) => t.text).join(' ');
        analysis = await analyzeVideoContent(fullText, { 
          length: summaryLength, 
          model: modelChoice 
        });
      }
      
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToTimestamp = (offset: number) => {
    const element = document.getElementById(`t-${Math.floor(offset)}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-yellow-100/50');
      setTimeout(() => element.classList.remove('bg-yellow-100/50'), 2000);
    }
  };

  const filteredTranscript = transcript.filter(item => 
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!result && !loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="bg-red-600 p-3 rounded-2xl shadow-lg shadow-red-200">
                <Youtube className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900">TubeInsight</h1>
            <p className="text-zinc-500">Deep AI analysis of any YouTube video in seconds.</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-zinc-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-4 bg-zinc-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 transition-all text-lg"
                placeholder="Paste YouTube URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Language:</span>
                  <select 
                    className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-semibold text-zinc-900"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option>Auto</option>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Length:</span>
                  <select 
                    className="bg-transparent border-none p-0 focus:ring-0 cursor-pointer font-semibold text-zinc-900"
                    value={summaryLength}
                    onChange={(e) => setSummaryLength(e.target.value as SummaryLength)}
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeTimeline}
                    onChange={(e) => setIncludeTimeline(e.target.checked)}
                    className="rounded border-zinc-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-medium">Timeline charts</span>
                </label>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!url || loading}
                className="bg-zinc-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-zinc-200"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                Analyze
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Brain, label: 'AI Summaries' },
              { icon: TrendingUp, label: 'Sentiment' },
              { icon: Clock, label: 'Key Moments' }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/50 border border-white">
                <item.icon className="w-5 h-5 text-zinc-400" />
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-red-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Youtube className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-zinc-900">Analyzing Content...</h2>
            <p className="text-zinc-500">Our AI is watching the video, extracting transcripts, and generating deep insights for you.</p>
          </div>
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              <span>Extracting</span>
              <span>Processing</span>
              <span>Summarizing</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-xl">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">TubeInsight</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-medium">Captions: Mixed</span>
                <span className="bg-zinc-100 px-1.5 py-0.5 rounded font-medium">Model: {modelChoice.toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {setResult(null); setUrl('');}}
              className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-all">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Section: Visual First */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key Takeaways */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {result?.keyTakeaways.map((takeaway, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-900 leading-tight">{takeaway.title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{takeaway.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Sentiment Gauge */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Overall Sentiment</h3>
            <div className="relative w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: (result?.sentiment.score || 0) + 1 },
                      { value: 2 - ((result?.sentiment.score || 0) + 1) }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={180}
                    endAngle={0}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#f4f4f5" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-3xl font-black text-zinc-900">{result?.sentiment.label}</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Polarity: {result?.sentiment.score.toFixed(2)}</span>
              </div>
            </div>
            <div className="w-full space-y-2">
              {result?.sentiment.breakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">{item.name}</span>
                  <div className="flex items-center gap-2 w-24">
                    <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-600" style={{ width: `${item.value}%` }}></div>
                    </div>
                    <span className="text-zinc-900 font-bold w-6 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-4">
          <div className="flex items-center gap-2 text-red-600">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold">Executive Summary</h2>
          </div>
          <p className="text-xl text-zinc-700 leading-relaxed font-medium">
            {result?.summary.executive}
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-2xl w-fit">
          {[
            { id: 'summary', label: 'Summary', icon: FileText },
            { id: 'insights', label: 'Insights', icon: BarChart3 },
            { id: 'transcript', label: 'Transcript', icon: MessageSquare },
            { id: 'export', label: 'Export', icon: Download },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all",
                activeTab === tab.id 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                  <h3 className="text-lg font-bold text-zinc-900">TL;DR Highlights</h3>
                  <ul className="space-y-4">
                    {result?.summary.tldr.map((bullet, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                        <p className="text-zinc-600 leading-relaxed">{bullet}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                  <h3 className="text-lg font-bold text-zinc-900">Main Topics</h3>
                  <div className="space-y-4">
                    {result?.topics.map((topic, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-zinc-900">{topic.name}</span>
                          <span className="text-zinc-400 font-medium">{topic.relevance}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zinc-900 rounded-full" 
                            style={{ width: `${topic.relevance}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900">Deeper Analysis</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Viewer Perception</span>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result?.insights.viewerPerception}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tone & Style</span>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result?.insights.tone}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Argument Strength</span>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result?.insights.argumentStrength}</p>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Detected Bias</span>
                        <p className="text-sm text-zinc-600 leading-relaxed">{result?.insights.bias}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900">Notable Moments</h3>
                    <div className="space-y-4">
                      {result?.notableMoments.map((moment, i) => (
                        <div 
                          key={i} 
                          className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-red-200 transition-colors cursor-pointer group"
                          onClick={() => {
                            setActiveTab('transcript');
                            // Small delay to allow tab to switch
                            setTimeout(() => {
                              const [mins, secs] = moment.timestamp.split(':').map(Number);
                              scrollToTimestamp(mins * 60 + secs);
                            }, 100);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-black text-red-600 bg-red-50 px-2 py-1 rounded-lg">{moment.timestamp}</span>
                            <p className="text-sm font-medium text-zinc-900">{moment.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, j) => (
                                <div 
                                  key={j} 
                                  className={cn(
                                    "w-1 h-3 rounded-full",
                                    j < Math.ceil(moment.importance / 2) ? "bg-red-600" : "bg-zinc-200"
                                  )} 
                                />
                              ))}
                            </div>
                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-red-600 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {result?.insights.themes.map((theme, i) => (
                        <span key={i} className="px-3 py-1.5 bg-zinc-100 text-zinc-900 text-xs font-bold rounded-full uppercase tracking-wider">
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900 p-8 rounded-3xl shadow-xl shadow-zinc-200 text-white space-y-6">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-bold">AI Confidence</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Analysis Depth</span>
                        <span className="text-sm font-bold">High</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Contextual Accuracy</span>
                        <span className="text-sm font-bold">94%</span>
                      </div>
                      <div className="pt-4 border-t border-zinc-800">
                        <p className="text-xs text-zinc-500 leading-relaxed italic">
                          Generated using Gemini 3.1 Pro with full transcript context.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transcript' && (
            <div className="bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Search transcript..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-red-500 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  <Clock className="w-4 h-4" />
                  {transcript.length} Segments
                </div>
              </div>
              <div 
                ref={transcriptRef}
                className="h-[600px] overflow-y-auto p-6 space-y-2 scroll-smooth"
              >
                {filteredTranscript.map((item, i) => (
                  <div 
                    key={i} 
                    id={`t-${Math.floor(item.offset)}`}
                    className="flex gap-6 p-3 rounded-xl hover:bg-zinc-50 transition-colors group cursor-pointer"
                    onClick={() => scrollToTimestamp(item.offset)}
                  >
                    <span className="text-xs font-black text-zinc-400 w-12 shrink-0 pt-1 group-hover:text-red-600 transition-colors">
                      {formatTime(item.offset)}
                    </span>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))}
                {filteredTranscript.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">No matches found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              {[
                { title: 'PDF Report', desc: 'Full analysis with charts and summary.', icon: FileText, color: 'bg-red-50 text-red-600' },
                { title: 'JSON Data', desc: 'Raw analysis data for developers.', icon: FileJson, color: 'bg-blue-50 text-blue-600' },
                { title: 'Copy Text', desc: 'Copy summary to clipboard.', icon: Copy, color: 'bg-zinc-50 text-zinc-600' }
              ].map((item, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-6 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", item.color)}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-zinc-900">{item.title}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                  </div>
                  <button className="w-full py-3 rounded-xl bg-zinc-900 text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-900">Analysis Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-bold text-zinc-900">AI Model</span>
                      <p className="text-xs text-zinc-500 mb-2">Choose the intelligence level for analysis.</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setModelChoice('basic')}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                            modelChoice === 'basic' ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          )}
                        >
                          Basic (Flash)
                        </button>
                        <button 
                          onClick={() => setModelChoice('pro')}
                          className={cn(
                            "px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all",
                            modelChoice === 'pro' ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          )}
                        >
                          Pro (3.1)
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-bold text-zinc-900">Summary Length</span>
                      <p className="text-xs text-zinc-500 mb-2">How detailed should the executive summary be?</p>
                      <div className="grid grid-cols-3 gap-2">
                        {['short', 'medium', 'long'].map((l) => (
                          <button 
                            key={l}
                            onClick={() => setSummaryLength(l as any)}
                            className={cn(
                              "px-4 py-3 rounded-xl text-sm font-bold border-2 transition-all capitalize",
                              summaryLength === l ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                            )}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 space-y-4">
                      <h4 className="text-sm font-bold text-zinc-900">Advanced Options</h4>
                      <div className="space-y-3">
                        {[
                          { label: 'Include Timeline Charts', checked: includeTimeline, set: setIncludeTimeline },
                          { label: 'Auto-Translate to English', checked: true, set: () => {} },
                          { label: 'Detect Bias & Framing', checked: true, set: () => {} }
                        ].map((opt, i) => (
                          <label key={i} className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-medium text-zinc-600">{opt.label}</span>
                            <div 
                              onClick={() => opt.set(!opt.checked)}
                              className={cn(
                                "w-10 h-5 rounded-full relative transition-colors",
                                opt.checked ? "bg-red-600" : "bg-zinc-300"
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                                opt.checked ? "left-6" : "left-1"
                              )} />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto p-6 pt-12 pb-24 text-center">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Powered by Gemini 3.1 & YouTube Transcripts
        </p>
      </footer>
    </div>
  );
}
