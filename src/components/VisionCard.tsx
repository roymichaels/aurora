import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface VisionCardProps {
  answers: string[];
}

export default function VisionCard({ answers }: VisionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Vision</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {answers.map((answer, i) => (
            <li key={i}>{answer}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

