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
  Sun,
  Moon,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const SAMPLE_TEXTS = [
  "Touch typing is a style of typing. Although the phrase refers to typing without using the sense of sight to find the keys—specifically, a touch typist will know their location on the keyboard through muscle memory—the term is often used to refer to a specific form of touch typing that involves placing the eight fingers in a horizontal row along the middle of the keyboard (the home row) and having them reach for specific other keys. Touch typing can be done with two hands or by using only one hand. Touch typing was invented in 1888 by Frank Edward McGurrin, a court stenographer from Salt Lake City, Utah who taught typing classes. McGurrin, who reportedly never looked at the keyboard, was the first person to win a typing contest. Learning to touch type can dramatically improve your typing speed and accuracy. It allows you to focus on the content of what you are writing rather than the mechanics of finding the right keys. With practice, you can achieve speeds of 60 words per minute or higher, making you much more efficient at tasks involving computer work, coding, or writing. Programming requires not only logic and problem-solving skills but also the ability to type code quickly and accurately. Many developers find that their typing speed is a bottleneck when translating thoughts into code. By improving your typing speed, you can keep up with your train of thought and become a more effective programmer. The average typing speed is around 40 words per minute, but professional typists can exceed 100 words per minute. Practice regularly, focus on accuracy first, and the speed will naturally follow.",
  "The history of computing hardware covers the developments from early simple devices to aid calculation to modern day computers. Before the 20th century, most calculations were done by humans. The first computing devices were simple mechanical tools like the abacus, which is still used today in some parts of the world. In the 17th century, inventors began building mechanical calculators. The most famous of these is the Pascaline, invented by Blaise Pascal. In the 19th century, Charles Babbage designed a steam-powered analytical engine, which is considered the first general-purpose computer concept. However, it was never built during his lifetime. The first programmable electronic computer was the ENIAC, completed in 1945. It used vacuum tubes and took up an entire room. The invention of the transistor in 1947 revolutionized computing, leading to smaller, faster, and more reliable computers. The development of integrated circuits in the 1960s further miniaturized computers, paving the way for personal computers in the 1970s and 80s. Today, computers are ubiquitous, powering everything from our smartphones to global networks. Understanding this history gives us an appreciation for the incredible technological progress we've made. For programmers, typing speed is essential because it is the primary interface between human thought and the machine. Efficient typing minimizes the physical effort required to write code, allowing the mind to focus entirely on the logic and architecture of the software. Practicing touch typing helps reduce cognitive load, enabling developers to enter a state of flow more easily and maintain productivity over longer periods.",
  "Web development is the work involved in developing a website for the Internet or an intranet. Web development can range from developing a simple single static page of plain text to complex web applications, electronic businesses, and social network services. A more comprehensive list of tasks to which web development commonly refers, may include web engineering, web design, web content development, client liaison, client-side/server-side scripting, web server and network security configuration, and e-commerce development. Among web professionals, web development usually refers to the main non-design aspects of building web sites: writing markup and coding. Web development may use content management systems (CMS) to make content changes easier and available with basic technical skills. For larger organizations and businesses, web development teams can consist of hundreds of people (web developers) and follow standard methods like Agile methodologies while developing websites. Smaller organizations may only require a single permanent or contracting developer, or secondary assignment to related job positions such as a graphic designer or information systems technician. Web development as an industry has been growing rapidly. The growth of this industry is being driven by businesses wishing to use their website to advertise and sell products and services to customers. There are many open-source tools for web development such as BerkeleyDB, GlassFish, LAMP (Linux, Apache, MySQL, PHP) stack, and Perl/Plack. This has kept the cost of learning web development to a minimum. Another contributing factor to the growth of the industry has been the rise of easy-to-use WYSIWYG web-development software, such as Adobe Dreamweaver, BlueGriffon, and Microsoft Visual Studio. Knowledge of HyperText Markup Language (HTML) or of programming languages is still required to use such software, but the basics can be learned and implemented quickly.",
  "Artifical Intelligence (AI) is a branch of computer science that is concerned with making computers capable of performing tasks that typically require human intelligence. These tasks include learning, problem solving, decision making, and natural language understanding. AI has been around for decades, but it has only recently begun to have a significant impact on our lives. AI is already being used in a wide range of applications, such as self-driving cars, virtual assistants, and medical diagnosis. As AI continues to develop, it is likely to have an even greater impact on our lives. One of the most important aspects of AI is machine learning. Machine learning is a type of AI that allows computers to learn from data without being explicitly programmed. This is done by feeding the computer large amounts of data and allowing it to identify patterns and relationships. Machine learning is used in a wide range of applications, such as spam filtering, recommendation systems, and fraud detection. Another important aspect of AI is natural language processing. Natural language processing is a type of AI that allows computers to understand and process human language. This is done by using a combination of rule-based methods and machine learning techniques. Natural language processing is used in a wide range of applications, such as chatbots, translation services, and sentiment analysis. AI is a rapidly developing field, and it is likely to have an even greater impact on our lives in the future. It is important to stay up to date on the latest developments in AI, as it is likely to play an increasingly important role in our society."
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
    audio.play().catch(() => { });
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
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const isSuccess = wpm >= 20 && accuracy >= 80;

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    resetTest(60);
    const savedTheme = localStorage.getItem("typing-test-theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("typing-test-theme", nextTheme);
  };

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
      inputRef.current.focus({ preventScroll: true });
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
      let correctChars = 0;
      for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === text[i]) {
          correctChars++;
        }
      }

      const wordsTyped = correctChars / 5;
      const minutesElapsed = (duration - timeLeft) / 60;

      let currentWpm = 0;
      if (minutesElapsed > 0) {
        currentWpm = Math.round(wordsTyped / minutesElapsed);
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

      finishTest(value);
    }
  };

  const finishTest = (finalValue?: string) => {
    setStatus("finished");

    const valueToUse = finalValue !== undefined ? finalValue : userInput;
    const minutesElapsed = (duration - timeLeft) / 60;

    let correctChars = 0;
    for (let i = 0; i < valueToUse.length; i++) {
      if (valueToUse[i] === text[i]) {
        correctChars++;
      }
    }

    const finalWpm = minutesElapsed > 0 ? Math.round((correctChars / 5) / minutesElapsed) : 0;
    const finalAccuracy = valueToUse.length > 0 ? Math.round((correctChars / valueToUse.length) * 100) : 100;

    // Confetti for passing score (>=20 WPM and >=80% Accuracy)
    if (finalWpm >= 20 && finalAccuracy >= 80) {
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
      inputRef.current.focus({ preventScroll: true });
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
      let charClass = "";
      if (isCorrect) {
        charClass = theme === "dark" ? "text-emerald-400" : "text-emerald-600 font-semibold";
      } else {
        charClass = theme === "dark"
          ? "text-red-400 bg-red-400/20 rounded-sm"
          : "text-red-600 bg-red-100 rounded-sm";
      }
      const displayChar = char === " " && !isCorrect ? "_" : char;
      return (
        <span key={index} className={charClass}>
          {displayChar}
        </span>
      );
    });

    const cursorChar = status === "finished" ? "" : (text[userInput.length] || "");
    const remainingText = status === "finished" ? text.slice(userInput.length) : text.slice(userInput.length + 1);

    const cursorClass = theme === "dark"
      ? "bg-white/20 text-white border-white"
      : "bg-slate-800/20 text-slate-800 border-slate-800";

    const remainingTextClass = theme === "dark"
      ? "text-slate-500/50"
      : "text-slate-400";

    return (
      <span className="text-xl md:text-2xl font-mono tracking-wide transition-all duration-75">
        {typedElements}
        {status !== "finished" && (
          <span className={`relative animate-pulse rounded-sm border-b-2 ${cursorClass}`}>
            {cursorChar === " " ? "\u00A0" : cursorChar}
          </span>
        )}
        <span className={remainingTextClass}>{remainingText}</span>
      </span>
    );
  };

  if (!isClient) return null;

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col relative overflow-hidden font-sans ${
      theme === "dark"
        ? "bg-[#020817] text-slate-200"
        : "bg-slate-50 text-slate-800"
    }`}>
      {/* Background decorations */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${
        theme === "dark" ? "bg-blue-900/20" : "bg-blue-200/40"
      }`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-all duration-500 ${
        theme === "dark" ? "bg-emerald-900/20" : "bg-emerald-200/40"
      }`} />

      {/* Header */}
      <header className="p-6 flex items-center justify-between z-10 w-full max-w-6xl mx-auto">
        <Link
          href="/"
          className={`flex items-center gap-2 transition-colors ${
            theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="font-medium">Back to Leaderboard</span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-full border transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm relative overflow-hidden group ${
              theme === "dark"
                ? "bg-slate-900/80 border-slate-800 text-yellow-400 hover:bg-slate-800/80 hover:border-slate-700 shadow-slate-950/20"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-slate-200/40"
            }`}
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 transition-transform group-hover:rotate-45 group-hover:scale-110" />
            ) : (
              <Moon className="w-5 h-5 transition-transform group-hover:rotate-12 group-hover:scale-110" />
            )}
          </button>

          <div className={`flex items-center gap-2 font-semibold text-lg tracking-wide px-4 py-2 rounded-full border transition-all duration-300 ${
            theme === "dark"
              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
              : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
          }`}>
            <Keyboard className="w-5 h-5" />
            <span>EMP Typing Academy</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 w-full max-w-6xl mx-auto">
        <div className="w-full flex flex-col gap-8">

          {/* Controls & Stats Bar */}
          <div className={`flex flex-col md:flex-row items-center justify-between border rounded-2xl p-4 md:p-6 shadow-2xl gap-6 transition-all duration-300 ${
            theme === "dark"
              ? "bg-white/5 backdrop-blur-xl border-white/10"
              : "bg-white border-slate-200 shadow-slate-200/50"
          }`}>

            <div className={`flex items-center gap-3 p-1.5 rounded-xl border transition-all duration-300 ${
              theme === "dark"
                ? "bg-slate-900/50 border-white/5"
                : "bg-slate-100 border-slate-200"
            }`}>
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => resetTest(d.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    duration === d.value
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : theme === "dark"
                        ? "text-slate-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-950 hover:bg-slate-200"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-center">
                <span className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Clock className="w-3 h-3" /> Time
                </span>
                <span className={`text-3xl font-bold font-mono transition-colors duration-300 ${
                  timeLeft <= 10 && status === 'typing'
                    ? 'text-red-500 animate-pulse'
                    : theme === "dark"
                      ? 'text-emerald-400'
                      : 'text-emerald-600'
                }`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <div className={`w-px h-12 transition-all duration-300 ${
                theme === "dark" ? "bg-white/10" : "bg-slate-200"
              }`} />

              <div className="flex flex-col items-center">
                <span className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Trophy className="w-3 h-3" /> WPM
                </span>
                <span className={`text-3xl font-bold font-mono transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-slate-800"
                }`}>
                  {wpm}
                </span>
              </div>

              <div className={`w-px h-12 transition-all duration-300 ${
                theme === "dark" ? "bg-white/10" : "bg-slate-200"
              }`} />

              <div className="flex flex-col items-center">
                <span className={`text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1 transition-colors duration-300 ${
                  theme === "dark" ? "text-slate-500" : "text-slate-400"
                }`}>
                  <Target className="w-3 h-3" /> ACC
                </span>
                <span className={`text-3xl font-bold font-mono transition-colors duration-300 ${
                  theme === "dark" ? "text-white" : "text-slate-800"
                }`}>
                  {accuracy}%
                </span>
              </div>
            </div>

            <button
              onClick={() => resetTest()}
              className={`p-3 rounded-xl transition-all border flex items-center gap-2 group cursor-pointer ${
                theme === "dark"
                  ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/5 shadow-inner"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 shadow-sm"
              }`}
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
              className="absolute top-0 left-0 w-px h-px opacity-0 pointer-events-none -z-10"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onBlur={() => {
                // Keep focus if still typing
                if (status === 'typing') {
                  setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 10);
                }
              }}
            />

            <div
              ref={textContainerRef}
              className={`w-full backdrop-blur-md border rounded-3xl p-8 md:p-12 shadow-2xl transition-all duration-300 min-h-[300px] ${
                theme === "dark"
                  ? status === "idle"
                    ? "bg-slate-900/40 border-white/10 hover:border-emerald-500/30"
                    : status === "typing"
                      ? "bg-slate-900/40 border-emerald-500/50 shadow-emerald-500/10"
                      : "bg-slate-900/40 border-white/10 opacity-50"
                  : status === "idle"
                    ? "bg-white border-slate-200 hover:border-emerald-500/30 shadow-sm"
                    : status === "typing"
                      ? "bg-white border-emerald-500/50 shadow-emerald-500/5"
                      : "bg-white border-slate-200 opacity-50 shadow-sm"
              }`}
            >
              {status === "idle" && (
                <div className={`absolute inset-0 flex items-center justify-center backdrop-blur-sm rounded-3xl z-10 opacity-0 group-hover:opacity-100 transition-opacity ${
                  theme === "dark" ? "bg-slate-900/60" : "bg-white/60"
                }`}>
                  <span className={`text-xl font-medium flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 ${
                    theme === "dark"
                      ? "text-white bg-emerald-500/20 border-emerald-500/30"
                      : "text-emerald-700 bg-emerald-50 border-emerald-200 shadow-md"
                  }`}>
                    <Type className={`w-6 h-6 ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`} /> Start Typing to Begin
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
        <div className={`fixed inset-0 backdrop-blur-lg z-50 flex items-center justify-center p-4 animate-in fade-in duration-300 ${
          theme === "dark" ? "bg-slate-950/80" : "bg-slate-900/50"
        }`}>
          <div className={`border p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center text-center animate-in zoom-in-95 duration-500 relative overflow-hidden transition-all duration-300 ${
            theme === "dark"
              ? "bg-slate-900 border-white/10"
              : "bg-white border-slate-200"
          }`}>

            {/* Modal background glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-all duration-500 ${
              isSuccess
                ? theme === "dark" ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
                : theme === "dark" ? 'bg-red-500/20' : 'bg-red-500/10'
            }`} />

            <div className="relative z-10 flex flex-col items-center w-full">
              {isSuccess ? (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border shadow-lg transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-emerald-500/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                    : "bg-emerald-50 border-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                }`}>
                  <CheckCircle2 className={`w-10 h-10 ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`} />
                </div>
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border shadow-lg transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-red-500/20 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                    : "bg-red-50 border-red-200 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                }`}>
                  <XCircle className={`w-10 h-10 ${theme === "dark" ? "text-red-400" : "text-red-600"}`} />
                </div>
              )}

              <h2 className={`text-3xl font-bold mb-2 transition-colors duration-300 ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                Test Completed!
              </h2>
              <p className={`mb-8 transition-colors duration-300 ${theme === "dark" ? "text-slate-400" : "text-slate-650"}`}>
                {isSuccess
                  ? "Great job! You have passed the typing assessment."
                  : "Keep practicing! Target is 20 WPM and 80% Accuracy."}
              </p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-300 ${
                    theme === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}>Final WPM</span>
                  <span className={`text-5xl font-bold transition-colors duration-300 ${
                    wpm >= 20
                      ? theme === "dark" ? 'text-emerald-400' : 'text-emerald-600'
                      : theme === "dark" ? 'text-red-400' : 'text-red-600'
                  }`}>{wpm}</span>
                </div>
                <div className={`border rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 ${
                  theme === "dark"
                    ? "bg-white/5 border-white/5"
                    : "bg-slate-50 border-slate-100"
                }`}>
                  <span className={`text-xs font-semibold uppercase tracking-wider mb-2 transition-colors duration-300 ${
                    theme === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}>Accuracy</span>
                  <span className={`text-5xl font-bold transition-colors duration-300 ${
                    accuracy >= 80
                      ? theme === "dark" ? 'text-emerald-400' : 'text-emerald-600'
                      : theme === "dark" ? 'text-red-400' : 'text-red-600'
                  }`}>{accuracy}%</span>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full">
                <button
                  onClick={() => resetTest()}
                  className={`flex-1 font-medium py-4 px-6 rounded-xl transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    theme === "dark"
                      ? "bg-white/5 hover:bg-white/10 text-white border-white/10 shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 shadow-sm"
                  }`}
                >
                  <RefreshCw className="w-5 h-5" /> Try Again
                </button>
                <Link
                  href="/"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 px-6 rounded-xl transition-all flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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
