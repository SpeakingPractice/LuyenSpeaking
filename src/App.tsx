import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  RotateCcw, 
  Settings, 
  Award, 
  CheckCircle2, 
  Loader2, 
  ChevronRight, 
  History, 
  Home, 
  BookOpen,
  Trash2,
  PlusCircle,
  Save,
  X,
  Sparkles,
  Wand2,
  Radio
} from 'lucide-react';
import { ContributionTracker } from './components/ContributionTracker';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { TestPart, TestSession, EvaluationResult, Question, HistoryItem } from './types';
import { evaluateSpeaking, generateSpeakingContent } from './services/geminiService';
import { PART_1_TOPICS, PART_2_CUE_CARDS, PART_3_QUESTIONS } from './constants';

const ProgressBar = ({ current, total }: { current: number, total: number }) => (
  <div className="w-full bg-border h-1.5 rounded-full overflow-hidden">
    <div 
      className="bg-accent h-full transition-all duration-500 ease-out" 
      style={{ width: `${(current / total) * 100}%` }}
    />
  </div>
);

export default function App() {
  const [view, setView] = useState<'home' | 'test' | 'prep' | 'evaluating' | 'result' | 'add_question'>('home');
  const [session, setSession] = useState<TestSession | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [levelEvaluation, setLevelEvaluation] = useState<EvaluationResult | null>(null);
  const [isLevelLoading, setIsLevelLoading] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timer, setTimer] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [userApiKey, setUserApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('test_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [customP1, setCustomP1] = useState<{ name: string, questions: any[] }[]>(() => JSON.parse(localStorage.getItem('custom_p1') || '[]'));
  const [customP2, setCustomP2] = useState<Question[]>(() => JSON.parse(localStorage.getItem('custom_p2') || '[]'));
  const [customP3, setCustomP3] = useState<Record<string, any[]>>(() => JSON.parse(localStorage.getItem('custom_p3') || '{}'));
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  const [audioData, setAudioData] = useState<Record<string, { data: string, mimeType: string }>>({});
  const [speakingStats, setSpeakingStats] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('speaking_stats');
    return saved ? JSON.parse(saved) : {};
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const incrementDailyStats = () => {
    const today = new Date().toISOString().split('T')[0];
    setSpeakingStats(prev => {
      const newVal = { ...prev, [today]: (prev[today] || 0) + 1 };
      localStorage.setItem('speaking_stats', JSON.stringify(newVal));
      return newVal;
    });
  };

  const calculateStreak = () => {
    const dates = Object.keys(speakingStats).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let current = new Date(today);
    const todayIso = current.toISOString().split('T')[0];
    
    // If not recorded today, check yesterday. If neither, streak is 0.
    if (!speakingStats[todayIso]) {
      current.setDate(current.getDate() - 1);
      const yesterdayIso = current.toISOString().split('T')[0];
      if (!speakingStats[yesterdayIso]) return 0;
    }

    // Now current points to the last day with a recording
    while (speakingStats[current.toISOString().split('T')[0]]) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startTest = (mode: TestPart) => {
    let questions: Question[] = [];
    setTotalScore(0);
    setLevelEvaluation(null);
    
    // Combine constants with custom questions
    const allP1Topics = [...PART_1_TOPICS, ...customP1];
    const allP2Cards = [...PART_2_CUE_CARDS, ...customP2];
    const allP3Data = { ...PART_3_QUESTIONS };
    Object.keys(customP3).forEach(key => {
      allP3Data[key] = [...(allP3Data[key] || []), ...customP3[key]];
    });

    if (mode === TestPart.PART_1 || mode === TestPart.QUEST) {
      const selectedTopics = [...allP1Topics].sort(() => 0.5 - Math.random()).slice(0, 3);
      selectedTopics.forEach((topic, tidx) => {
        const qs = [...topic.questions].sort(() => 0.5 - Math.random()).slice(0, 2);
        qs.forEach((q, i) => {
          questions.push({ ...q, id: `p1_${topic.name}_${tidx}_${i}`, part: 1, topic: topic.name });
        });
      });
    }

    if (mode === TestPart.PART_2 || mode === TestPart.QUEST) {
      const count = mode === TestPart.PART_2 ? 3 : 1; // More variety if just Part 2 mode
      const shuffled = [...allP2Cards].sort(() => 0.5 - Math.random());
      shuffled.slice(0, count).forEach(card => {
        questions.push(card);
      });
    }

    if (mode === TestPart.PART_3 || mode === TestPart.QUEST) {
      let p2Id = mode === TestPart.QUEST 
        ? (questions.find(q => q.part === 2)?.id || 'p2_1')
        : allP2Cards[Math.floor(Math.random() * allP2Cards.length)].id;
        
      const p3Qs = allP3Data[p2Id] || allP3Data['p2_1'];
      // Limit to 5 questions for Part 3 in Quest Mode
      const limit = mode === TestPart.QUEST ? 5 : p3Qs.length;
      p3Qs.slice(0, limit).forEach((q, i) => {
        questions.push({ ...q, id: `p3_${i}`, part: 3 });
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
    setAudioData({});
    setTranscript('');
    setTimer(0);
    setView('test');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(average);
        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(updateLevel);
        }
      };
      
      mediaRecorder.ondataavailable = (event) => audioChunksRef.current.push(event.data);
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(audioBlob);
        if (session) {
          const currentQ = session.questions[session.currentQuestionIndex];
          setAudioData(prev => ({ ...prev, [currentQ.id]: { data: base64, mimeType: 'audio/webm' } }));
        }
        if (audioContextRef.current) audioContextRef.current.close();
        setMicLevel(0);
      };

      mediaRecorder.start();
      updateLevel();
      setIsRecording(true);
      setTranscript('');
      setTimer(0);
      if (recognitionRef.current) recognitionRef.current.start();
    } catch (err) {
      alert("Vui lòng cho phép quyền truy cập micro.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      incrementDailyStats();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (session) {
        const qId = session.questions[session.currentQuestionIndex].id;
        setSession({ ...session, transcripts: { ...session.transcripts, [qId]: transcript } });
      }
    }
  };

  const nextQuestion = () => {
    if (!session) return;
    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex < session.questions.length) {
      const nextQ = session.questions[nextIndex];
      setSession({ ...session, currentQuestionIndex: nextIndex, currentPart: nextQ.part });
      setTranscript('');
      setTimer(0);
    } else {
      finishTest();
    }
  };

  const shuffleCurrentQuestion = () => {
    if (!session) return;
    const currentQ = session.questions[session.currentQuestionIndex];
    if (currentQ.part !== 2) return;
    
    const allP2Cards = [...PART_2_CUE_CARDS, ...customP2];
    let newCard = allP2Cards[Math.floor(Math.random() * allP2Cards.length)];
    // Try to pick a different one
    while (newCard.id === currentQ.id && allP2Cards.length > 1) {
      newCard = allP2Cards[Math.floor(Math.random() * allP2Cards.length)];
    }
    
    const newQuestions = [...session.questions];
    newQuestions[session.currentQuestionIndex] = newCard;
    setSession({ ...session, questions: newQuestions });
    setTranscript('');
    setTimer(0);
  };

  const evaluateLevel = async () => {
    if (!session || !userApiKey || isLevelLoading) return;
    const currentQ = session.questions[session.currentQuestionIndex];
    if (!audioData[currentQ.id] || !transcript) {
      alert("Vui lòng ghi âm câu trả lời trước.");
      return;
    }
    setIsLevelLoading(true);
    try {
      const result = await evaluateSpeaking({ [currentQ.id]: transcript }, { [currentQ.id]: audioData[currentQ.id] }, userApiKey);
      setLevelEvaluation(result);
      if (result.pronunciationAccuracy >= 85) {
        let pts = currentQ.part === 1 ? 2 : (currentQ.part === 2 ? 3 : 5);
        setTotalScore(prev => prev + pts);
      }
    } catch (err) {
      alert("Lỗi khi đánh giá ải.");
    } finally {
      setIsLevelLoading(false);
    }
  };

  const finishTest = async () => {
    if (!session || !userApiKey) { setShowSettings(true); return; }
    setView('evaluating');
    try {
      const result = await evaluateSpeaking(session.transcripts, audioData, userApiKey);
      setEvaluation(result);
      const newHistoryItem = { id: Date.now().toString(), date: new Date().toLocaleString(), mode: session.mode, overall: result.overall };
      const updatedHistory = [newHistoryItem, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('test_history', JSON.stringify(updatedHistory));
      setView('result');
    } catch (err) {
      setView('test');
      alert("Đánh giá thất bại.");
    }
  };

  const resetToHome = () => { setView('home'); setSession(null); setEvaluation(null); setAudioData({}); };

  const currentQuestion = session?.questions[session.currentQuestionIndex];

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans selection:bg-accent/20">
      <header className="bg-bg border-b border-border sticky top-0 z-10 h-[72px] flex items-center">
        <div className="max-w-7xl mx-auto px-8 w-full flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetToHome}>
            <div className="logo text-xl font-extrabold tracking-tighter">
              <span className="text-accent">IELTS</span> SPEAKING PRO
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalScore > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-full">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-sm font-bold text-accent">{totalScore} PTS</span>
              </div>
            )}
            <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-card rounded-full transition-colors text-text-secondary">
              <Settings className="w-5 h-5" />
            </button>
            {session && view !== 'home' && (
              <button onClick={resetToHome} className="p-2 hover:bg-card rounded-full transition-colors text-text-secondary">
                <Home className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-12">
                <div className="space-y-4">
                  <h2 className="text-6xl font-black tracking-tight leading-tight">
                    IELTS Speaking <br /> <span className="text-accent underline decoration-4 underline-offset-8">Adventure</span>
                  </h2>
                  <p className="text-xl text-text-secondary max-w-xl">
                    Chinh phục 12 ải speaking, luyện tập phát âm, ngắt nghỉ và phát triển ý tưởng cùng AI.
                  </p>
                </div>
                <div className="w-full lg:w-auto">
                    <ContributionTracker stats={speakingStats} streak={calculateStreak()} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { id: TestPart.QUEST, label: 'BẮT ĐẦU QUEST', color: 'bg-accent text-white border-accent shadow-xl shadow-accent/20', desc: 'Chinh phục 12 ải', icon: Award },
                  { id: TestPart.PART_1, label: 'Luyện Part 1', color: 'bg-card border-border hover:border-accent', desc: 'Luyện ý tưởng ngắn', icon: BookOpen },
                  { id: TestPart.PART_2, label: 'Luyện Part 2', color: 'bg-card border-border hover:border-accent', desc: 'Luyện kể chuyện', icon: Mic },
                  { id: TestPart.PART_3, label: 'Luyện Part 3', color: 'bg-card border-border hover:border-accent', desc: 'Luyện tư duy sâu', icon: ChevronRight },
                ].map((mode) => (
                  <button key={mode.id} onClick={() => startTest(mode.id)} className={`${mode.color} p-8 rounded-[32px] border transition-all active:scale-95 text-left group flex flex-col justify-between h-full min-h-[180px]`}>
                    <div className="flex items-center justify-between w-full">
                       <mode.icon className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                       <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs opacity-60 font-bold uppercase tracking-widest block">{mode.desc}</span>
                      <span className="font-black text-2xl tracking-tight leading-tight block">{mode.label}</span>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <button onClick={() => setView('add_question')} className="flex items-center gap-3 px-6 py-4 bg-accent/10 border border-accent/20 text-accent font-black rounded-2xl hover:bg-accent/20 transition-all active:scale-95 uppercase tracking-widest text-xs">
                  <PlusCircle className="w-5 h-5" />
                  Thêm Câu Hỏi Mới
                </button>
                <div className="h-10 w-px bg-border mx-2" />
                <button onClick={() => { if(confirm('Xoá tất cả câu hỏi tự thêm?')) { setCustomP1([]); setCustomP2([]); setCustomP3({}); localStorage.removeItem('custom_p1'); localStorage.removeItem('custom_p2'); localStorage.removeItem('custom_p3'); } }} className="text-text-secondary hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Xoá Custom Data
                </button>
              </div>
            </motion.div>
          )}

          {view === 'test' && session && currentQuestion && (
            <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-accent font-bold uppercase tracking-[0.2em] text-xs">Part {currentQuestion.part}</span>
                  <h3 className="text-3xl font-black">{currentQuestion.part === 1 ? currentQuestion.topic : 'Speaking Task'}</h3>
                </div>
                <div className="flex items-center gap-6">
                  {currentQuestion.part === 2 && !isRecording && (
                    <button 
                      onClick={shuffleCurrentQuestion}
                      className="text-xs font-bold text-accent hover:opacity-80 flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full transition-all"
                    >
                      <RotateCcw className="w-3 h-3" />
                      ĐỔI CÂU HỎI KHÁC
                    </button>
                  )}
                  <div className="text-right space-y-2">
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Câu hỏi {session.currentQuestionIndex + 1} / {session.questions.length}</p>
                    <div className="w-40"><ProgressBar current={session.currentQuestionIndex + 1} total={session.questions.length} /></div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-16 rounded-[40px] border border-border min-h-[400px] flex flex-col items-center justify-center text-center space-y-10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                <div className="space-y-4">
                  {currentQuestion.topic && <span className="px-3 py-1 bg-accent/10 text-accent text-[10px] font-black rounded-full uppercase tracking-widest">Topic: {currentQuestion.topic}</span>}
                  <motion.p key={currentQuestion.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`text-3xl md:text-5xl font-bold text-text-primary leading-tight max-w-4xl`}>"{currentQuestion.text}"</motion.p>
                </div>
                <div className="w-full max-w-3xl text-left space-y-6">
                  {currentQuestion.framework && (
                    <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">Framework Gợi Ý</span>
                      </div>
                      <div className="space-y-2">
                        {currentQuestion.framework.replace(/\\n/g, '\n').split('\n').map((line, idx) => (
                          line.trim() && <p key={idx} className="text-lg italic text-text-primary leading-relaxed text-left">{line.trim()}</p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentQuestion.sampleAnswer && (
                      <div className="p-6 bg-white/5 rounded-2xl border border-border">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-3">Gợi Ý Trả Lời (Band 6.5)</span>
                        <p className="text-lg text-text-primary leading-relaxed whitespace-pre-line text-left">{currentQuestion.sampleAnswer.replace(/\\n/g, '\n')}</p>
                      </div>
                    )}
                    {currentQuestion.tips && (
                      <div className="p-6 bg-white/5 rounded-2xl border border-border">
                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-3">Luyện tập gì?</span>
                        <p className="text-lg text-text-primary italic leading-relaxed text-left">{currentQuestion.tips.replace(/\\n/g, '\n')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-10">
                <div className="recorder-container flex flex-col items-center gap-8 bg-card p-12 rounded-[40px] border border-border w-full">
                  {!levelEvaluation ? (
                    <>
                      {isRecording && (
                        <div className="wave-container flex items-center gap-1.5 h-12">
                          {[0.4, 0.7, 1.0, 0.8, 1.2, 0.6, 0.9, 1.1, 0.5, 0.7, 0.8, 1.0].map((v, i) => (
                            <motion.div key={i} className="w-1.5 bg-accent rounded-full" animate={{ height: [12, Math.max(12, (micLevel / 128) * 60 * v), 12] }} transition={{ duration: 0.1 }} />
                          ))}
                        </div>
                      )}
                      <div className="timer font-mono text-3xl font-black text-text-primary">
                        {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="flex flex-col items-center gap-4">
                        {!isRecording ? (
                          <button onClick={startRecording} className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white shadow-2xl shadow-accent/40 hover:scale-110 transition-transform active:scale-95 border-[8px] border-accent/20"><Mic className="w-10 h-10" /></button>
                        ) : (
                          <button onClick={stopRecording} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-red-500/40 hover:scale-110 transition-transform active:scale-95 border-[8px] border-red-500/20"><Square className="w-10 h-10 fill-current" /></button>
                        )}
                        <p className="text-sm font-bold tracking-widest uppercase text-text-secondary">{isRecording ? "Đang ghi âm câu trả lời..." : transcript ? "Ghi âm hoàn tất" : "Nhấn để trả lời"}</p>
                      </div>
                      {transcript && !isRecording && (
                        <div className="w-full max-w-2xl bg-bg/50 p-8 rounded-3xl border border-border text-left space-y-4">
                          <p className="text-lg text-text-primary italic leading-relaxed">"{transcript}"</p>
                          {session.mode === TestPart.QUEST ? (
                            <button onClick={evaluateLevel} disabled={isLevelLoading} className="w-full py-5 bg-text-primary text-bg font-black rounded-2xl flex items-center justify-center gap-3">
                              {isLevelLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Award className="w-6 h-6" /> KIỂM TRA ĐỘ CHÍNH XÁC (TGT 85%)</>}
                            </button>
                          ) : (
                            <button onClick={nextQuestion} className="w-full py-5 bg-text-primary text-bg font-black rounded-2xl flex items-center justify-center gap-3">TIẾP TỤC <ChevronRight className="w-6 h-6" /></button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full space-y-10 py-6">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-32 h-32 rounded-full border-[10px] flex items-center justify-center ${levelEvaluation.pronunciationAccuracy >= 85 ? 'border-success' : 'border-red-500'}`}>
                          <span className={`text-5xl font-black ${levelEvaluation.pronunciationAccuracy >= 85 ? 'text-success' : 'text-red-500'}`}>{levelEvaluation.pronunciationAccuracy}%</span>
                        </div>
                        <h4 className="text-2xl font-black uppercase tracking-tight">{levelEvaluation.pronunciationAccuracy >= 85 ? 'VƯỢT ẢI THÀNH CÔNG!' : 'CHƯA ĐẠT ĐỘ CHÍNH XÁC'}</h4>
                        <p className="text-text-secondary">{levelEvaluation.pronunciationAccuracy >= 85 ? `Chúc mừng! Bạn đã nhận được +${currentQuestion.part === 1 ? '2' : currentQuestion.part === 2 ? '3' : '5'} PTS.` : 'Hãy thử lại để vượt qua ải này.'}</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => { setLevelEvaluation(null); setTranscript(''); setTimer(0); }} className="flex-1 py-5 bg-card border border-border text-text-primary font-black rounded-2xl flex items-center justify-center gap-3"><RotateCcw className="w-5 h-5" /> THỬ LẠI</button>
                        {levelEvaluation.pronunciationAccuracy >= 85 && (
                          <button onClick={() => { setLevelEvaluation(null); nextQuestion(); }} className="flex-[2] py-5 bg-accent text-white font-black rounded-2xl flex items-center justify-center gap-3">ẢI TIẾP THEO <ChevronRight className="w-6 h-6" /></button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'add_question' && (
            <AddQuestionView 
              onBack={() => setView('home')} 
              onSave={(part, data) => {
                if (part === 1) {
                  const updated = [...customP1, data];
                  setCustomP1(updated);
                  localStorage.setItem('custom_p1', JSON.stringify(updated));
                } else if (part === 2) {
                  const updated = [...customP2, { ...data, id: `custom_p2_${Date.now()}` }];
                  setCustomP2(updated);
                  localStorage.setItem('custom_p2', JSON.stringify(updated));
                } else if (part === 3) {
                  const { p2Id, question } = data;
                  const updated = { ...customP3, [p2Id]: [...(customP3[p2Id] || []), question] };
                  setCustomP3(updated);
                  localStorage.setItem('custom_p3', JSON.stringify(updated));
                }
                setView('home');
              }}
              existingP2={[...PART_2_CUE_CARDS, ...customP2]}
              userApiKey={userApiKey}
            />
          )}

          {view === 'evaluating' && (
            <motion.div key="evaluating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 space-y-10">
              <Loader2 className="w-24 h-24 text-accent animate-spin" />
              <div className="text-center space-y-3"><h2 className="text-4xl font-black">Đang chấm điểm...</h2><p className="text-text-secondary text-lg">AI đang phân tích bài nói của bạn.</p></div>
            </motion.div>
          )}

          {view === 'result' && evaluation && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
              <div className="space-y-8">
                <div className="test-viewport bg-card rounded-[32px] p-10 border border-border space-y-8">
                  <div className="flex items-center justify-between"><h2 className="text-3xl font-black">Phân tích chi tiết</h2><button onClick={resetToHome} className="px-5 py-2.5 bg-white/5 border border-border text-text-primary font-bold rounded-xl flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4" /> Reset</button></div>
                  <div className="space-y-10">
                    {[
                      { label: 'Fluency & Coherence', content: evaluation.feedback.fc, score: evaluation.scores.fc },
                      { label: 'Lexical Resource', content: evaluation.feedback.lr, score: evaluation.scores.lr },
                      { label: 'Grammar Accuracy', content: evaluation.feedback.gra, score: evaluation.scores.gra },
                      { label: 'Pronunciation', content: evaluation.feedback.p, score: evaluation.scores.p },
                    ].map((item, i) => (
                      <div key={i} className="space-y-4 text-left">
                        <div className="flex items-center justify-between"><h4 className="font-bold text-accent uppercase text-xs tracking-[0.2em]">{item.label}</h4><span className="text-success font-bold">Band {item.score}</span></div>
                        <div className="prose prose-sm max-w-none"><ReactMarkdown>{item.content}</ReactMarkdown></div>
                        {i < 3 && <hr className="border-border" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="results-panel flex flex-col gap-6">
                <div className="overall-score-card bg-accent rounded-[24px] p-8 text-center shadow-xl shadow-accent/20"><span className="overall-label text-xs font-bold uppercase tracking-widest opacity-80 block mb-1">Dự kiến Overall</span> <span className="overall-val text-6xl font-black block">{evaluation.overall.toFixed(1)}</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {showSettings && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-8 rounded-[32px] w-full max-w-md space-y-6">
            <div className="flex items-center justify-between"><h3 className="text-2xl font-black">Cài đặt API</h3><button onClick={() => setShowSettings(false)} className="text-text-secondary hover:text-text-primary transition-colors">X</button></div>
            <div className="space-y-4">
              <div className="space-y-2"><p className="text-xs font-bold uppercase tracking-widest">Gemini API Key</p><input type="password" value={userApiKey} onChange={(e) => { setUserApiKey(e.target.value); localStorage.setItem('gemini_api_key', e.target.value); }} className="w-full bg-bg border border-border px-4 py-3 rounded-xl focus:border-accent outline-none" placeholder="Nhập API Key của bạn..." /></div>
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-accent text-white font-black rounded-xl hover:opacity-90 transition-all">Lưu thay đổi</button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const AddQuestionView = ({ onBack, onSave, existingP2, userApiKey }: { onBack: () => void, onSave: (part: number, data: any) => void, existingP2: any[], userApiKey?: string }) => {
  const [activePart, setActivePart] = useState(1);
  const [isGenerating, setIsGenerating] = useState<number | null>(null); // part number or question index

  const [p1Topic, setP1Topic] = useState('');
  const [p1Q1, setP1Q1] = useState('');
  const [p1Q1A, setP1Q1A] = useState('');
  const [p1Q2, setP1Q2] = useState('');
  const [p1Q2A, setP1Q2A] = useState('');
  
  const [p2Topic, setP2Topic] = useState('');
  const [p2Text, setP2Text] = useState('');
  const [p2Prompts, setP2Prompts] = useState('');
  const [p2Answer, setP2Answer] = useState('');
  const [p2Tips, setP2Tips] = useState('');
  const [p2Framework, setP2Framework] = useState('');

  const [p3P2Id, setP3P2Id] = useState(existingP2[0]?.id || '');
  const [p3Text, setP3Text] = useState('');
  const [p3Answer, setP3Answer] = useState('');

  const handleGenerate = async (part: 1 | 2 | 3, input: string, target: 'p1q1' | 'p1q2' | 'p2' | 'p3') => {
    if (!input) return alert('Vui lòng nhập câu hỏi hoặc chủ đề trước.');
    setIsGenerating(part);
    try {
      const result = await generateSpeakingContent(part, input, userApiKey);
      if (target === 'p1q1') setP1Q1A(result.sampleAnswer);
      if (target === 'p1q2') setP1Q2A(result.sampleAnswer);
      if (target === 'p2') {
        setP2Answer(result.sampleAnswer);
        if (result.framework) setP2Framework(result.framework);
        if (result.tips) setP2Tips(result.tips);
      }
      if (target === 'p3') setP3Answer(result.sampleAnswer);
    } catch (error) {
      alert('Không thể tạo gợi ý. Vui lòng kiểm tra API Key.');
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSave = () => {
    if (activePart === 1) {
      if (!p1Topic || !p1Q1 || !p1Q2) return alert('Vui lòng điền đủ Topic và 2 câu hỏi.');
      onSave(1, {
        name: p1Topic,
        questions: [
          { text: p1Q1, sampleAnswer: p1Q1A, part: 1 },
          { text: p1Q2, sampleAnswer: p1Q2A, part: 1 }
        ]
      });
    } else if (activePart === 2) {
      if (!p2Text) return alert('Vui lòng nhập đề bài Part 2.');
      onSave(2, {
        part: 2,
        topic: p2Topic || 'Custom Topic',
        text: p2Text,
        prompts: p2Prompts.split('\n').filter(p => p.trim()),
        sampleAnswer: p2Answer,
        tips: p2Tips,
        framework: p2Framework || '1. Intro\n2. Context\n3. Story\n4. Conclusion'
      });
    } else if (activePart === 3) {
      if (!p3Text || !p3P2Id) return alert('Vui lòng chọn Cue Card và nhập câu hỏi.');
      onSave(3, {
        p2Id: p3P2Id,
        question: { text: p3Text, sampleAnswer: p3Answer, part: 3 }
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto bg-card border border-border rounded-[40px] overflow-hidden shadow-2xl">
      <div className="flex border-b border-border">
        {[1, 2, 3].map(p => (
          <button 
            key={p} 
            onClick={() => setActivePart(p)}
            className={`flex-1 py-6 font-black uppercase tracking-widest text-sm transition-all ${activePart === p ? 'bg-accent text-white' : 'hover:bg-accent/5 text-text-secondary'}`}
          >
            Part {p}
          </button>
        ))}
      </div>
      
      <div className="p-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black italic">Thêm Chủ Đề Mới</h2>
            <p className="text-xs text-text-secondary font-medium">Nhập câu hỏi và dùng AI để tạo bài mẫu chuẩn cấu trúc</p>
          </div>
          <button onClick={onBack} className="p-2 hover:bg-bg rounded-full transition-colors text-text-secondary"><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
          {activePart === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest">Tên Chủ Đề (Topic)</label>
                <input value={p1Topic} onChange={e => setP1Topic(e.target.value)} placeholder="Ví dụ: Coffee shops" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none focus:border-accent transition-colors font-medium text-lg" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Câu hỏi 1</label>
                      <button 
                        onClick={() => handleGenerate(1, p1Q1, 'p1q1')}
                        disabled={isGenerating !== null}
                        className="text-[10px] font-black text-accent flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                      >
                        {isGenerating === 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        GỢI Ý TRẢ LỜI
                      </button>
                    </div>
                    <textarea value={p1Q1} onChange={e => setP1Q1(e.target.value)} placeholder="Do you like drinking coffee?" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-24" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Gợi ý trả lời 1</label>
                    <textarea value={p1Q1A} onChange={e => setP1Q1A(e.target.value)} className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32 text-sm leading-relaxed" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Câu hỏi 2</label>
                      <button 
                        onClick={() => handleGenerate(1, p1Q2, 'p1q2')}
                        disabled={isGenerating !== null}
                        className="text-[10px] font-black text-accent flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                      >
                        {isGenerating === 1 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        GỢI Ý TRẢ LỜI
                      </button>
                    </div>
                    <textarea value={p1Q2} onChange={e => setP1Q2(e.target.value)} placeholder="How often do you visit cafes?" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-24" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Gợi ý trả lời 2</label>
                    <textarea value={p1Q2A} onChange={e => setP1Q2A(e.target.value)} className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32 text-sm leading-relaxed" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePart === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-accent uppercase tracking-widest">Topic</label>
                    <input value={p2Topic} onChange={e => setP2Topic(e.target.value)} placeholder="A famous person" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black text-accent uppercase tracking-widest">Đề bài (Cue Card Text)</label>
                      <button 
                        onClick={() => handleGenerate(2, p2Text, 'p2')}
                        disabled={isGenerating !== null}
                        className="text-[10px] font-black text-accent flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                      >
                        {isGenerating === 2 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        GENERATE SAMPLE & FRAMEWORK
                      </button>
                    </div>
                    <textarea value={p2Text} onChange={e => setP2Text(e.target.value)} placeholder="Describe a famous person you would like to meet." className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Các gợi ý (Mỗi dòng 1 ý)</label>
                    <textarea value={p2Prompts} onChange={e => setP2Prompts(e.target.value)} placeholder="Who they are&#10;What they do&#10;..." className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32" />
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Phác thảo ý tưởng (Framework)</label>
                    <textarea value={p2Framework} onChange={e => setP2Framework(e.target.value)} className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32 text-sm" placeholder="AI sẽ tự tạo framework..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Bài mẫu gợi ý</label>
                    <textarea value={p2Answer} onChange={e => setP2Answer(e.target.value)} placeholder="Dùng mẫu Intro, Context, Story, Conclusion" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-56 text-sm leading-relaxed" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePart === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-accent uppercase tracking-widest">Thuộc Cue Card nào?</label>
                <select value={p3P2Id} onChange={e => setP3P2Id(e.target.value)} className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none font-bold">
                  {existingP2.map(card => (
                    <option key={card.id} value={card.id}>{card.topic} - {card.text.substring(0, 50)}...</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-accent uppercase tracking-widest">Câu hỏi</label>
                  <button 
                    onClick={() => handleGenerate(3, p3Text, 'p3')}
                    disabled={isGenerating !== null}
                    className="text-[10px] font-black text-accent flex items-center gap-1 hover:opacity-80 disabled:opacity-50"
                  >
                    {isGenerating === 3 ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    GỢI Ý TRẢ LỜI
                  </button>
                </div>
                <textarea value={p3Text} onChange={e => setP3Text(e.target.value)} placeholder="Do you think famous people should have privacy?" className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Gợi ý trả lời</label>
                <textarea value={p3Answer} onChange={e => setP3Answer(e.target.value)} className="w-full bg-bg border border-border p-4 rounded-2xl focus:outline-none h-32 text-sm leading-relaxed" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onBack} className="flex-1 py-5 bg-bg/50 border border-border text-text-primary font-black rounded-2xl transition-all hover:bg-bg active:scale-95 uppercase tracking-widest text-xs">Huỷ bỏ</button>
          <button onClick={handleSave} className="flex-[2] py-5 bg-accent text-white font-black rounded-2xl transition-all shadow-xl shadow-accent/20 hover:opacity-90 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
            <Save className="w-5 h-5" />
            Lưu Chủ Đề
          </button>
        </div>
      </div>
    </motion.div>
  );
};
