import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTonSession } from "@/hooks/useTonSession";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { useTextToSpeech } from "@/voice/useTextToSpeech";
import {
  buildProfile,
  ConversationResponse,
  saveProfile,
} from "@/data/profile";
import { setEncryptionKey } from "@/state/encryption";
import { Volume2 } from "lucide-react";


type Msg = { role: "assistant" | "user"; content: string };
type ChatMsg = Msg | { role: "system"; content: string };

type Question = { prompt: string; keyword: string };
type Module = { topic: string; questions: Question[] };

const MODULES: Module[] = [
  {
    topic: "Mission",
    questions: [
      { prompt: "What's your mission headline?", keyword: "headline" },
      { prompt: "What's the deadline?", keyword: "deadline" },
      { prompt: "Any priors I should consider?", keyword: "priors" },
      { prompt: "Which scopes apply? (personal, team, organization)", keyword: "scopes" },
    ],
  },
];

const MIN_LENGTH = 10;

function validateAnswer(
  answer: string,
  moduleIndex: number,
  questionIndex: number,
): string | null {
  if (answer.length < MIN_LENGTH) {
    return `Could you add a bit more detail (at least ${MIN_LENGTH} characters)?`;
  }

  const keyword = MODULES[moduleIndex].questions[questionIndex].keyword;
  const lower = answer.toLowerCase();

  switch (keyword) {
    case "deadline": {
      const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|next\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|tomorrow|today|tonight)\b/;
      if (!dateRegex.test(lower)) {
        return "A timeframe helps with planning. When would you like it done?";
      }
      break;
    }
    case "scopes": {
      if (!/(personal|team|organization|company|group|individual)/.test(lower)) {
        return "Is this personal, for your team, or for your organization?";
      }
      break;
    }
    case "priors": {
      if (answer.trim().split(/\s+/).length < 2) {
        return "Any prior context I should know about?";
      }
      break;
    }
    case "headline": {
      if (answer.trim().split(/\s+/).length < 2) {
        return "Could you share a short headline?";
      }
      break;
    }
    default:
      break;
  }

  return null;
}

const MAX_QUESTIONS = Math.max(...MODULES.map((m) => m.questions.length));

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const getNextState = (
  moduleIndex: number,
  questionIndex: number,
): { module: number | null; question: number } => {
  let nextModule = moduleIndex + 1;
  let qIdx = questionIndex;

  for (; qIdx < MAX_QUESTIONS; qIdx++) {
    for (let m = nextModule; m < MODULES.length; m++) {
      if (MODULES[m].questions[qIdx]) {
        return { module: m, question: qIdx };
      }
    }
    nextModule = 0;
  }
  return { module: null, question: qIdx };
};

type Phase = "start" | "question" | "summary";

