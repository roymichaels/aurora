import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlannerAgent } from '../PlannerAgent';

interface QuickStartButtonsProps {
  planner?: PlannerAgent;
}

export default function QuickStartButtons({ planner = new PlannerAgent() }: QuickStartButtonsProps) {
  const [tasks, setTasks] = useState<string[]>([]);

  const handleDailyPlan = () => {
    const steps = planner.plan('my day');
    setTasks(steps);
  };

  const handleGoalBreakdown = () => {
    const steps = planner.plan('my goal');
    setTasks(steps);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Button onClick={handleDailyPlan}>Daily Plan</Button>
        <Button onClick={handleGoalBreakdown}>Goal Breakdown</Button>
      </div>
      {tasks.length > 0 && (
        <ol className="list-decimal ml-4">
          {tasks.map((task, index) => (
            <li key={index}>{task}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
