import LessonPath from "./LessonPath";



export default function GameHome({
  onNodeClick,
  onNavSelect,
}: {
  onNodeClick?: (node: import("./path.data").PathNode) => void;
  onNavSelect?: (key: 'home' | 'map' | 'live' | 'rank' | 'aurora') => void;
}) {
  return (
    <div className="relative min-h-svh text-white overflow-hidden">
      <div className="os-bg bg-[hsl(var(--path-bg))]" />
      <LessonPath onNodeClick={onNodeClick} />
    </div>
  );
}
