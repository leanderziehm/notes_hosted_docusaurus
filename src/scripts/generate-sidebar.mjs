import fs from 'fs';

const inputFile = './docs/SUMMARY.md'//'./SUMMARY.md';
const outputFile = './sidebars.ts';

const content = fs.readFileSync(inputFile, 'utf8');

// --- Helpers ---
const cleanPath = (path) =>
  path.replace('.md', '').replace(/^\.\//, '');

const createCategory = (label, depth) => ({
  type: 'category',
  label,
  collapsed: true,//depth === 0 ? false : true,
  items: [],
});

const createDoc = (path) => cleanPath(path);

// --- Parse markdown ---
const lines = content.split('\n');

const root = [];
const stack = [];

let currentTopCategory = null;

for (const line of lines) {
  // Match headings like: ## Programming-Languages
  const headingMatch = line.match(/^##\s+(.*)/);
  if (headingMatch) {
    currentTopCategory = createCategory(headingMatch[1], 0);
    root.push(currentTopCategory);

    stack.length = 0;
    stack.push({ indent: -1, node: currentTopCategory });
    continue;
  }

  // Match list items like:
  // * [Title](path)
  const itemMatch = line.match(/^(\s*)\*\s+\[(.*?)\]\((.*?)\)/);
  if (!itemMatch) continue;

  const indent = itemMatch[1].length;
  const title = itemMatch[2];
  const path = itemMatch[3];

  const isReadme = path.toLowerCase().includes('readme.md');

  let node;

  if (isReadme) {
    // README becomes a category entry itself
    node = createCategory(title, stack.length);
    node.link = {
      type: 'doc',
      id: cleanPath(path),
    };
  } else {
    node = createDoc(path);
  }

  // Find correct parent
  while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
    stack.pop();
  }

  const parent = stack[stack.length - 1]?.node;

  if (parent && parent.items) {
    parent.items.push(node);
  }

  // Only push categories to stack
  if (node.type === 'category') {
    stack.push({ indent, node });
  }
}

// --- Generate output ---
const output = `/**
 * AUTO-GENERATED FILE — DO NOT EDIT
 */

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: ${JSON.stringify(root, null, 2)}
};

export default sidebars;
`;

fs.writeFileSync(outputFile, output);

console.log('Sidebar generated at:', outputFile);
