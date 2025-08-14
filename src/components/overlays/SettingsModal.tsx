import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuickActionModals } from "@/state/quickActions";
// @ts-ignore
import SettingsPanel from "../../../frontend/components/SettingsPanel.jsx";

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen } = useQuickActionModals();

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="p-0 sm:max-w-lg">
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

