"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  RefreshCw,
  Clock,
  Trophy,
  Target,
  Type,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  Keyboard,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const SAMPLE_TEXTS = [
  "Touch typing is a style of typing. Although the phrase refers to typing without using the sense of sight to find the keys—specifically, a touch typist will know their location on the keyboard through muscle memory—the term is often used to refer to a specific form of touch typing that involves placing the eight fingers in a horizontal row along the middle of the keyboard (the home row) and having them reach for specific other keys. Touch typing can be done with two hands or by using only one hand. Touch typing was invented in 1888 by Frank Edward McGurrin, a court stenographer from Salt Lake City, Utah who taught typing classes. McGurrin, who reportedly never looked at the keyboard, was the first person to win a typing contest. Learning to touch type can dramatically improve your typing speed and accuracy. It allows you to focus on the content of what you are writing rather than the mechanics of finding the right keys. With practice, you can achieve speeds of 60 words per minute or higher, making you much more efficient at tasks involving computer work, coding, or writing. Programming requires not only logic and problem-solving skills but also the ability to type code quickly and accurately. Many developers find that their typing speed is a bottleneck when translating thoughts into code. By improving your typing speed, you can keep up with your train of thought and become a more effective programmer. The average typing speed is around 40 words per minute, but professional typists can exceed 100 words per minute. Practice regularly, focus on accuracy first, and the speed will naturally follow.",
  "The history of computing hardware covers the developments from early simple devices to aid calculation to modern day computers. Before the 20th century, most calculations were done by humans. The first computing devices were simple mechanical tools like the abacus, which is still used today in some parts of the world. In the 17th century, inventors began building mechanical calculators. The most famous of these is the Pascaline, invented by Blaise Pascal. In the 19th century, Charles Babbage designed a steam-powered analytical engine, which is considered the first general-purpose computer concept. However, it was never built during his lifetime. The first programmable electronic computer was the ENIAC, completed in 1945. It used vacuum tubes and took up an entire room. The invention of the transistor in 1947 revolutionized computing, leading to smaller, faster, and more reliable computers. The development of integrated circuits in the 1960s further miniaturized computers, paving the way for personal computers in the 1970s and 80s. Today, computers are ubiquitous, powering everything from our smartphones to global networks. Understanding this history gives us an appreciation for the incredible technological progress we've made. For programmers, typing speed is essential because it is the primary interface between human thought and the machine. Efficient typing minimizes the physical effort required to write code, allowing the mind to focus entirely on the logic and architecture of the software. Practicing touch typing helps reduce cognitive load, enabling developers to enter a state of flow more easily and maintain productivity over longer periods.",
  "Web development is the work involved in developing a website for the Internet or an intranet. Web development can range from developing a simple single static page of plain text to complex web applications, electronic businesses, and social network services. A more comprehensive list of tasks to which web development commonly refers, may include web engineering, web design, web content development, client liaison, client-side/server-side scripting, web server and network security configuration, and e-commerce development. Among web professionals, web development usually refers to the main non-design aspects of building web sites: writing markup and coding. Web development may use content management systems (CMS) to make content changes easier and available with basic technical skills. For larger organizations and businesses, web development teams can consist of hundreds of people (web developers) and follow standard methods like Agile methodologies while developing websites. Smaller organizations may only require a single permanent or contracting developer, or secondary assignment to related job positions such as a graphic designer or information systems technician. Web development as an industry has been growing rapidly. The growth of this industry is being driven by businesses wishing to use their website to advertise and sell products and services to customers. There are many open-source tools for web development such as BerkeleyDB, GlassFish, LAMP (Linux, Apache, MySQL, PHP) stack, and Perl/Plack. This has kept the cost of learning web development to a minimum. Another contributing factor to the growth of the industry has been the rise of easy-to-use WYSIWYG web-development software, such as Adobe Dreamweaver, BlueGriffon, and Microsoft Visual Studio. Knowledge of HyperText Markup Language (HTML) or of programming languages is still required to use such software, but the basics can be learned and implemented quickly."
];

const DURATIONS = [
  { label: "1 Minute", value: 60 },
  { label: "3 Minutes", value: 180 },
  { label: "5 Minutes", value: 300 },
];

let audioCtx: AudioContext | null = null;
const clickSoundPool: HTMLAudioElement[] = [];