export default function OnboardingFlow() {
  const { user } = useTonSession();
  const navigate = useNavigate();

  // SINGLE instance
  const { speak, cancel, isSpeaking, blocked, resume } = useTextToSpeech();

  const getInitialState = () => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("aurora_chat_v1") ?? "{}") as {
        messages?: Msg[];
        phase?: Phase;
        currentModule?: number;
        questionIndex?: number;
        progressPercent?: number;
        answers?: string[][];
        questionHistory?: { module: number; question: number }[];
      };
    } catch {
      return {};
    }
  };

  const initial = getInitialState();

  const [messages, setMessages] = useState<Msg[]>(initial.messages || []);
  const [phase, setPhase] = useState<Phase>(initial.phase || "start");
  const [currentModule, setCurrentModule] = useState<number>(initial.currentModule || 0);
  const [questionIndex, setQuestionIndex] = useState<number>(initial.questionIndex || 0);
  const [progressPercent, setProgressPercent] = useState<number>(initial.progressPercent || 0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[][]>(initial.answers || MODULES.map(() => []));
  const [questionHistory, setQuestionHistory] = useState<{ module: number; question: number }[]>(
    initial.questionHistory || [],
  );
  const [editing, setEditing] = useState(false);
  const [headline, setHeadline] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priors, setPriors] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [missionPreview, setMissionPreview] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) setEncryptionKey(user.id);
  }, [user]);

  const total = MODULES.reduce((sum, module) => sum + module.questions.length, 0);

  const sendPrompt = useCallback((prompt: string) => {
    setMessages((msgs) => {
      if (msgs.some((m) => m.role === "assistant" && m.content === prompt)) return msgs;
      return [...msgs, { role: "assistant", content: prompt }];
    });
  }, []);

  const askQuestion = useCallback(
    (mIndex: number, qIndex: number) => {
      const prompt = MODULES[mIndex].questions[qIndex].prompt;
      const prev: string[] = [];
      answers.forEach((ans, mi) => {
        if (mi < mIndex) {
          ans.forEach((a, qi) => {
            if (a) prev.push(`${MODULES[mi].questions[qi].keyword}: ${a}`);
          });
        }
      });
      const prefix = prev.length ? `Earlier you mentioned ${prev.join("; ")}. ` : "";
      sendPrompt(prefix + prompt);
      setQuestionHistory((h) => {
        if (h.some((q) => q.module === mIndex && q.question === qIndex)) return h;
        return [...h, { module: mIndex, question: qIndex }];
      });
    },
    [answers, sendPrompt],
  );

  const showSummary = async () => {
    const brief = { headline, deadline, priors };
    if (user) {
      const { data } = await supabase.functions.invoke("synthesize-mission", {
        body: { user_id: user.id, brief, scopes },
      });
      if (data) setMissionPreview(data);
    }
    setPhase("summary");
  };

  // Speak assistant messages as they appear
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === "assistant") speak(last.content);
    return cancel;
  }, [messages, speak, cancel]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist whole onboarding state
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "aurora_chat_v1",
        JSON.stringify({
          messages,
          phase,
          currentModule,
          questionIndex,
          progressPercent,
          answers,
          questionHistory,
        }),
      );
    }
  }, [messages, phase, currentModule, questionIndex, progressPercent, answers, questionHistory]);

  // Compute progress %
  useEffect(() => {
    const answered = answers.reduce((sum, arr) => sum + arr.filter(Boolean).length, 0);
    const pct = (answered / total) * 100;
    setProgressPercent(pct);
  }, [answers, total]);

  // Also persist a simple integer percent for other UIs if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_progress_percent", String(Math.floor(progressPercent)));
    }
  }, [progressPercent]);

  // Kick off first question
  useEffect(() => {
    if (phase === "start") {
      sendPrompt("Hi, I'm Aurora. Let's get to know you a bit better.");
      setPhase("question");
      setTimeout(() => askQuestion(currentModule, questionIndex), 0);
    }
  }, [phase, currentModule, questionIndex, askQuestion, sendPrompt]);

  const handleEdit = (mIndex: number, qIndex: number) => {
    setPhase("question");
    setCurrentModule(mIndex);
    setQuestionIndex(qIndex);
    setInput(answers[mIndex]?.[qIndex] || "");
    setEditing(true);
    setTimeout(() => askQuestion(mIndex, qIndex), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    let validationError: string | null = null;
    if (phase === "question") {
      validationError = validateAnswer(userMsg.content, currentModule, questionIndex);
    }

    const baseMessages: ChatMsg[] = [
      { role: "system", content: "You are a friendly onboarding assistant. Keep replies short and encouraging." },
      ...newMessages,
    ];

    if (validationError) {
      baseMessages.push({
        role: "system",
        content: `The user's last answer failed validation: ${validationError} Ask them to clarify or provide more detail.`,
      });
    }

    const summaryParts: string[] = [];
    MODULES.forEach((mod, mi) => {
      mod.questions.forEach((q, qi) => {
        const ans = mi === currentModule && qi === questionIndex ? userMsg.content : answers[mi]?.[qi];
        if (ans) summaryParts.push(`${q.keyword}: ${ans}`);
      });
    });
    if (summaryParts.length > 0) {
      baseMessages.push({
        role: "system",
        content: `Relevant past answers: ${summaryParts.join(
          "; ",
        )}. Reference the user's earlier statements when replying, e.g., "Earlier you mentioned..."`,
      });
    }

    const { data, error } = await supabase.functions.invoke<{ content: string }>(
      "aurora-chat",
      { body: { messages: baseMessages } },
    );
    if (error || !data?.content) {
      console.error("aurora-chat error", error, data);
      sendPrompt("Sorry, I had trouble responding. Please try again.");
    } else {
      setMessages((m) => [...m, { role: "assistant", content: data.content }]);
    }
    if (validationError) return;

    if (phase === "question") {
      const updatedAnswers = answers.map((a) => [...a]);

      if (user) {
        await supabase.from("onboarding_answers").insert({
          user_id: user.id,
          question: MODULES[currentModule].questions[questionIndex].prompt,
          answer: userMsg.content,
        });
      }

      if (!updatedAnswers[currentModule]) updatedAnswers[currentModule] = [];
      updatedAnswers[currentModule][questionIndex] = userMsg.content;
      setAnswers(updatedAnswers);

      const responses: ConversationResponse[] = [];
      MODULES.forEach((mod, mi) => {
        mod.questions.forEach((q, qi) => {
          const ans = updatedAnswers[mi]?.[qi];
          if (ans) responses.push({ question: q.prompt, answer: ans });
        });
      });
      const profileData = buildProfile(responses);
      saveProfile(profileData);
      if (user) {
        await supabase
          .from("profiles")
          .update({ persona: profileData })
          .eq("id", user.id);
      }

      if (currentModule === 0) {
        if (questionIndex === 0) setHeadline(userMsg.content);
        if (questionIndex === 1) setDeadline(userMsg.content);
        if (questionIndex === 2) setPriors(userMsg.content);
        if (questionIndex === 3)
          setScopes(
            userMsg.content
              .split(/[,\s]+/)
              .map((s) => s.trim())
              .filter(Boolean),
          );
      }

      const next = getNextState(currentModule, questionIndex);
      if (editing) {
        setEditing(false);
        await showSummary();
      } else if (next.module === null) {
        await showSummary();
      } else {
        setCurrentModule(next.module);
        setQuestionIndex(next.question);
        askQuestion(next.module, next.question);
      }
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
    }
    navigate("/app/plan", { replace: true });
  };

  const handleRegenerate = async () => {
    if (!user) return;
    const brief = { headline, deadline, priors };
    const { data } = await supabase.functions.invoke("synthesize-mission", {
      body: { user_id: user.id, brief, scopes },
    });
    if (data) setMissionPreview(data);
  };

  const handleAdjust = () => {
    setPhase("question");
    setMessages([]);
    setCurrentModule(0);
    setQuestionIndex(0);
    setProgressPercent(0);
    setAnswers(MODULES.map(() => []));
    setQuestionHistory([]);
    setMissionPreview(null);
    setHeadline("");
    setDeadline("");
    setPriors("");
    setScopes([]);
    setTimeout(() => askQuestion(0, 0), 0);
  };

  const shouldShowForm = phase === "question";
  const percentDisplay = Math.floor(progressPercent);

  return (
    <div className="relative h-svh w-screen">
      <div className="os-bg" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex-shrink-0 flex flex-col items-center gap-4 p-4">
          <AuroraSphere size={220} speaking={isSpeaking} />
          {blocked && (
            <button
              type="button"
              onClick={resume}
              className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3" />
              Tap to play
            </button>
          )}
          <div className="relative w-full">
            <Progress value={progressPercent} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="text-xs text-secondary-foreground">{percentDisplay}%</span>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 text-sm" role="log" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div aria-live="polite" className="sr-only">
            {messages.length > 0 ? messages[messages.length - 1].content : ""}
          </div>
        </ScrollArea>

        {shouldShowForm && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t bg-background p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer..."
              className="resize-none"
              onFocus={() => {
                /* voice enabled via service */
              }}
            />
            <Button
              type="submit"
              className="self-end"
              onClick={() => {
                /* voice enabled via service */
              }}
            >
              Continue
            </Button>
          </form>
        )}

        {phase === "summary" && missionPreview && (
          <div className="border-t bg-background p-4 space-y-4 text-sm">
            <div className="space-y-1">
              <div className="font-semibold">Mission Brief</div>
              {questionHistory.map(({ module, question }) => {
                const q = MODULES[module].questions[question];
                const ans = answers[module]?.[question];
                if (!ans) return null;
                return (
                  <div key={`${module}-${question}`} className="flex justify-between gap-2">
                    <div className="flex-1">
                      <strong>{capitalize(q.keyword)}:</strong> {ans}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => handleEdit(module, question)}
                    >
                      Edit
                    </Button>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Targets</div>
              <div>
                {missionPreview.months} months, monthly target {missionPreview.monthlyTarget}
              </div>
              <div className="font-semibold pt-2">Funnel</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                {JSON.stringify(missionPreview.funnel, null, 2)}
              </pre>
            </div>
            <div className="space-y-1">
              <div className="font-semibold">Roadmap Preview</div>
              <div>{missionPreview.months} months until your deadline.</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleFinish}>Accept</Button>
              <Button variant="secondary" onClick={handleAdjust}>
                Adjust numbers
              </Button>
              <Button variant="outline" onClick={handleRegenerate}>
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
