import dom from "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.1.5/dom.js";

// Cache for icons to avoid fetching them multiple times
const cache = new Map();

// Default colors for different contexts
const colors = new Map([
  ["error", "var(--color-error)"],
  ["warning", "var(--color-warning)"],
  ["success", "var(--color-success)"],
  ["info", "var(--color-info)"],
  ["important", "var(--color-important)"],
]);

/**
 * Class to manage the state of the LumeBar component.
 * It uses localStorage to persist the state across page reloads.
 */
class State {
  key = "lume-bar";

  constructor() {
    const restore = localStorage.getItem(this.key);
    this.state = restore ? JSON.parse(restore) : {};
  }

  set(key, value) {
    this.state[key] = value;
    this.save();
  }

  get(key) {
    return this.state[key];
  }

  remove(key) {
    delete this.state[key];
    this.save();
  }

  clear() {
    this.state = {};
    localStorage.removeItem(this.key);
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.state));
  }
}

/**
 * LumeBar class to create a sidebar component.
 * It fetches data from a JSON file and displays it in a structured format.
 */
export default class LumeBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    const styles = import.meta.resolve("./styles.css");
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${styles}">

      <div class="bar">
        <div class="menu"></div>
        <div class="details"></div>
      </div>
    `;
    this.bar = this.shadowRoot.querySelector(".bar");
    this.menu = this.bar.querySelector(".menu");
    this.details = this.bar.querySelector(".details");
    this.collections = [];
    this.state = new State();
  }

  async connectedCallback() {
    const [iconIn, iconOut] = await Promise.all([
      icon("arrows-in-simple"),
      icon("arrows-out-simple"),
    ]);

    const toggleButton = dom("button", {
      class: "toggle",
      html: iconIn,
      onclick: () => {
        if (this.state.get("closed")) {
          toggleButton.innerHTML = iconIn;
          this.open();
        } else {
          toggleButton.innerHTML = iconOut;
          this.close();
        }
      },
    });

    this.menu.appendChild(toggleButton);

    if (this.state.get("closed")) {
      this.close();
    }
    const src = this.getAttribute("src");
    if (!src) {
      return;
    }

    const response = await fetch(src);
    if (!response.ok) {
      console.error(`Failed to load ${src}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    this.update(data);
  }

  async update(data) {
    this.collections = [];
    this.menu.querySelectorAll(":scope > button:not(.toggle)")
      .forEach((btn) => btn.remove());
    this.details.innerHTML = "";

    if (!data.collections) {
      return;
    }

    for (const collection of data.collections) {
      await this.addCollection(collection);
    }
  }

  close() {
    this.state.set("closed", true);
    this.bar.classList.add("is-closed");
  }

  open() {
    this.state.remove("closed");
    this.bar.classList.remove("is-closed");
  }

  async addCollection(collection) {
    this.collections.push(collection);

    const button = dom("button", {
      data: {
        collection: collection.name,
      },
      html: [
        collection.icon ? await icon(collection.icon) : "",
        collection.name,
        collection.items.length
          ? ` <span class="badge">${collection.items.length}</span>`
          : "",
      ],
    });

    const onclick = async () => {
      const pressed = button.getAttribute("aria-pressed") === "true";

      if (pressed) {
        button.removeAttribute("aria-pressed");
        this.details.innerHTML = "";
        this.state.remove("active_collection");
      } else {
        this.menu.querySelectorAll("button").forEach((btn) =>
          button !== btn && btn.removeAttribute("aria-pressed")
        );
        button.setAttribute("aria-pressed", "true");
        this.details.innerHTML = "";
        dom("ul", {
          class: "collection",
          html: await Promise.all(
            collection.items.map((item) => this.renderItem(collection, item)),
          ),
        }, this.details);
        this.state.set("active_collection", collection.name);
      }
    };

    button.addEventListener("click", () => {
      this.state.remove("open_item");
      onclick();
    });

    this.menu.appendChild(button);

    if (this.state.get("active_collection") === collection.name) {
      await onclick();
      const openItem = this.state.get("open_item");

      if (openItem) {
        const target = this.details.querySelector(`#${openItem}`);

        if (target) {
          let item = target?.closest("details");
          const items = [];

          while (item) {
            items.push(item);
            item = item.parentElement.closest("details");
          }

          items.reverse().forEach((item) => item.open = true);
          target.scrollIntoView();
        }
      }
    }
  }

  async renderItem(collection, item, ids = []) {
    const { contexts } = collection;

    const li = dom("li", {
      class: "item",
      "--color-context": item.context
        ? getColor(contexts?.[item.context]?.background, "var(--color-dim)")
        : undefined,
    });

    ids.push(item.title);

    if (item.text || item.code || item.items?.length) {
      const id = await getId(...ids);
      dom("details", {
        id,
        ontoggle: () => {
          if (id) {
            this.state.set("open_item", id);
          } else {
            this.state.remove("open_item");
          }
        },
        html: [
          dom("summary", {
            class: "item-title",
            html: [
              await renderContext(item, contexts),
              item.title,
              item.items?.length
                ? ` <span class="badge">${item.items.length}</span>`
                : "",
              item.details
                ? dom("span", {
                  class: "item-details",
                  html: item.details,
                })
                : "",
            ],
          }),
          item.text
            ? dom("div", {
              class: "item-text",
              html: item.text,
            })
            : "",
          item.code
            ? dom("pre", {
              class: "item-code",
              html: item.code,
            })
            : "",
          item.items?.length
            ? dom("ul", {
              class: "collection",
              html: await Promise.all(
                item.items.map((item) =>
                  this.renderItem(collection, item, [...ids])
                ),
              ),
            })
            : "",
        ],
      }, li);
    } else {
      dom("p", {
        class: "item-title",
        html: [
          await renderContext(item, contexts),
          item.title,
          item.details
            ? dom("span", {
              class: "item-details",
              html: item.details,
            })
            : "",
        ],
      }, li);
    }

    if (item.actions) {
      const actions = dom("div", {
        class: "item-actions",
        html: await Promise.all(item.actions.map(async (action) =>
          dom("a", {
            class: "item-action",
            html: [
              action.icon ? await icon(action.icon) : "",
              action.text,
            ],
            href: action.href,
            target: action.target,
          })
        )),
      });

      li.appendChild(actions);
    }

    return li;
  }
}

customElements.define("lume-bar", LumeBar);

async function renderContext(item, contexts) {
  if (!item.context) {
    return "";
  }

  const context = contexts?.[item.context];
  if (!context) {
    console.error(`Context not found: ${item.context}`);
    return "";
  }

  const { color, background } = context;

  return dom("span", {
    class: "badge",
    "--background": background
      ? colors.get(background) ?? background
      : "var(--color-dim)",
    "--color": getColor(color, "var(--color-background)"),
    html: [
      context.icon ? await icon(context.icon) : "",
      item.context,
    ],
  });
}

/** Get the color for a specific context or return a default color */
function getColor(color, defaultColor) {
  return color ? colors.get(color) ?? color : defaultColor;
}

/**
 * Fetch the icon from the CDN and cache it.
 * If the icon is already in the cache, return it directly.
 */
async function icon(name) {
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

/**
 * Generate a unique ID based on the name using SHA-1 hashing.
 * The ID is prefixed with "id_" to ensure it starts with a letter.
 */
async function getId(...name) {
  const data = new TextEncoder().encode(name.join("/"));
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `id_${hashHex}`;
}
