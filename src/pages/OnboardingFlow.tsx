import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import VisionCard from "@/components/VisionCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Chat-based onboarding flow that gathers key info about the user
// including their goals, values, skills, habits, and challenges.

type Msg = { role: "assistant" | "user"; content: string };
type ChatMsg = Msg | { role: "system"; content: string };

enum Step {
  START = "START",
  GREET = "GREET",
  ASK_MAIN_GOAL = "ASK_MAIN_GOAL",
  ASK_VALUES = "ASK_VALUES",
  ASK_SKILLS = "ASK_SKILLS",
  ASK_HABITS = "ASK_HABITS",
  ASK_CHALLENGES = "ASK_CHALLENGES",
  CONFIRM_SUMMARY = "CONFIRM_SUMMARY",
  SHOW_VISION = "SHOW_VISION",
}

const PROMPTS: Record<Step, string> = {
  [Step.GREET]: "Hi, I'm Aurora. Let's get to know you a bit better.",
  [Step.ASK_MAIN_GOAL]: "What are your main goals right now?",
  [Step.ASK_VALUES]: "What personal values matter most to you?",
  [Step.ASK_SKILLS]: "What key skills do you want to develop?",
  [Step.ASK_HABITS]: "What habits would help you grow?",
  [Step.ASK_CHALLENGES]: "What challenges are you facing?",
};

const QUESTION_STEPS = [
  Step.ASK_MAIN_GOAL,
  Step.ASK_VALUES,
  Step.ASK_SKILLS,
  Step.ASK_HABITS,
  Step.ASK_CHALLENGES,
];

const MIN_LENGTH = 10;
const REQUIRED_KEYWORDS = ["goal", "value", "skill", "habit", "challenge"];

function validateAnswer(answer: string, index: number): string | null {
  if (answer.length < MIN_LENGTH)
    return `Please provide at least ${MIN_LENGTH} characters.`;
  const keyword = REQUIRED_KEYWORDS[index];
  if (keyword && !answer.toLowerCase().includes(keyword)) {
    return `Please mention the word "${keyword}" in your response.`;
  }
  return null;
}

const nextStep = (s: Step): Step | null => {
  switch (s) {
    case Step.START:
      return Step.GREET;
    case Step.GREET:
      return Step.ASK_MAIN_GOAL;
    case Step.ASK_MAIN_GOAL:
      return Step.ASK_VALUES;
    case Step.ASK_VALUES:
      return Step.ASK_SKILLS;
    case Step.ASK_SKILLS:
      return Step.ASK_HABITS;
    case Step.ASK_HABITS:
      return Step.ASK_CHALLENGES;
    case Step.ASK_CHALLENGES:
      return Step.CONFIRM_SUMMARY;
    case Step.CONFIRM_SUMMARY:
      return Step.SHOW_VISION;
    default:
      return null;
  }
};

export default function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const getInitialState = () => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("aurora_chat_v1") ?? "{}") as {
        messages?: Msg[];
        step?: Step;
        answers?: string[];
      };
    } catch {
      return {};
    }
  };
  const initial = getInitialState();
  const [messages, setMessages] = useState<Msg[]>(initial.messages || []);
  const [step, setStep] = useState<Step>(initial.step || Step.START);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>(initial.answers || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const total = QUESTION_STEPS.length;

  const transition = (next: Step, currentAnswers: string[] = answers) => {
    setStep(next);
    setMessages((msgs) => {
      let prompt: string | undefined;
      if (next === Step.CONFIRM_SUMMARY) {
        prompt = `Here's what I heard:\n${currentAnswers
          .map((a, i) => `- ${REQUIRED_KEYWORDS[i]}: ${a}`)
          .join("\n")}\nDoes this look right?`;
      } else {
        prompt = PROMPTS[next];
      }
      if (
        prompt &&
        !msgs.some((m) => m.role === "assistant" && m.content === prompt)
      ) {
        return [...msgs, { role: "assistant", content: prompt }];
      }
      return msgs;
    });
    if (next === Step.GREET) {
      const nextQ = nextStep(next);
      if (nextQ) setTimeout(() => transition(nextQ, currentAnswers), 0);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "aurora_chat_v1",
        JSON.stringify({ messages, step, answers })
      );
    }
  }, [messages, step, answers]);

  useEffect(() => {
    if (step === Step.START) {
      const next = nextStep(Step.START);
      if (next) transition(next);
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    const questionIndex = QUESTION_STEPS.indexOf(step);
    const error =
      questionIndex > -1 ? validateAnswer(userMsg.content, questionIndex) : null;

    const baseMessages: ChatMsg[] = [
      {
        role: "system",
        content:
          "You are a friendly onboarding assistant. Keep replies short and encouraging.",
      },
      ...newMessages,
    ];

    if (error) {
      baseMessages.push({
        role: "system",
        content: `The user's last answer failed validation: ${error} Ask them to clarify or provide more detail.`,
      });
    }

    const { data } = await supabase.functions.invoke("aurora-chat", {
      body: { messages: baseMessages },
    });
    if (data?.content) {
      setMessages((m) => [...m, { role: "assistant", content: data.content }]);
    }
    if (error) return;

    let updatedAnswers = answers;
    if (questionIndex > -1) {
      if (user) {
        await supabase.from("onboarding_answers").insert({
          user_id: user.id,
          question: PROMPTS[step],
          answer: userMsg.content,
        });
      }
      updatedAnswers = [...answers];
      updatedAnswers[questionIndex] = userMsg.content;
      setAnswers(updatedAnswers);
    }

    const next = nextStep(step);
    if (next) transition(next, updatedAnswers);
  };

  const handleFinish = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.functions.invoke("generate-plan", { body: { answers } });
    }
    navigate("/app/plan", { replace: true });
  };

  const progress = (answers.length / total) * 100;
  const shouldShowForm =
    step !== Step.SHOW_VISION && step !== Step.START && step !== Step.GREET;

  return (
    <div className="relative h-svh w-screen">
      <div className="os-bg" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="p-4">
          <Progress value={progress} />
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 text-sm">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <Avatar className="mr-2 h-8 w-8">
                    <AvatarFallback>A</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
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
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 border-t bg-background p-4"
          >
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
        {step === Step.SHOW_VISION && (
          <div className="border-t bg-background p-4">
            <VisionCard answers={answers} />
            <Button className="mt-4 w-full" onClick={handleFinish}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

