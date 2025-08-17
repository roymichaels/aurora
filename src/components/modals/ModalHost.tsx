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
import InventoryModal from "@/components/modals/InventoryModal";
import MapModal from "@/components/modals/MapModal";
import ControlsModal from "@/components/modals/ControlsModal";

export default function ModalHost() {
  const { activeModal, closeModal } = useUIStore();
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
    case "notes":
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
    case "inventory":
      content = <InventoryModal />;
      className = "sm:max-w-md";
      break;
    case "map":
      content = <MapModal />;
      className = "sm:max-w-md";
      break;
    case "controls":
      content = <ControlsModal />;
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
      <DialogContent className={className} onEscapeKeyDown={handleClose}>
        {content}
      </DialogContent>
    </Dialog>
  );
}
