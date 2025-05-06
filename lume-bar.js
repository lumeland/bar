import dom from "https://cdn.jsdelivr.net/gh/oscarotero/dom@0.1.6/dom.js";

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
 * It uses sessionStorage to persist the state across page reloads.
 */
class State {
  key = "lume-bar";

  constructor() {
    const restore = sessionStorage.getItem(this.key);
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

  save() {
    sessionStorage.setItem(this.key, JSON.stringify(this.state));
  }
}

/**
 * Class to create a bar component.
 * It fetches data from a JSON file and displays it in a structured format.
 */
export default class Bar extends HTMLElement {
  static get observedAttributes() {
    return ["src"];
  }

  constructor() {
    super();
    this.state = new State();

    this.attachShadow({ mode: "open" });
    const styles = import.meta.resolve("./styles.css");
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="${styles}">

      <div class="bar">
        <div class="menu"><div class="controls"></div></div>
        <div hidden class="details"></div>
      </div>
    `;
    this.bar = this.shadowRoot.querySelector(".bar");
    this.menu = this.bar.querySelector(".menu");
    this.controls = this.menu.querySelector(".controls");
    this.details = this.bar.querySelector(".details");
    this.collections = [];

    const hide = dom("button", {
      class: "hide",
      title: "Completely hide the Lume bar (hover here to show it again)",
      html: dom("lume-icon", { name: "x" }),
      onclick: () => {
        this.classList.add("is-hidden");
        this.state.set("hidden", true);
      },
    }, this.controls);

    const icon = dom("lume-icon", { name: "arrows-in-simple" });
    dom("button", {
      html: icon,
      title: "Toggle the Lume bar",
      onclick: () => {
        this.classList.remove("is-hidden");
        if (this.state.get("closed")) {
          icon.setAttribute("name", "arrows-in-simple");
          this.open();
        } else {
          icon.setAttribute("name", "arrows-out-simple");
          this.close();
        }
      },
    }, this.controls);

    if (this.state.get("closed")) {
      this.close();
    }
    if (this.state.get("hidden")) {
      hide.click();
    }
  }

  async attributeChangedCallback(name, _oldValue, newValue) {
    if (!newValue) {
      return;
    }

    const response = await fetch(newValue);
    if (!response.ok) {
      console.error(`Failed to load ${newValue}: ${response.statusText}`);
      return;
    }

    const data = await response.json();
    this.update(data);
  }

  async update(data) {
    this.collections = [];
    this.menu.querySelectorAll(":scope > button")
      .forEach((btn) => btn.remove());
    this.details.innerHTML = "";

    if (!data.collections) {
      return;
    }

    for (const collection of data.collections) {
      if (collection.items) {
        await setIds(collection.items, []);
      }
      this.addCollection(collection);
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

  addCollection(collection) {
    this.collections.push(collection);

    const button = dom("button", {
      data: {
        collection: collection.name,
      },
      html: [
        collection.icon ? dom("lume-icon", { name: collection.icon }) : "",
        collection.name,
        collection.items?.length
          ? ` <span class="badge">${collection.items.length}</span>`
          : "",
      ],
    });

    const onclick = () => {
      const pressed = button.getAttribute("aria-pressed") === "true";

      if (pressed) {
        button.removeAttribute("aria-pressed");
        this.details.innerHTML = "";
        this.details.hidden = true;
        this.state.remove("active_collection");
      } else {
        this.menu.querySelectorAll("button").forEach((btn) =>
          button !== btn && btn.removeAttribute("aria-pressed")
        );
        button.setAttribute("aria-pressed", "true");
        this.details.innerHTML = "";
        this.details.hidden = false;
        collection.items?.length
          ? dom("ul", {
            class: "collection",
            html: collection.items.map((item) =>
              this.renderItem(collection, item)
            ),
          }, this.details)
          : dom("p", {
            class: "collection-empty",
            html: collection.empty || "No items found",
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
      onclick();
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

  renderItem(collection, item) {
    const { contexts } = collection;

    const li = dom("li", {
      class: "item",
      "--color-context": item.context
        ? getColor(contexts?.[item.context]?.background, "var(--color-dim)")
        : undefined,
    });

    if (item.text || item.code || item.items?.length) {
      dom("details", {
        id: item.id,
        ontoggle: () => {
          if (item.id) {
            this.state.set("open_item", item.id);
          } else {
            this.state.remove("open_item");
          }
        },
        html: [
          dom("summary", {
            class: "item-title",
            html: [
              this.renderContext(item, contexts),
              dom("div", {
                class: "item-title-content",
                html: extractBadge(item.title),
              }),
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
              html: item.items.map((item) => this.renderItem(collection, item)),
            })
            : "",
        ],
      }, li);
    } else {
      dom("div", {
        class: "item-title",
        html: [
          this.renderContext(item, contexts),
          dom("p", {
            class: "item-title-content",
            html: extractBadge(item.title),
          }),
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
        html: item.actions.map((action) =>
          dom(action.onclick ? "button" : "a", {
            class: "item-action",
            html: [
              action.icon ? dom("lume-icon", { name: action.icon }) : "",
              action.text,
            ],
            href: action.href,
            target: action.target,
            onclick: action.onclick,
          })
        ),
      });

      li.appendChild(actions);
    }

    return li;
  }

  renderContext(item, contexts) {
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
        context.icon ? dom("lume-icon", { name: context.icon }) : "",
        item.context,
      ],
    });
  }
}

customElements.define("lume-bar", Bar);

/**
 * Custom element to display an icon.
 * It fetches the icon from a CDN and caches it for future use.
 */
class Icon extends HTMLElement {
  // Cache for icons to avoid fetching them multiple times
  static cache = new Map();

  static get observedAttributes() {
    return ["name"];
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    this.innerHTML = await this.fetch(newValue);
  }

  async fetch(name) {
    const variant = name.endsWith("-fill") ? "fill" : "regular";
    const url =
      `https://cdn.jsdelivr.net/npm/@phosphor-icons/core@2.1.1/assets/${variant}/${name}.svg`;

    if (Icon.cache.has(url)) {
      return Icon.cache.get(url);
    }

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Icon not found: ${name}`);
    }

    const text = response.ok ? await response.text() : "";

    Icon.cache.set(url, text);
    return text;
  }
}

customElements.define("lume-icon", Icon);

/** Get the color for a specific context or return a default color */
function getColor(color, defaultColor) {
  return color ? colors.get(color) ?? color : defaultColor;
}

/**
 * Set missing IDs for items in a collection.
 */
async function setIds(items, ids) {
  for (const item of items) {
    if (item.id) {
      ids.push(item.id);
    } else {
      ids.push(item.title);
      item.id = await generateId(ids);
    }

    if (item.items) {
      await setIds(item.items, [...ids]);
    }
  }
}

/**
 * Generate a unique ID based on the name using SHA-1 hashing.
 * The ID is prefixed with "id_" to ensure it starts with a letter.
 */
async function generateId(names) {
  const data = new TextEncoder().encode(names.join("/"));
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `id_${hashHex}`;
}

function extractBadge(text) {
  if (!text.startsWith("[")) {
    return ["", text];
  }
  const match = text.match(/^\[([\w\s-]+)\]\s*(.*)$/);
  return match
    ? [
      `<span class="badge">${match[1]}</span> `,
      match[2],
    ]
    : ["", text];
}
