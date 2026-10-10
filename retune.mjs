import { readFile, writeFile } from "node:fs/promises";
const p = "src/index.css";
let t = await readFile(p, "utf8");
// the element is one line tall, so a percentage of itself is far too small to read
t = t.split("translateY(110%)").join("translateY(1.6em)");
t = t.split("translateY(-110%)").join("translateY(-1.6em)");
t = t.split("translateY(1.6em);\n    opacity: 0;").join("translateY(1.6em);\n    opacity: 0;");
t = t.replace(
` * The travel is a full line height. A percentage translate is measured against the
 * element's own height, and this element is one line tall, so half of it is about
 * six pixels -- far too small to read as movement. A little over 100% is a full
 * line, which is what makes the direction legible at a glance.`,
` * The travel is 1.6em, and the units matter. A percentage translate is measured
 * against the element's own height, and this element is one line tall, so even
 * 110% of it came out at about fifteen pixels -- measured on screen, and it read as
 * nothing at all. A line and a half in em moves far enough that the direction is
 * legible at a glance.`);
await writeFile(p, t, "utf8");
console.log("keyframes retuned to em");
