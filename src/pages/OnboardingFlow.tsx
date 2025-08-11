import { useEffect, useMemo, useRef, useState } from "react";
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

type Question = {
  type: "text" | "choice" | "hypothetical";
  prompt: string;
  keyword: string;
  options?: string[];
};
type Module = { topic: string; questions: Question[] };

const MODULES: Module[] = [
  {
    topic: "Goals",
    questions: [
      { type: "text", prompt: "What are your main goals right now?", keyword: "goal" },
      {
        type: "hypothetical",
        prompt: "If you achieved your main goal, how would your life change?",
        keyword: "change",
      },
    ],
  },
  {
    topic: "Values",
    questions: [
      {
        type: "choice",
        prompt: "Which value resonates most with you?",
        options: ["Growth", "Integrity", "Compassion"],
        keyword: "value",
      },
      { type: "text", prompt: "Why is this value important to you?", keyword: "value" },
    ],
  },
  {
    topic: "Skills",
    questions: [
      {
        type: "choice",
        prompt: "Which skill would you like to develop next?",
        options: ["Communication", "Technical", "Leadership"],
        keyword: "skill",
      },
      {
        type: "text",
        prompt: "What steps can you take to improve this skill?",
        keyword: "step",
      },
    ],
  },
  {
    topic: "Habits",
    questions: [
      {
        type: "choice",
        prompt: "What kind of habit do you want to build?",
        options: ["Daily", "Weekly", "Monthly"],
        keyword: "habit",
      },
      { type: "text", prompt: "Describe a habit that would help you grow.", keyword: "habit" },
    ],
  },
  {
    topic: "Challenges",
    questions: [
      { type: "text", prompt: "What challenges are you facing?", keyword: "challenge" },
      {
        type: "hypothetical",
        prompt: "Imagine overcoming these challenges. How would you feel?",
        keyword: "feel",
      },
    ],
  },
];

const MIN_LENGTH = 10;

function validateAnswer(answer: string, moduleIndex: number, questionIndex: number): string | null {
  const question = MODULES[moduleIndex].questions[questionIndex];
  if (question.type === "choice") return null;
  if (answer.length < MIN_LENGTH) return `Please provide at least ${MIN_LENGTH} characters.`;
  const keyword = question.keyword;
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
type Step = { phase: Phase; module: number; question: number };

export default function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const getInitialState = () => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("aurora_chat_v1") ?? "{}") as {
        messages?: Msg[];
        step?: Step;
        goals?: string[];
      };
    } catch {
      return {};
    }
  };

  const initial = getInitialState();
  const initialStep: Step = initial.step || { phase: "start", module: 0, question: 0 };

  const buildInitialAnswers = (goals: string[] | undefined) => {
    const ans = MODULES.map((mod) => Array(mod.questions.length).fill(""));
    if (!goals) return ans;
    let idx = 0;
    for (let m = 0; m < MODULES.length; m++) {
      for (let q = 0; q < MODULES[m].questions.length; q++) {
        if (idx < goals.length) {
          ans[m][q] = goals[idx++];
        }
      }
    }
    return ans;
  };

  const [messages, setMessages] = useState<Msg[]>(initial.messages || []);
  const [phase, setPhase] = useState<Phase>(initialStep.phase);
  const [currentModule, setCurrentModule] = useState<number>(initialStep.module);
  const [questionIndex, setQuestionIndex] = useState<number>(initialStep.question);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[][]>(() => buildInitialAnswers(initial.goals));
  const total = MODULES.reduce((sum, module) => sum + module.questions.length, 0);
  const goals = useMemo(() => answers.flat().filter(Boolean), [answers]);
  const [progressPercent, setProgressPercent] = useState<number>((goals.length / total) * 100);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Persist minimal onboarding state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const step: Step = { phase, module: currentModule, question: questionIndex };
      localStorage.setItem(
        "aurora_chat_v1",
        JSON.stringify({
          step,
          messages,
          goals,
        }),
      );
    }
  }, [phase, currentModule, questionIndex, messages, goals]);

  // Compute progress %
  useEffect(() => {
    const pct = (goals.length / total) * 100;
    setProgressPercent(pct);
  }, [goals, total]);

  // Also persist a simple integer percent for other UIs if needed
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_progress_percent", String(Math.floor(progressPercent)));
    }
  }, [progressPercent]);

  // Kick off conversation
  useEffect(() => {
    if (phase === "start" && messages.length === 0) {
      sendPrompt("Hi, I'm Aurora. Let's get to know you a bit better.");
      setPhase("question");
    }
  }, [phase, messages]);

  // Ask current question if not already asked
  useEffect(() => {
    if (phase !== "question") return;
    const prompt = MODULES[currentModule].questions[questionIndex].prompt;
    const alreadyAsked = messages.some(
      (m) => m.role === "assistant" && m.content === prompt,
    );
    if (!alreadyAsked) {
      askQuestion(currentModule, questionIndex);
    }
  }, [phase, currentModule, questionIndex, messages, askQuestion]);

  const handleSubmit = async (e?: React.FormEvent, choice?: string) => {
    e?.preventDefault();
    const answer = choice ?? input.trim();
    if (!answer) return;

    const userMsg: Msg = { role: "user", content: answer };
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
      await supabase.functions.invoke("generate-plan", { body: { answers: goals } });
    }
    navigate("/app/plan", { replace: true });
  };

  const shouldShowForm = phase !== "vision" && phase !== "start";
  const currentQuestion = MODULES[currentModule]?.questions[questionIndex];
  const showChoice = shouldShowForm && currentQuestion?.type === "choice";
  const showText = shouldShowForm && currentQuestion?.type !== "choice";
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

        {showText && (
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
        {showChoice && currentQuestion?.options && (
          <div className="flex flex-col gap-2 border-t bg-background p-4">
            {currentQuestion.options.map((opt) => (
              <Button key={opt} onClick={() => handleSubmit(undefined, opt)}>
                {opt}
              </Button>
            ))}
          </div>
        )}

        {phase === "vision" && (
          <div className="border-t bg-background p-4">
            <VisionCard answers={goals} onClose={handleFinish} />
          </div>
        )}
      </div>
    </div>
  );
}
