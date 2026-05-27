import fs from 'fs';

const summary = fs.readFileSync('./docs/SUMMARY.md', 'utf8');

const lines = summary.split('\n');

const items = [];
let currentCategory = null;

for (const line of lines) {
  // Category
  const categoryMatch = line.match(/^##\s+(.*)/);

  if (categoryMatch) {
    currentCategory = {
      type: 'category',
      label: categoryMatch[1],
      items: [],
      // collapsible: false,
      collapsed: false,
    };

    items.push(currentCategory);
    continue;
  }

  // Markdown link
  const linkMatch = line.match(/\* \[(.*?)\]\((.*?)\)/);

  if (linkMatch && currentCategory) {
    const path = linkMatch[2]
      .replace(/\.md$/, '');
      // .replace(/README$/, 'index');

    currentCategory.items.push(path);
  }
}


function clean(items) {
  return items
    .map(itm => {
      if (itm.type === 'category') {
        const cleaned = {
          ...itm,
          items: clean(itm.items || []),
        };
        return cleaned;
      }
      return itm;
    })
    .filter(itm => {
      if (itm.type !== 'category') return true;
      return itm.items.length > 0;
    });
}

const cleanedItems = clean(items);

// items.filter(itm => itm.items.length > 0)

const sidebar = `
const sidebars = {
  tutorialSidebar: ${JSON.stringify(cleanedItems, null, 2)}
};

export default sidebars;
`;

fs.writeFileSync('./sidebars.ts', sidebar);

console.log('Generated sidebars.ts');