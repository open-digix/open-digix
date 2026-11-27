import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");

// 1. Gather all CSS files and collect declared CSS variables and selectors
const cssFiles = [
  path.join(webRoot, "app", "globals.css"),
  path.join(webRoot, "app", "(workspace)", "workspace.css"),
  path.join(webRoot, "app", "register", "register.css"),
  path.join(webRoot, "app", "landing.css"),
];

const declaredVars = new Set();
const declaredClasses = new Set();

for (const f of cssFiles) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, "utf8");

  // Collect declared variables: e.g. --ws-xxx:
  const varMatches = content.matchAll(/(--ws-[\w-]+)\s*:/g);
  for (const m of varMatches) {
    declaredVars.add(m[1]);
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

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

// If no errors, output must be empty
process.exit(0);
