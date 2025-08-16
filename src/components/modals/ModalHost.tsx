import BrainView from "@/views/BrainView";
import JournalView from "@/views/JournalView";
import LiveFocusView from "@/components/live/LiveFocusView";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";
import { useUIStore } from "@/state/ui";
import type { ReactNode } from "react";
import AnalyticsModal from "@/components/modals/AnalyticsModal";
import GoalsModal from "@/components/modals/GoalsModal";
import SettingsModal from "@/components/modals/SettingsModal";
import TasksModal from "@/components/modals/TasksModal";

export default function ModalHost() {
  const { activeModal, closeModal } = useUIStore();
  const focusChatInput = useChatInputFocus();

  const handleClose = () => {
    closeModal();
    focusChatInput();
  };

  let content: ReactNode = null;
  let className: string | undefined;
  switch (activeModal) {
    case "brain":
      content = <BrainView />;
      break;
    case "journal":
      content = <JournalView />;
      break;
    case "live":
      content = <LiveFocusView />;
      break;
    case "analytics":
      content = <AnalyticsModal />;
      className = "sm:max-w-md";
      break;
    case "tasks":
      content = <TasksModal />;
      className = "sm:max-w-lg";
      break;
    case "goals":
      content = <GoalsModal />;
      className = "sm:max-w-md";
      break;
    case "settings":
      content = <SettingsModal />;
      className = "p-0 sm:max-w-lg";
      break;
    case "more":
      content = <div>More</div>;
      break;
    default:
      content = null;
  }

  return (
    <Dialog
      open={!!activeModal}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className={className} onEscapeKeyDown={handleClose}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
