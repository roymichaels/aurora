import { Button } from '@/components/ui/button';
import { useFocusTimer, formatTime } from '@/state/focusTimer';
import { TimerRing } from './TimerRing';

export function FocusTimer() {
  const { remaining, progress, running, start, pause, resume, mode, toggleMode } = useFocusTimer();

  const handleStart = () => start();
  const handlePauseResume = () => {
    if (running) pause();
    else resume();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <TimerRing percent={progress} time={formatTime(remaining)} />
      <div className="flex items-center gap-2">
        {!running && remaining === 25 * 60 * 1000 && (
          <Button onClick={handleStart}>Start</Button>
        )}
        {remaining < 25 * 60 * 1000 && (
          <Button onClick={handlePauseResume}>{running ? 'Pause' : 'Resume'}</Button>
        )}
        <Button variant="ghost" onClick={toggleMode}>
          {mode === 'pomodoro' ? 'Pomodoro' : 'Free'}
        </Button>
      </div>
    </div>
  );
}
