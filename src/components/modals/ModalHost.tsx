import BrainView from "@/views/BrainView";
import JournalView from "@/views/JournalView";
import LiveFocusView from "@/components/live/LiveFocusView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";
import { useUIStore } from "@/state/ui";
import { useProgressStore } from "@/state/progress";
import type { ReactNode } from "react";

function AnalyticsContent() {
  const { xp, level, streak, notes } = useProgressStore();
  return (
    <>
      <DialogHeader>
        <DialogTitle>Analytics</DialogTitle>
      </DialogHeader>
      <div className="space-y-2 text-sm">
        <div>XP: {xp}</div>
        <div>Level: {level}</div>
        <div>Streak: {streak}</div>
        <div>Notes recorded: {notes.length}</div>
      </div>
    </>
  );
}

export default function ModalHost() {
  const { activeModal, closeModal } = useUIStore();
  const focusChatInput = useChatInputFocus();

  const handleClose = () => {
    closeModal();
    focusChatInput();
  };

  let content: ReactNode = null;
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
      content = <AnalyticsContent />;
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
      modal={false}
    >
      <DialogContent onEscapeKeyDown={handleClose}>{content}</DialogContent>
    </Dialog>
  );
}
