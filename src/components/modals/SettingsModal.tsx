// @ts-ignore
import QuickSettingsPanel from "../../../frontend/components/QuickSettingsPanel.jsx";
import { useUIStore } from "@/state/ui";

export default function SettingsModal() {
  const closeModal = useUIStore((s) => s.closeModal);
  return <QuickSettingsPanel open onClose={closeModal} />;
}

