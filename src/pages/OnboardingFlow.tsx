import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Chat-based onboarding flow that gathers key info about the user
// including their goals, values, skills, habits, and challenges.

type Msg = { role: "assistant" | "user"; content: string };
type ChatMsg = Msg | { role: "system"; content: string };

const QUESTIONS = [
  "What are your main goals right now?",
  "What personal values matter most to you?",
  "What key skills do you want to develop?",
  "What habits would help you grow?",
  "What challenges are you facing?",
];

const MIN_LENGTH = 10;
const REQUIRED_KEYWORDS = ["goal", "value", "skill", "habit", "challenge"];

function validateAnswer(answer: string, step: number): string | null {
  if (answer.length < MIN_LENGTH)
    return `Please provide at least ${MIN_LENGTH} characters.`;
  const keyword = REQUIRED_KEYWORDS[step];
  if (keyword && !answer.toLowerCase().includes(keyword)) {
    return `Please mention the word "${keyword}" in your response.`;
  }
  return null;
}

export default function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const total = QUESTIONS.length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ask next question
  useEffect(() => {
    if (step < total) {
      setMessages((m) => [...m, { role: "assistant", content: QUESTIONS[step] }]);
    } else if (step === total && user) {
      const finalize = async () => {
        await supabase
          .from("profiles")
          .update({ onboarded_at: new Date().toISOString() })
          .eq("id", user.id);
        await supabase.functions.invoke("generate-plan", { body: { answers } });
        navigate("/app/plan", { replace: true });
      };
      finalize();
    }
  }, [step, total, user, navigate, answers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

    const error = validateAnswer(userMsg.content, step);

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

    if (user) {
      await supabase.from("onboarding_answers").insert({
        user_id: user.id,
        question: QUESTIONS[step],
        answer: userMsg.content,
      });
    }

    setAnswers((a) => [...a, userMsg.content]);
    setStep((s) => s + 1);
  };

  const progress = (step / total) * 100;

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
        {step < total && (
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
      </div>
    </div>
  );
}

