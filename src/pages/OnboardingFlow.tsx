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

type Msg = { role: "assistant" | "user"; content: string };

enum Step {
  START,
  GREET,
  ASK_MAIN_GOAL,
  CLARIFY_GOAL,
  CONFIRM_SUMMARY,
  VISION_CARD,
  END,
}

export default function OnboardingFlow() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  // ----- restore minimal persisted state -----
  const getInitial = () => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(
        localStorage.getItem("aurora_chat_v1") ?? "{}"
      ) as {
        messages?: Msg[];
        step?: Step;
        mainGoal?: string;
        goalDetail?: string;
      };
    } catch {
      return {};
    }
  };

  const initial = getInitial();

  const [messages, setMessages] = useState<Msg[]>(initial.messages ?? []);
  const [step, setStep] = useState<Step>(initial.step ?? Step.START);
  const [mainGoal, setMainGoal] = useState<string>(initial.mainGoal ?? "");
  const [goalDetail, setGoalDetail] = useState<string>(initial.goalDetail ?? "");
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // progress by linear steps (exclusive of END)
  const TOTAL_STEPS = Step.VISION_CARD; // 0..5 -> 5 is last "content" step
  const progressPercent = Math.min((step / TOTAL_STEPS) * 100, 100);

  // ----- helpers -----
  const sendPrompt = (prompt: string) => {
    setMessages((msgs) => {
      // guard against accidental duplicates
      if (msgs.some((m) => m.role === "assistant" && m.content === prompt)) return msgs;
      return [...msgs, { role: "assistant", content: prompt }];
    });
  };

  const start = () => {
    sendPrompt("Hi, I'm Aurora. Let's get to know you a bit better.");
    setStep(Step.GREET);
  };

  const askMainGoal = () => {
    sendPrompt("What are your main goals right now?");
    setStep(Step.ASK_MAIN_GOAL);
  };

  const handleMainGoal = async (answer: string) => {
    setMainGoal(answer);
    if (user) {
      await supabase.from("onboarding_answers").insert({
        user_id: user.id,
        question: "What are your main goals right now?",
        answer,
      });
    }
    sendPrompt("If you achieved your main goal, how would your life change?");
    setStep(Step.CLARIFY_GOAL);
  };

  const handleGoalDetail = async (answer: string) => {
    setGoalDetail(answer);
    if (user) {
      await supabase.from("onboarding_answers").insert({
        user_id: user.id,
        question: "If you achieved your main goal, how would your life change?",
        answer,
      });
    }
    sendPrompt(
      `Here's what I heard:\n- goal: ${mainGoal}\n- change: ${answer}\nDoes this look right?`
    );
    setStep(Step.CONFIRM_SUMMARY);
  };

  const handleSummaryConfirmation = (answer: string) => {
    const yes = answer.trim().toLowerCase().startsWith("yes");
    if (yes) {
      setStep(Step.VISION_CARD);
    } else {
      // allow correction path
      sendPrompt("No problem. Tell me your main goal again and we'll adjust it.");
      setStep(Step.ASK_MAIN_GOAL);
    }
  };

  // ----- effects -----
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // persist minimal onboarding state
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "aurora_chat_v1",
      JSON.stringify({ messages, step, mainGoal, goalDetail })
    );
  }, [messages, step, mainGoal, goalDetail]);

  // persist numeric percent (used elsewhere)
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("onboarding_progress_percent", String(Math.floor(progressPercent)));
  }, [progressPercent]);

  // kick the machine
  useEffect(() => {
    if (step === Step.START && messages.length === 0) start();
    else if (step === Step.GREET) askMainGoal();
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ----- submit -----
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const answer = input.trim();
    if (!answer) return;

    // user message
    setMessages((m) => [...m, { role: "user", content: answer }]);
    setInput("");

    // short, encouraging assistant nudge (no duplicates)
    try {
      const baseMessages = [
        { role: "system", content: "You are a friendly onboarding assistant. Keep replies short and encouraging." },
        ...messages,
        { role: "user", content: answer },
      ];
      const { data } = await supabase.functions.invoke("aurora-chat", {
        body: { messages: baseMessages },
      });
      if (data?.content) {
        setMessages((m) => [...m, { role: "assistant", content: data.content }]);
      }
    } catch {
      // fail silently; not critical for flow
    }

    // advance state
    if (step === Step.ASK_MAIN_GOAL) {
      await handleMainGoal(answer);
    } else if (step === Step.CLARIFY_GOAL) {
      await handleGoalDetail(answer);
    } else if (step === Step.CONFIRM_SUMMARY) {
      handleSummaryConfirmation(answer);
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarded_at: new Date().toISOString() })
        .eq("id", user.id);
      await supabase.functions.invoke("generate-plan", {
        body: { answers: [mainGoal, goalDetail] },
      });
    }
    setStep(Step.END);
    navigate("/app/plan", { replace: true });
  };

  const shouldShowForm =
    step !== Step.START &&
    step !== Step.GREET &&
    step !== Step.VISION_CARD &&
    step !== Step.END;

  // ----- UI -----
  return (
    <div className="relative h-svh w-screen">
      <div className="os-bg" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="p-4">
          <div className="relative">
            <Progress value={progressPercent} />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="text-xs text-secondary-foreground">
                {Math.floor(progressPercent)}%
              </span>
            </div>
          </div>
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t bg-background p-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Your answer..."
              className="resize-none"
            />
            <Button type="submit" className="self-end">Continue</Button>
          </form>
        )}

        {step === Step.VISION_CARD && (
          <div className="border-t bg-background p-4">
            <VisionCard answers={[mainGoal, goalDetail]} onClose={handleFinish} />
          </div>
        )}
      </div>
    </div>
  );
}