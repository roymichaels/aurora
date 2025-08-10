import { useEffect } from "react";

export default function ExtensionPage() {
  useEffect(() => {
    document.title = "Aurora Companion Extension – Setup";
  }, []);
  return (
    <div className="relative min-h-svh p-4 md:p-6">
      <div className="os-bg" />
      <section className="glass-panel rounded-2xl p-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Aurora Companion Extension</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Overlay the Aurora HUD on any website in Chrome or Brave. This is required for sites that block embedding inside the app.
        </p>
        <ol className="mt-4 list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>Download the extension (coming soon).</li>
          <li>Open chrome://extensions and enable Developer Mode.</li>
          <li>Click “Load unpacked” and select the extension folder.</li>
          <li>Visit any site and press Alt+Space to toggle the HUD.</li>
        </ol>
        <div className="mt-4 text-sm text-muted-foreground">
          For now, you can still use the web app’s embed mode for sites that allow iframes.
        </div>
      </section>
    </div>
  );
}