const playClickSound = (type: "correct" | "error" | "backspace") => {
  try {
    if (typeof window === "undefined") return;

    if (type === "error") {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
      return;
    }

    let audio = clickSoundPool.find(a => a.paused || a.ended);
    if (!audio) {
      audio = new Audio("/singleKey-type-sound.mp3");
      clickSoundPool.push(audio);
    }
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (e) {
    // Ignore audio errors
  }
};

export default function TypingTestPage() {
  const [text, setText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<"idle" | "typing" | "finished">("idle");
  const [duration, setDuration] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isClient, setIsClient] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    resetTest(60);
  }, []);

  const resetTest = useCallback((newDuration?: number) => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setText(randomText);
    setUserInput("");
    setStatus("idle");
    const d = newDuration ?? duration;
    setDuration(d);
    setTimeLeft(d);
    setWpm(0);
    setAccuracy(100);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [duration]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "typing" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && status === "typing") {
      finishTest();
    }
    return () => clearInterval(timer);
  }, [status, timeLeft]);

  useEffect(() => {
    if (status === "typing" || status === "finished") {
      const wordsTyped = userInput.length / 5;
      const minutesElapsed = (duration - timeLeft) / 60;

      let currentWpm = 0;
      if (minutesElapsed > 0) {
        currentWpm = Math.round(wordsTyped / minutesElapsed);
      }

      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === text[i]) {
          correctChars++;
        }
      }

      const currentAccuracy =
        userInput.length > 0
          ? Math.round((correctChars / userInput.length) * 100)
          : 100;

      setWpm(currentWpm);
      setAccuracy(currentAccuracy);
    }
  }, [userInput, timeLeft, duration, status, text]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (status === "finished") return;

    if (status === "idle") {
      setStatus("typing");
    }

    const value = e.target.value;

    if (value.length > text.length) return;

    if (value.length > userInput.length) {
      const lastCharWrong = value[value.length - 1] !== text[value.length - 1];
      playClickSound(lastCharWrong ? "error" : "correct");
    } else if (value.length < userInput.length) {
      playClickSound("backspace");
    }

    setUserInput(value);

    if (value.length === text.length) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      finishTest();
    }
  };

  const finishTest = () => {
    setStatus("finished");
    
    // Confetti for passing score (>20 WPM)
    const finalWpm = Math.round((userInput.length / 5) / (duration / 60));
    if (finalWpm >= 20) {
      const confettiDuration = 3 * 1000;
      const end = Date.now() + confettiDuration;
      
      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#22c55e', '#3b82f6', '#eab308']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#22c55e', '#3b82f6', '#eab308']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  };

  const handleAreaClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const renderText = () => {
    const typedElements = userInput.split("").map((char, index) => {
      const isCorrect = char === text[index];
      const charClass = isCorrect ? "text-emerald-400" : "text-red-400 bg-red-400/20 rounded-sm";
      const displayChar = char === " " && !isCorrect ? "_" : char;
      return (
        <span key={index} className={charClass}>
          {displayChar}
        </span>
      );
    });

    const cursorChar = status === "finished" ? "" : (text[userInput.length] || "");
    const remainingText = status === "finished" ? text.slice(userInput.length) : text.slice(userInput.length + 1);

    return (
      <span className="text-xl md:text-2xl font-mono tracking-wide transition-all duration-75">
        {typedElements}
        {status !== "finished" && (
          <span className="relative animate-pulse bg-white/20 text-white rounded-sm border-b-2 border-white">
            {cursorChar === " " ? "\u00A0" : cursorChar}
          </span>
        )}
        <span className="text-slate-500/50">{remainingText}</span>
      </span>
    );
  };

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#020817] text-slate-200 flex flex-col relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Leaderboard</span>
        </Link>
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-lg tracking-wide bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20">
          <Keyboard className="w-5 h-5" />
          <span>EMP Typing Academy</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full max-w-6xl mx-auto">
        <div className="w-full flex flex-col gap-8">
          
          {/* Controls & Stats Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl gap-6">
            
            <div className="flex items-center gap-3 bg-slate-900/50 p-1.5 rounded-xl border border-white/5">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => resetTest(d.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    duration === d.value
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Time
                </span>
                <span className={`text-3xl font-bold font-mono ${timeLeft <= 10 && status === 'typing' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="w-px h-12 bg-white/10" />
              
              <div className="flex flex-col items-center">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> WPM
                </span>
                <span className="text-3xl font-bold font-mono text-white">
                  {wpm}
                </span>
              </div>

              <div className="w-px h-12 bg-white/10" />

              <div className="flex flex-col items-center">
                <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> ACC
                </span>
                <span className="text-3xl font-bold font-mono text-white">
                  {accuracy}%
                </span>
              </div>
            </div>

            <button
              onClick={() => resetTest()}
              className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-white/5 shadow-inner flex items-center gap-2 group"
              title="Restart Test"
            >
              <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              <span className="hidden md:inline text-sm font-medium">Restart</span>
            </button>
          </div>

          {/* Typing Area */}
          <div
            className="w-full relative group cursor-text"
            onClick={handleAreaClick}
          >
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className="absolute opacity-0 -z-10 w-full h-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onBlur={() => {
                 // Keep focus if still typing
                 if(status === 'typing') {
                    setTimeout(() => inputRef.current?.focus(), 10);
                 }
              }}
            />
            
            <div
              ref={textContainerRef}
              className={`w-full bg-slate-900/40 backdrop-blur-md border rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-300 min-h-[300px] ${
                status === "idle"
                  ? "border-white/10 hover:border-emerald-500/30"
                  : status === "typing"
                  ? "border-emerald-500/50 shadow-emerald-500/10"
                  : "border-white/10 opacity-50"
              }`}
            >
              {status === "idle" && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-3xl z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xl font-medium text-white flex items-center gap-2 bg-emerald-500/20 px-6 py-3 rounded-full border border-emerald-500/30">
                    <Type className="w-6 h-6 text-emerald-400" /> Start Typing to Begin
                  </span>
                </div>
              )}
              
              <div className="leading-relaxed whitespace-pre-wrap select-none" style={{ wordSpacing: '0.2em' }}>
                {renderText()}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Results Modal */}
      {status === "finished" && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-500 relative overflow-hidden">
            
            {/* Modal background glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none ${wpm >= 20 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />

            <div className="relative z-10 flex flex-col items-center w-full">
              {wpm >= 20 ? (
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                  <XCircle className="w-10 h-10 text-red-400" />
                </div>
              )}

              <h2 className="text-3xl font-bold text-white mb-2">Test Completed!</h2>
              <p className="text-slate-400 mb-8">
                {wpm >= 20 
                  ? "Great job! You have passed the typing assessment."
                  : "Keep practicing! The target is 20 WPM."}
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Final WPM</span>
                  <span className={`text-5xl font-bold ${wpm >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{wpm}</span>
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
                  <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">Accuracy</span>
                  <span className="text-5xl font-bold text-white">{accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={() => resetTest()}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-4 px-6 rounded-xl transition-colors border border-white/10 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Try Again
                </button>
                <Link
                  href="/"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 px-6 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/20"
                >
                  Back to Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
