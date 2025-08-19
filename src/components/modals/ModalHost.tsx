import BrainView from "@/views/BrainView";
import JournalView from "@/views/JournalView";
import LiveFocusView from "@/components/live/LiveFocusView";
import FocusView from "@/views/FocusView";
import HypnoPanel from "@/components/hypno/HypnoPanel";
import VoiceView from "@/views/VoiceView";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useChatInputFocus } from "@/hooks/useChatInputFocus";
import { useUIStore } from "@/state/ui";
import { useEffect, type ReactNode } from "react";
import AnalyticsModal from "@/components/modals/AnalyticsModal";
import GoalsModal from "@/components/modals/GoalsModal";
import SettingsModal from "@/components/modals/SettingsModal";
import TasksModal from "@/components/modals/TasksModal";
import { AuroraSphere } from "@/components/avatar/AuroraSphere";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import OnboardingSheet from "@/components/modals/OnboardingSheet";
import ConfirmSheet from "@/components/modals/ConfirmSheet";

export default function ModalHost() {
  const { activeModal, closeModal, modalArgs } = useUIStore();
  const focusChatInput = useChatInputFocus();

  useEffect(() => {
    if (activeModal === "hypno") {
      window.dispatchEvent(new Event("open-hypno-panel"));
    }
  }, [activeModal]);

  const handleClose = () => {
    closeModal();
    focusChatInput();
  };

  if (activeModal === "sphereFull") {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <div onClick={(e) => e.stopPropagation()}>
          <AuroraSphere variant="full" interactive />
        </div>
      </div>
    );
  }

  let content: ReactNode = null;
  let className: string | undefined;
  switch (activeModal) {
    case "brain":
      content = <BrainView />;
      break;
    case "focus":
      content = <FocusView />;
      break;
    case "hypno":
      content = <HypnoPanel onClose={closeModal} />;
      break;
    case "journal":
      content = <JournalView />;
      break;
    case "voice":
      content = <VoiceView />;
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
      content = (
        <>
          <DialogHeader>
            <DialogTitle>More</DialogTitle>
            <DialogDescription>Additional options</DialogDescription>
          </DialogHeader>
          <div>More</div>
        </>
      );
      className = "sm:max-w-md";
      break;
    case "onboarding":
      content = <OnboardingSheet {...(modalArgs || {})} onClose={handleClose} />;
      className = "sm:max-w-md";
      break;
    case "confirm":
      content = <ConfirmSheet {...(modalArgs || {})} />;
      className = "sm:max-w-md";
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
      {activeModal && (
        <DialogContent className={className} onEscapeKeyDown={handleClose}>
          <DialogHeader className="sr-only">
            <DialogTitle>Modal</DialogTitle>
            <DialogDescription>Modal content</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      )}
    </Dialog>
  );
}
