import { X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface VisionCardProps {
  answers: string[];
  onClose: () => void;
}

const LABELS = ["Main Goal", "Values", "Skills", "Habits", "Challenges"];

export default function VisionCard({ answers, onClose }: VisionCardProps) {
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="relative">
        <CardTitle>Your Vision</CardTitle>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {answers.map((answer, i) => (
          <div key={i} className="rounded-md bg-muted p-3">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {LABELS[i] || `Item ${i + 1}`}
            </p>
            <p className="text-sm text-foreground">{answer}</p>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onClose}>Start My Plan</Button>
      </CardFooter>
    </Card>
  );
}

