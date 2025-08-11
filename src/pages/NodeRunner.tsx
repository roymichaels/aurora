import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getNodeById } from "@/data/roadmap";
import HypnosisRunner from "@/nodes/HypnosisRunner";
import FocusRunner from "@/nodes/FocusRunner";
import BrowserRunner from "@/nodes/BrowserRunner";
import CoachRunner from "@/nodes/CoachRunner";
import NoteRunner from "@/nodes/NoteRunner";
import RewardRunner from "@/nodes/RewardRunner";

export default function NodeRunner() {
  const { id } = useParams();
  const nav = useNavigate();
  const node = id ? getNodeById(id) : null;

  useMemo(() => {
    document.title = node ? `${node.label} – Aurora` : "Node – Aurora";
  }, [node]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") nav(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nav]);

  if (!node) return <div className="p-6">Node not found.</div>;

  const common = { node, onExit: () => nav(-1) } as const;

  switch (node.type) {
    case "hypnosis":
      return <HypnosisRunner {...common} />;
    case "focus":
      return <FocusRunner {...common} />;
    case "browser":
      return <BrowserRunner {...common} />;
    case "coach":
      return <CoachRunner {...common} />;
    case "note":
      return <NoteRunner {...common} />;
    case "reward":
      return <RewardRunner {...common} />;
    default:
      return <div className="p-6">Unsupported node.</div>;
  }
}
