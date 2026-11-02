import { DARK_QUERY, DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/theme";

/** Inline script for <head>: applies the stored theme before the page paints. */
export function ThemeScript() {
  const code = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(p!=="light"&&p!=="dark"&&p!=="system")p=${JSON.stringify(DEFAULT_THEME)};var d=p==="dark"||(p==="system"&&matchMedia(${JSON.stringify(DARK_QUERY)}).matches);var r=document.documentElement;if(d)r.classList.add("dark");r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
