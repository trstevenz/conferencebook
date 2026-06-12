import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Sparkles, Copy, Check } from 'lucide-react';

export const MeetingSummaryGenerator: React.FC = () => {
  const { apiCall, theme } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [summaryMarkdown, setSummaryMarkdown] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) return;

    setIsLoading(true);
    setSummaryMarkdown(null);
    try {
      const response = await apiCall('/api/ai/summary', {
        method: 'POST',
        body: JSON.stringify({ transcript })
      });
      setSummaryMarkdown(response.message);
    } catch (err) {
      console.error('Error generating summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryMarkdown) return;
    navigator.clipboard.writeText(summaryMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSampleTranscript = () => {
    const sample = `John: Hey team, thanks for joining the huddle. Let's discuss our database migration path.
Sarah: Right. For the prototype phase, we should use SQLite since it's local and doesn't require complex configurations. We'll transition to MS SQL Server for production.
David: That works. I will set up the Hibernate configurations and abstract the DB layer so migrating later is easy.
Sarah: Sounds like a plan. David, how long will you need?
David: I should have it ready by Friday. I'll need Sarah to review the schema proposal first.
Sarah: Sure, email it to me. Let's decide to adopt SQLite immediately.
John: Excellent. Decision is made: SQLite for initial phase. David will write JPA structures by Friday and Sarah will review them. That's all for today.`;
    setTranscript(sample);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg font-outfit">AI Meeting Summarizer</h3>
          <p className="text-xs text-slate-400 mt-1">Convert your conversation transcripts into structured summaries, key decisions, and action checklists.</p>
        </div>
        <button
          onClick={loadSampleTranscript}
          className="px-4 py-2 border dark:border-slate-800 text-xs font-semibold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all self-center"
        >
          Load Test Transcript
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Input Transcript */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-[500px]">
          <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary-600" />
            Meeting Transcript
          </h4>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
            <textarea
              required
              value={transcript}
              onChange={e => setTranscript(e.target.value)}
              placeholder="Paste raw conversation transcript here..."
              className={`flex-1 w-full rounded-2xl p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 border resize-none ${
                theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !transcript.trim()}
              className="w-full py-3.5 bg-gradient-to-tr from-primary-600 to-blue-800 hover:opacity-95 text-white text-xs font-semibold rounded-2xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Summarizing...' : 'Extract Key Summary'}
            </button>
          </form>
        </div>

        {/* Right Column: Output Markdown */}
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-3xl shadow-sm flex flex-col h-[500px] relative">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-blue-600" />
              Extracted Action Items
            </h4>
            {summaryMarkdown && (
              <button
                onClick={handleCopy}
                className="p-2 border dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 text-xs font-semibold"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            )}
          </div>

          <div className={`flex-1 overflow-y-auto p-4 border rounded-2xl ${
            theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            {summaryMarkdown ? (
              <div className="prose dark:prose-invert max-w-none text-xs font-sans leading-relaxed space-y-4 whitespace-pre-wrap">
                {summaryMarkdown}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center text-xs space-y-2">
                <Sparkles className="h-10 w-10 text-slate-300 dark:text-slate-700" />
                <p>AI structured analysis will be printed here once you submit the transcript.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
