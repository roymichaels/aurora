export default function ConfirmSheet({ msg, onYes, onNo }: { msg: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="sheet">
      <div className="sheet__title">Confirm</div>
      <p className="opacity-80">{msg}</p>
      <div className="flex gap-2 justify-end pt-3">
        <button className="btn ghost" onClick={onNo}>Cancel</button>
        <button className="btn primary" onClick={onYes}>Yes</button>
      </div>
    </div>
  );
}
