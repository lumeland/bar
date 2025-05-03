import dom from "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.1.5/dom.js";
export { dom };

const cache = new Map();

export async function icon(name) {
  const variant = name.endsWith("-fill") ? "fill" : "regular";
  const url =
    `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/${variant}/${name}.svg`;

  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);

  if (response.ok) {
    const text = await response.text();
    cache.set(url, text);
    return text;
  }
  console.error(`Icon not found: ${name}`);
}

export async function icons(...names) {
  return await Promise.all(names.map(icon));
}
