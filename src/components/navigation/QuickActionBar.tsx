import { useState } from 'react';
import { CheckSquare, Target, BarChart2, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BasicModal({ title, open, onOpenChange }: ModalProps & { title: string }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-sm text-muted-foreground">
          Content coming soon.
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TasksModal = (props: ModalProps) => <BasicModal title="Tasks" {...props} />;
const GoalsModal = (props: ModalProps) => <BasicModal title="Goals" {...props} />;
const AnalyticsModal = (props: ModalProps) => <BasicModal title="Analytics" {...props} />;
const SettingsModal = (props: ModalProps) => <BasicModal title="Settings" {...props} />;

type Action = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  modal: React.ComponentType<ModalProps>;
};

const actions: Action[] = [
  { id: 'tasks', icon: CheckSquare, label: 'Tasks', modal: TasksModal },
  { id: 'goals', icon: Target, label: 'Goals', modal: GoalsModal },
  { id: 'analytics', icon: BarChart2, label: 'Analytics', modal: AnalyticsModal },
  { id: 'settings', icon: Settings, label: 'Settings', modal: SettingsModal },
];

export default function QuickActionBar() {
  const [active, setActive] = useState<string | null>(null);
  const ActiveModal = active ? actions.find((a) => a.id === active)?.modal : null;

  return (
    <>
      {ActiveModal && (
        <ActiveModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setActive(null);
          }}
        />
      )}
      <div
        className="pointer-events-auto fixed inset-x-0 z-[var(--z-hud)]"
        style={{
          bottom:
            'calc(var(--hud-h) + var(--dock-h) + var(--hud-gap) + var(--chatbar-h) + var(--kb-offset) + env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-full flex justify-center pb-safe">
          <div className="hud-shell max-w-[1200px] w-[96%]">
            <div className="glass-panel rounded-2xl p-2 flex items-center gap-2 justify-center">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setActive(action.id)}
                    aria-label={action.label}
                    className="hud-icon hover-scale smooth hover:brightness-110 active:scale-95 grid place-items-center"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

