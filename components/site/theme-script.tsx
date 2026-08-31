/**
 * Inline theme bootstrap — MUST run before first paint (no FOUC).
 * Reads the stored preference (light/dark/system) and toggles .dark on <html>.
 * Rendered inside <head> by the root layout.
 */
export function ThemeScript() {
  const code = `(function(){try{var m=localStorage.getItem('medivyx:theme')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
