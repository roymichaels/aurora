import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import VisionCard from "@/components/onboarding/VisionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Chat-based onboarding flow that gathers key info about the user
// including their goals, values, skills, habits, and challenges.

type Msg = { role: "assistant" | "user"; content: string };
type ChatMsg = Msg | { role: "system"; content: string };

type Question = { prompt: string; keyword: string };
type Module = { topic: string; questions: Question[] };

const MODULES: Module[] = [
  { topic: "Goals", questions: [{ prompt: "What are your main goals right now?", keyword: "goal" }] },
  { topic: "Values", questions: [{ prompt: "What personal values matter most to you?", keyword: "value" }] },
  { topic: "Skills", questions: [{ prompt: "What key skills do you want to develop?", keyword: "skill" }] },
  { topic: "Habits", questions: [{ prompt: "What habits would help you grow?", keyword: "habit" }] },
  { topic: "Challenges", questions: [{ prompt: "What challenges are you facing?", keyword: "challenge" }] },
];

const MIN_LENGTH = 10;

function validateAnswer(answer: string, moduleIndex: number, questionIndex: number): string | null {
  if (answer.length < MIN_LENGTH) return `Please provide at least ${MIN_LENGTH} characters.`;
  const keyword = MODULES[moduleIndex].questions[questionIndex].keyword;
  if (keyword && !answer.toLowerCase().includes(keyword)) {
    return `Please mention the word "${keyword}" in your response.`;
  }
  return null;
}

const MAX_QUESTIONS = Math.max(...MODULES.map((m) => m.questions.length));

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

type Phase = "start" | "question" | "summary" | "vision";

export default function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const total = MODULES.reduce((sum, module) => sum + module.questions.length, 0);

  const sendPrompt = (prompt: string) => {
    setMessages((msgs) => {
      if (msgs.some((m) => m.role === "assistant" && m.content === prompt)) return msgs;
      return [...msgs, { role: "assistant", content: prompt }];
    });
  };

  const askQuestion = (mIndex: number, qIndex: number) => {
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
  };

  const showSummary = (currentAnswers: string[][]) => {
    const lines: string[] = [];
    MODULES.forEach((mod, mi) => {
      mod.questions.forEach((q, qi) => {
        const ans = currentAnswers[mi]?.[qi];
        if (ans) lines.push(`- ${q.keyword}: ${ans}`);
      });
    });
    sendPrompt(`Here's what I heard:\n${lines.join("\n")}\nDoes this look right?`);
    setPhase("summary");
  };

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
        }),
      );
    }
  }, [messages, phase, currentModule, questionIndex, progressPercent, answers]);

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
  }, [phase, currentModule, questionIndex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    let error: string | null = null;
    if (phase === "question") {
      error = validateAnswer(userMsg.content, currentModule, questionIndex);
    }

    const baseMessages: ChatMsg[] = [
      { role: "system", content: "You are a friendly onboarding assistant. Keep replies short and encouraging." },
      ...newMessages,
    ];

    if (error) {
      baseMessages.push({
        role: "system",
        content: `The user's last answer failed validation: ${error} Ask them to clarify or provide more detail.`,
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

    const { data } = await supabase.functions.invoke("aurora-chat", { body: { messages: baseMessages } });
    if (data?.content) {
      setMessages((m) => [...m, { role: "assistant", content: data.content }]);
    }
    if (error) return;

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

      const next = getNextState(currentModule, questionIndex);
      if (next.module === null) {
        showSummary(updatedAnswers);
      } else {
        setCurrentModule(next.module);
        setQuestionIndex(next.question);
        askQuestion(next.module, next.question);
      }
    } else if (phase === "summary") {
      setPhase("vision");
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
      await supabase.functions.invoke("generate-plan", { body: { answers: answers.flat() } });
    }
    navigate("/app/plan", { replace: true });
  };

  const shouldShowForm = phase !== "vision" && phase !== "start";
  const percentDisplay = Math.floor(progressPercent);

  return (
    <div className="relative h-svh w-screen">
      <div className="os-bg" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="p-4">
          <div className="relative">
            <Progress value={progressPercent} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="text-xs text-secondary-foreground">{percentDisplay}%</span>
            </div>
          </div>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 text-sm">
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
        </ScrollArea>

        {shouldShowForm && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t bg-background p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer..."
              className="resize-none"
            />
            <Button type="submit" className="self-end">
              Continue
            </Button>
          </form>
        )}

        {phase === "vision" && (
          <div className="border-t bg-background p-4">
            <VisionCard answers={answers.flat()} onClose={handleFinish} />
          </div>
        )}
      </div>
    </div>
  );
}
