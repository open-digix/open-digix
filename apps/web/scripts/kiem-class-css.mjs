import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

// 1. Gather all CSS files and collect declared CSS variables, dark variables, and selectors
const cssFiles = [
  path.join(webRoot, "app", "globals.css"),
  path.join(webRoot, "app", "(workspace)", "workspace.css"),
  path.join(webRoot, "app", "register", "register.css"),
  path.join(webRoot, "app", "landing.css"),
];

const declaredVars = new Set();
const declaredDarkVars = new Set();
const declaredClasses = new Set();

for (const f of cssFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, "utf8");

  // Collect declared variables: e.g. --ws-xxx:
  const varMatches = content.matchAll(/(--ws-[\w-]+)\s*:/g);
  for (const m of varMatches) {
    declaredVars.add(m[1]);
  }

  // Collect dark variables from data-theme="dark" blocks
  if (f.endsWith("globals.css")) {
    const darkBlockMatch = content.match(/\[data-theme=["']dark["']\][\s\S]*?\{([\s\S]*?)\n\}/);
    if (darkBlockMatch) {
      for (const m of darkBlockMatch[1].matchAll(/(--ws-[\w-]+)\s*:/g)) {
        declaredDarkVars.add(m[1]);
      }
    }
  } else if (f.endsWith("workspace.css")) {
    for (const match of content.matchAll(/\[data-theme=["']dark["']\][\s\S]*?\{([\s\S]*?)\}/g)) {
      for (const m of match[1].matchAll(/(--ws-[\w-]+)\s*:/g)) {
        declaredDarkVars.add(m[1]);
      }
    }
  }

  // Collect classes: e.g. .my-class
  const classMatches = content.matchAll(/\.([a-zA-Z0-9_-]+)/g);
  for (const m of classMatches) {
    declaredClasses.add(m[1]);
  }
}

// 2. Scan TSX/CSS files for var(--ws-*) usage
function walk(dir, extFilter) {
  const results = [];
  for (const item of fs.readdirSync(dir)) {
    if (item === "node_modules" || item === ".next" || item === ".git") continue;
    const p = path.join(dir, item);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      results.push(...walk(p, extFilter));
    } else if (extFilter.some((ext) => item.endsWith(ext))) {
      results.push(p);
    }
  }
  return results;
}

const errors = [];

const allSourceFiles = walk(webRoot, [".tsx", ".ts", ".css"]);
for (const file of allSourceFiles) {
  if (file.includes(".spec.") || file.includes(".test.")) continue;
  const content = fs.readFileSync(file, "utf8");
  const varUsages = content.matchAll(/var\((--ws-[\w-]+)/g);
  for (const m of varUsages) {
    const varName = m[1];
    if (!declaredVars.has(varName)) {
      errors.push(`[Undeclared CSS Var] ${varName} in ${path.relative(webRoot, file)}`);
    } else if (!declaredDarkVars.has(varName)) {
      errors.push(`[Missing Dark CSS Var] ${varName} has no definition in dark theme (used in ${path.relative(webRoot, file)})`);
    }
  }
}

// 3. Scan TSX files for classNames
const tsxFiles = walk(webRoot, [".tsx"]);
// Allowed exceptions that are standard / utilities or handled elsewhere
const allowedClassExceptions = new Set([
  "sr-only",
  "link",
  "text-link",
  "button-link",
  "button",
  "primary",
  "secondary",
  "danger",
  "warning",
  "success",
  "panel",
  "page",
  "input",
  "field",
  "card",
  "active",
  "complete",
  "open",
  "selected",
  "drawer-open",
  "draft",
  "published",
  "on",
  "done",
  "pinned",
  "peek",
  "mini",
  "spin",
  "brand",
  "lbl",
  "st",
  "bar",
  "root",
  "sep",
  "lead",
  "title",
  "foot",
  "pane",
  "side",
  "main",
  "tabs",
  "tab",
  "badge",
  "js-pin",
  "app-runtime-main",
  // Tailwind utility classes allowed in layout & status
  "h-full",
  "antialiased",
  "min-h-full",
  "flex",
  "flex-col",
  "mx-auto",
  "min-h-screen",
  "max-w-2xl",
  "justify-center",
  "gap-6",
  "p-8",
  "text-4xl",
  "font-semibold",
]);

for (const file of tsxFiles) {
  if (file.includes(".spec.") || file.includes(".test.")) continue;
  const content = fs.readFileSync(file, "utf8");

  // Simple regex for string literals in className="..." or className={`...`}
  const classAttrMatches = content.matchAll(/className=(?:["']([^"']+)["']|\{`([^`]+)`\})/g);
  for (const m of classAttrMatches) {
    const raw = m[1] || m[2] || "";
    // Remove expressions like ${...}
    const clean = raw.replace(/\$\{[^}]+\}/g, " ");
    const tokens = clean.split(/\s+/).map((t) => t.trim()).filter(Boolean);
    for (const t of tokens) {
      if (!t || allowedClassExceptions.has(t)) continue;
      // Skip digits, dynamic operators
      if (/^[^a-zA-Z]/.test(t) || t.includes("?") || t.includes(":") || t.includes("(")) continue;
      if (!declaredClasses.has(t)) {
        errors.push(`[Missing CSS Class] .${t} in ${path.relative(webRoot, file)}`);
      }
    }
  }
}

// 4. Check for self-referencing and circular variables in CSS rule blocks
for (const f of cssFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, "utf8");
  const relPath = path.relative(webRoot, f);

  // Match all rule blocks: selector { declarations }
  const blockRegex = /\{([^}]+)\}/g;
  let match;
  while ((match = blockRegex.exec(content)) !== null) {
    const blockBody = match[1];
    const decls = blockBody.split(";");
    for (const d of decls) {
      const varMatch = d.match(/^\s*(--[\w-]+)\s*:\s*(.+)$/);
      if (varMatch) {
        const [, varName, val] = varMatch;
        // Check if val references varName itself: var(--varName...)
        const isSelfRef =
          val.includes(`var(${varName})`) ||
          val.includes(`var(${varName},`) ||
          val.includes(`var(${varName} `) ||
          val.includes(`var(${varName}\t`);
        if (isSelfRef) {
          errors.push(`[Self-referencing CSS Var] ${varName} in ${relPath} references itself in declaration: "${d.trim()}"`);
        }
      }
    }
  }
}

// 5. Check if .ws-root re-declares variables defined in globals.css theme block
const globalsCssPath = path.join(webRoot, "app", "globals.css");
const workspaceCssPath = path.join(webRoot, "app", "(workspace)", "workspace.css");

if (fs.existsSync(globalsCssPath) && fs.existsSync(workspaceCssPath)) {
  const globalsContent = fs.readFileSync(globalsCssPath, "utf8");
  const workspaceContent = fs.readFileSync(workspaceCssPath, "utf8");

  // Collect theme tokens declared in globals.css (:root blocks)
  const globalsThemeVars = new Set();
  const themeBlockMatches = globalsContent.matchAll(/(?::root|\[data-theme=[\w"']+\])[\s\S]*?\{([\s\S]*?)\}/g);
  for (const block of themeBlockMatches) {
    for (const m of block[1].matchAll(/(--ws-[\w-]+)\s*:/g)) {
      globalsThemeVars.add(m[1]);
    }
  }

  // Find first .ws-root { ... } block in workspace.css
  const wsRootMatch = workspaceContent.match(/\.ws-root\s*\{([\s\S]*?)\}/);
  if (wsRootMatch) {
    for (const m of wsRootMatch[1].matchAll(/(--ws-[\w-]+)\s*:/g)) {
      const v = m[1];
      if (globalsThemeVars.has(v)) {
        errors.push(`[.ws-root Shadowing Theme Var] ${v} in workspace.css re-declares variable defined in globals.css`);
      }
    }
  }
}

// 6. Check for forbidden emojis, decorative symbols, and untranslated raw strings in UI code
const forbiddenSymbolRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]|[\u2713\u2714\u2715\u2716\u2726\u2197]/u;
const uiSourceDirs = [
  path.join(webRoot, "app"),
  path.join(webRoot, "components"),
  path.join(webRoot, "lib"),
];

for (const dir of uiSourceDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = walk(dir, [".tsx", ".css"]);
  for (const file of files) {
    if (file.includes(".test.") || file.includes(".spec.")) continue;
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip comment lines
      if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;

      if (forbiddenSymbolRegex.test(trimmed)) {
        errors.push(`[Forbidden Symbol/Emoji] Line ${idx + 1} in ${path.relative(webRoot, file)}: "${trimmed}"`);
      }

      if (trimmed.includes("Danh sách: ${resource}") || trimmed.includes("Danh sách: ${")) {
        errors.push(`[Untranslated String] Line ${idx + 1} in ${path.relative(webRoot, file)}: "${trimmed}"`);
      }

      if (/backdrop-filter:\s*var\(/i.test(trimmed) || /backdropFilter:\s*["'`]var\(/i.test(trimmed)) {
        errors.push(`[Forbidden backdrop-filter: var()] Line ${idx + 1} in ${path.relative(webRoot, file)}: "${trimmed}"`);
      }
    });
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// If no errors, output must be empty
process.exit(0);
