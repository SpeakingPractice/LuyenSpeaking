/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  ChevronRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Home,
  Settings,
  X,
  Key,
  History,
  Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { TestPart, Question, TestSession, EvaluationResult, HistoryItem } from './types';
import { PART_1_TOPICS, PART_2_CUE_CARDS, PART_3_QUESTIONS } from './constants';
import { evaluateSpeaking } from './services/geminiService';

// --- Components ---

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
    <motion.div 
      className="h-full bg-accent"
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
    />
  </div>
);

const Timer = ({ seconds, total, label }: { seconds: number; total: number; label: string }) => {
  const percentage = (seconds / total) * 100;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-border"
          />
          <motion.circle
            cx="48"
            cy="48"
            r="40"
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            strokeDasharray="251.2"
            animate={{ strokeDashoffset: 251.2 * (1 - percentage / 100) }}
            className="text-accent"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold text-text-primary">
          {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, '0')}
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary">{label}</span>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [view, setView] = useState<'home' | 'test' | 'prep' | 'evaluating' | 'result'>('home');
  const [session, setSession] = useState<TestSession | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [prepTimer, setPrepTimer] = useState(60);
  const [userApiKey, setUserApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(JSON.parse(localStorage.getItem('test_history') || '[]'));
  
  const [audioData, setAudioData] = useState<{ [id: string]: { data: string, mimeType: string } }>({});
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscript(prev => prev + finalTranscript);
      };
    }
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Prep Timer Effect
  useEffect(() => {
    let interval: any;
    if (view === 'prep' && prepTimer > 0) {
      interval = setInterval(() => setPrepTimer(t => t - 1), 1000);
    } else if (view === 'prep' && prepTimer === 0) {
      startRecording();
      setView('test');
    }
    return () => clearInterval(interval);
  }, [view, prepTimer]);

  const startTest = (mode: TestPart) => {
    let questions: Question[] = [];
    
    if (mode === TestPart.PART_1 || mode === TestPart.FULL_TEST) {
      const selectedTopics = [...PART_1_TOPICS].sort(() => 0.5 - Math.random()).slice(0, 3);
      selectedTopics.forEach(topic => {
        const qs = [...topic.questions].sort(() => 0.5 - Math.random()).slice(0, 2);
        qs.forEach((q, i) => {
          questions.push({ id: `p1_${topic.name}_${i}`, text: q, part: 1, topic: topic.name });
        });
      });
    }

    if (mode === TestPart.PART_2 || mode === TestPart.FULL_TEST) {
      const cueCard = PART_2_CUE_CARDS[Math.floor(Math.random() * PART_2_CUE_CARDS.length)];
      questions.push(cueCard);
    }

    if (mode === TestPart.PART_3 || mode === TestPart.FULL_TEST) {
      let p2Id = '';
      if (mode === TestPart.FULL_TEST) {
        p2Id = questions.find(q => q.part === 2)?.id || 'p2_1';
      } else {
        p2Id = PART_2_CUE_CARDS[Math.floor(Math.random() * PART_2_CUE_CARDS.length)].id;
      }
      const p3Qs = PART_3_QUESTIONS[p2Id] || PART_3_QUESTIONS['p2_1'];
      p3Qs.forEach((q, i) => {
        questions.push({ id: `p3_${i}`, text: q, part: 3 });
      });
    }

    setSession({
      mode,
      currentPart: questions[0].part,
      questions,
      currentQuestionIndex: 0,
      recordings: {},
      transcripts: {}
    });
    
    setEvaluation(null);
    setTranscript('');
    setTimer(0);
    setAudioData({});
    
    if (questions[0].part === 2) {
      setView('prep');
      setPrepTimer(60);
    } else {
      setView('test');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        if (session) {
          const currentQ = session.questions[session.currentQuestionIndex];
          setAudioData(prev => ({
            ...prev,
            [currentQ.id]: { data: base64, mimeType: 'audio/webm' }
          }));
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('');
      setTimer(0);
      if (recognitionRef.current) recognitionRef.current.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Please allow microphone access to practice.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();

      if (session) {
        const currentQ = session.questions[session.currentQuestionIndex];
        const newTranscripts = { ...session.transcripts, [currentQ.id]: transcript };
        setSession({ ...session, transcripts: newTranscripts });
      }
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      const nextQ = session.questions[nextIndex];
      setSession({
        ...session,
        currentQuestionIndex: nextIndex,
        currentPart: nextQ.part
      });
      setTranscript('');
      setTimer(0);
      
      if (nextQ.part === 2 && session.questions[session.currentQuestionIndex].part !== 2) {
        setView('prep');
        setPrepTimer(60);
      }
    } else {
      finishTest();
    }
  };

  const finishTest = async () => {
    if (!session) return;
    if (!userApiKey) {
      setShowSettings(true);
      alert("Vui lòng nhập Gemini API Key trong phần cài đặt để tiếp tục chấm điểm.");
      return;
    }
    setView('evaluating');
    try {
      const result = await evaluateSpeaking(session.transcripts, audioData, userApiKey);
      setEvaluation(result);
      
      // Save to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        mode: session.mode,
        overall: result.overall
      };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10); // Keep last 10
      setHistory(updatedHistory);
      localStorage.setItem('test_history', JSON.stringify(updatedHistory));
      
      setView('result');
    } catch (err) {
      console.error(err);
      setView('test');
      alert(err instanceof Error ? err.message : "Evaluation failed. Please try again.");
    }
  };

  const resetToHome = () => {
    setView('home');
    setSession(null);
    setEvaluation(null);
  };

  const currentQuestion = session?.questions[session.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-accent/20">
      {/* Header */}
      <header className="bg-bg border-b border-border sticky top-0 z-10 h-[72px] flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetToHome}>
            <div className="logo text-xl font-extrabold tracking-tighter">
              <span className="text-accent">IELTS</span> SPEAKING PRO
            </div>
          </div>
          
          {session && view !== 'home' && (
            <div className="mode-selector flex bg-card p-1 rounded-xl border border-border">
              <button className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${session.mode === TestPart.FULL_TEST ? 'bg-accent text-white' : 'text-text-secondary'}`}>
                Mock Test (Full)
              </button>
              <button className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${session.mode !== TestPart.FULL_TEST ? 'bg-accent text-white' : 'text-text-secondary'}`}>
                Practice by Part
              </button>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-card rounded-full transition-colors text-text-secondary"
              title="Cài đặt API Key"
            >
              <Settings className="w-5 h-5" />
            </button>
            {session && view !== 'home' && (
              <button 
                onClick={resetToHome}
                className="p-2 hover:bg-card rounded-full transition-colors text-text-secondary"
              >
                <Home className="w-5 h-5" />
              </button>
            )}
            <div className="w-8 h-8 bg-card border border-border rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-accent rounded-full" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-6xl font-black tracking-tight leading-tight">
                  Luyện thi <br />
                  <span className="text-accent">IELTS Speaking</span>
                </h2>
                <p className="text-xl text-text-secondary max-w-2xl">
                  Hệ thống giả lập phòng thi IELTS chuẩn quốc tế với sự hỗ trợ của AI.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: TestPart.PART_1, label: 'Thi PART 1', color: 'bg-card border-border hover:border-accent' },
                  { id: TestPart.PART_2, label: 'Thi PART 2', color: 'bg-card border-border hover:border-accent' },
                  { id: TestPart.PART_3, label: 'Thi PART 3', color: 'bg-card border-border hover:border-accent' },
                  { id: TestPart.FULL_TEST, label: 'FULL TEST', color: 'bg-accent border-accent hover:opacity-90' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => startTest(mode.id)}
                    className={`${mode.color} text-text-primary font-bold py-8 px-8 rounded-2xl border transition-all active:scale-95 text-lg text-center`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="bg-card p-10 rounded-3xl border border-border space-y-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="text-accent w-6 h-6" />
                  Quy trình luyện tập
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="space-y-3">
                    <div className="text-3xl font-black text-accent opacity-20">01</div>
                    <p className="font-bold text-lg">Chọn chế độ</p>
                    <p className="text-sm text-text-secondary leading-relaxed">Luyện từng phần hoặc làm bài thi đầy đủ 3 phần như thật.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-black text-accent opacity-20">02</div>
                    <p className="font-bold text-lg">Ghi âm</p>
                    <p className="text-sm text-text-secondary leading-relaxed">Nói tự nhiên, hệ thống sẽ tự động ghi âm và chuyển thành văn bản.</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-3xl font-black text-accent opacity-20">03</div>
                    <p className="font-bold text-lg">Đánh giá</p>
                    <p className="text-sm text-text-secondary leading-relaxed">AI chấm điểm dựa trên 4 tiêu chí IELTS và gợi ý cách nâng band.</p>
                  </div>
                </div>
              </div>

              {history.length > 0 && (
                <div className="bg-card p-10 rounded-3xl border border-border space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <History className="text-accent w-6 h-6" />
                      Lịch sử luyện tập
                    </h3>
                    <button 
                      onClick={() => {
                        if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
                          setHistory([]);
                          localStorage.removeItem('test_history');
                        }
                      }}
                      className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xóa lịch sử
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Ngày thi</th>
                          <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Chế độ</th>
                          <th className="pb-4 text-xs font-bold text-text-secondary uppercase tracking-widest">Overall</th>
                          <th className="pb-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {history.map((item) => (
                          <tr key={item.id} className="group">
                            <td className="py-4 text-sm font-medium text-text-primary">{item.date}</td>
                            <td className="py-4">
                              <span className="px-3 py-1 bg-accent/5 text-accent text-xs font-bold rounded-full border border-accent/10">
                                {item.mode}
                              </span>
                            </td>
                            <td className="py-4">
                              <span className="text-lg font-black text-success">{item.overall.toFixed(1)}</span>
                            </td>
                            <td className="py-4 text-right">
                              <button 
                                onClick={() => {
                                  const updated = history.filter(h => h.id !== item.id);
                                  setHistory(updated);
                                  localStorage.setItem('test_history', JSON.stringify(updated));
                                }}
                                className="p-2 text-text-secondary hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'prep' && session && (
            <motion.div 
              key="prep"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-3xl mx-auto bg-card p-12 rounded-[32px] border border-border space-y-10 text-center"
            >
              <div className="space-y-2">
                <span className="text-accent font-bold uppercase tracking-[0.2em] text-xs">Part 2: Preparation</span>
                <h2 className="text-4xl font-black">Chuẩn bị bài nói</h2>
              </div>

              <div className="bg-bg/50 p-10 rounded-2xl text-left border border-border">
                <p className="text-accent font-bold text-sm uppercase mb-2">{(currentQuestion as any).topic}</p>
                <p className="text-3xl font-bold text-text-primary mb-8 leading-tight">{currentQuestion?.text}</p>
                <div className="space-y-4">
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">You should say:</p>
                  <ul className="space-y-3">
                    {(currentQuestion as any).prompts.map((p: string, i: number) => (
                      <li key={i} className="flex items-start gap-4 text-text-primary">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        </div>
                        <span className="text-lg">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <Timer seconds={prepTimer} total={60} label="Thời gian chuẩn bị" />
                <button 
                  onClick={() => { setPrepTimer(0); setView('test'); startRecording(); }}
                  className="px-10 py-4 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                >
                  Bắt đầu nói ngay
                </button>
              </div>
            </motion.div>
          )}

          {view === 'test' && session && currentQuestion && (
            <motion.div 
              key="test"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-accent font-bold uppercase tracking-[0.2em] text-xs">Part {currentQuestion.part}</span>
                  <h3 className="text-3xl font-black">
                    {currentQuestion.part === 1 ? currentQuestion.topic : 'Speaking Task'}
                  </h3>
                </div>
                <div className="text-right space-y-2">
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Câu hỏi {session.currentQuestionIndex + 1} / {session.questions.length}</p>
                  <div className="w-40">
                    <ProgressBar current={session.currentQuestionIndex + 1} total={session.questions.length} />
                  </div>
                </div>
              </div>

              <div className="bg-card p-16 rounded-[32px] border border-border min-h-[360px] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                
                <motion.p 
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-text-primary leading-tight max-w-4xl"
                >
                  "{currentQuestion.text}"
                </motion.p>

                {currentQuestion.part === 2 && (
                  <div className="bg-white/5 p-8 rounded-2xl text-left w-full max-w-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-accent uppercase mb-4 tracking-[0.2em]">Cue Card Prompts</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(currentQuestion as any).prompts.map((p: string, i: number) => (
                        <li key={i} className="text-base text-text-secondary flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-10">
                <div className="recorder-container flex flex-col items-center gap-6">
                  {isRecording && (
                    <div className="wave-container flex items-center gap-1 h-10">
                      {[10, 24, 35, 20, 38, 15, 28, 32, 12, 22].map((h, i) => (
                        <motion.div 
                          key={i}
                          className="w-1 bg-accent rounded-full"
                          animate={{ height: [h, h * 1.5, h * 0.5, h] }}
                          transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  )}
                  
                  <div className="timer font-mono text-xl text-text-secondary">
                    {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                  </div>

                  {!isRecording ? (
                    <button 
                      onClick={startRecording}
                      className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-white shadow-xl shadow-accent/20 hover:scale-110 transition-transform active:scale-95 border-[6px] border-accent/10"
                    >
                      <Mic className="w-8 h-8" />
                    </button>
                  ) : (
                    <button 
                      onClick={stopRecording}
                      className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-red-500/20 hover:scale-110 transition-transform active:scale-95 border-[6px] border-red-500/10"
                    >
                      <Square className="w-8 h-8 fill-current" />
                    </button>
                  )}
                  
                  <p className="text-sm text-text-secondary">
                    {isRecording ? "Đang ghi âm câu trả lời của bạn..." : transcript ? "Ghi âm hoàn tất. Nhấn tiếp tục." : "Nhấn để bắt đầu trả lời"}
                  </p>
                </div>

                {!isRecording && transcript && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={nextQuestion}
                    className="px-10 py-4 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center gap-3"
                  >
                    {session.currentQuestionIndex === session.questions.length - 1 ? 'Hoàn tất bài thi' : 'Câu hỏi tiếp theo'}
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {view === 'evaluating' && (
            <motion.div 
              key="evaluating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-10"
            >
              <div className="relative">
                <Loader2 className="w-24 h-24 text-accent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Award className="w-10 h-10 text-accent/50" />
                </div>
              </div>
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-black">Đang chấm điểm...</h2>
                <p className="text-text-secondary text-lg">AI đang phân tích bài nói của bạn dựa trên các tiêu chí IELTS.</p>
              </div>
            </motion.div>
          )}

          {view === 'result' && evaluation && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8"
            >
              <div className="space-y-8">
                <div className="test-viewport bg-card rounded-[32px] p-10 border border-border space-y-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-black">Phân tích chi tiết</h2>
                    <button 
                      onClick={resetToHome}
                      className="px-5 py-2.5 bg-white/5 border border-border text-text-primary font-bold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-sm"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Luyện tập lại
                    </button>
                  </div>

                  <div className="space-y-10">
                    {[
                      { label: 'Fluency & Coherence', content: evaluation.feedback.fc, score: evaluation.scores.fc },
                      { label: 'Lexical Resource', content: evaluation.feedback.lr, score: evaluation.scores.lr },
                      { label: 'Grammar Accuracy', content: evaluation.feedback.gra, score: evaluation.scores.gra },
                      { label: 'Pronunciation', content: evaluation.feedback.p, score: evaluation.scores.p },
                    ].map((item, i) => (
                      <div key={i} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-accent uppercase text-xs tracking-[0.2em]">{item.label}</h4>
                          <span className="text-success font-bold">Band {item.score}</span>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{item.content}</ReactMarkdown>
                        </div>
                        {i < 3 && <hr className="border-border" />}
                      </div>
                    ))}
                  </div>

                  <div className="bg-accent/10 p-8 rounded-2xl border border-accent/20 space-y-4">
                    <h4 className="text-lg font-bold text-accent">Lời khuyên tổng quát</h4>
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{evaluation.feedback.general}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              <div className="results-panel flex flex-col gap-6">
                <div className="overall-score-card bg-accent rounded-[24px] p-8 text-center shadow-xl shadow-accent/20">
                  <span className="overall-label text-xs font-bold uppercase tracking-widest opacity-80 block mb-1">Dự kiến Overall</span>
                  <span className="overall-val text-6xl font-black block">{evaluation.overall.toFixed(1)}</span>
                </div>

                <div className="criteria-grid grid grid-cols-2 gap-4">
                  {[
                    { label: 'Fluency (FC)', val: evaluation.scores.fc },
                    { label: 'Vocab (LR)', val: evaluation.scores.lr },
                    { label: 'Grammar (GRA)', val: evaluation.scores.gra },
                    { label: 'Pronun (P)', val: evaluation.scores.p },
                  ].map((crit, i) => (
                    <div key={i} className="criteria-item bg-card border border-border p-5 rounded-2xl text-center">
                      <span className="crit-val text-2xl font-black text-success block">{crit.val}</span>
                      <span className="crit-label text-[10px] text-text-secondary uppercase font-bold tracking-wider mt-1 block">{crit.label}</span>
                    </div>
                  ))}
                </div>

                <div className="analysis-section bg-card border border-border rounded-2xl p-6 flex-1">
                  <div className="analysis-title flex justify-between items-center mb-6">
                    <span className="text-sm font-bold uppercase tracking-widest">Gợi ý nâng Band</span>
                    <span className="text-accent text-[10px] font-black cursor-pointer hover:underline">XEM CHI TIẾT</span>
                  </div>
                  <ul className="analysis-list space-y-6">
                    <li className="text-sm text-text-secondary leading-relaxed border-b border-border pb-6 last:border-0">
                      <strong className="text-warning block mb-1 font-bold">Fluency (FC)</strong>
                      Cải thiện tính liên kết bằng cách sử dụng các từ nối phức tạp hơn.
                    </li>
                    <li className="text-sm text-text-secondary leading-relaxed border-b border-border pb-6 last:border-0">
                      <strong className="text-warning block mb-1 font-bold">Lexical (LR)</strong>
                      Sử dụng thêm các cụm từ idiomatic và collocations chuyên sâu.
                    </li>
                    <li className="text-sm text-text-secondary leading-relaxed">
                      <strong className="text-warning block mb-1 font-bold">Grammar (GRA)</strong>
                      Chú ý chia động từ ở các thì hoàn thành và câu điều kiện.
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-bg border-t border-border py-8 mt-12">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="logo text-sm font-black tracking-tighter opacity-50">
              <span className="text-accent">IELTS</span> SPEAKING PRO
            </div>
          </div>
          <div className="flex gap-8 text-[11px] font-bold text-text-secondary uppercase tracking-widest">
            <a href="#" className="hover:text-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-accent transition-colors">Support</a>
          </div>
          <p className="text-[10px] text-text-secondary font-medium">© 2026 IELTS Speaking Pro. All rights reserved.</p>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-text-primary/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  Cài đặt API Key
                </h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-bg rounded-full transition-colors text-text-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
                    <Key className="w-3 h-3" />
                    Gemini API Key
                  </label>
                  <input 
                    type="password"
                    value={userApiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setUserApiKey(val);
                      localStorage.setItem('gemini_api_key', val);
                    }}
                    placeholder="Nhập API Key của bạn..."
                    className="w-full bg-bg border border-border rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent transition-colors"
                  />
                  <p className="text-[10px] text-text-secondary leading-relaxed">
                    API Key của bạn được lưu trữ cục bộ trên trình duyệt này và chỉ được dùng để gọi API chấm điểm. Bạn có thể lấy key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google AI Studio</a>.
                  </p>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full py-4 bg-accent text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                >
                  Lưu cài đặt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
