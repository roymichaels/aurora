import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

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
  const total = QUESTIONS.length;

  // ask next question
  useEffect(() => {
    if (step < total) {
      setMessages((m) => [...m, { role: "assistant", content: QUESTIONS[step] }]);
    } else if (step === total && user) {
      // finished
      supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", user.id)
        .then(() => navigate("/app", { replace: true }));
    }
  }, [step, total, user, navigate]);

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

    setAnswers((a) => [...a, userMsg.content]);
    setStep((s) => s + 1);
  };

  const progress = (step / total) * 100;

  return (
    <div className="relative min-h-svh w-screen grid place-items-center p-4">
      <div className="os-bg" />
      <Card className="w-full max-w-md p-6 space-y-4">
        <Progress value={progress} />
        <div className="space-y-3 text-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "assistant" ? "text-muted-foreground" : "text-right"}
            >
              {m.content}
            </div>
          ))}
        </div>
        {step < total && (
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer..."
            />
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

