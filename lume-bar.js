import { dom, icon, icons } from "./deps.js";
import State from "./state.js";

class LumeBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --color-base: hsl(220, 20%, 100%);
          --color-text: hsl(220, 20%, 70%);
          --color-dim: hsl(220, 20%, 55%);
          --color-line: hsl(220, 20%, 20%);
          --color-background: hsl(220, 20%, 10%);
          --color-highlight: hsl(220, 20%, 13%);
          --color-primary: hsl(0, 88%, 65%);

          --color-error: hsl(0, 100%, 70%);
          --color-warning: hsl(50, 80%, 50%);
          --color-success: hsl(140, 70%, 60%);
          --color-info: hsl(210, 80%, 70%);
          --color-important: hsl(300, 60%, 60%);

          --font-family-code: Consolas, Menlo, Monaco, monospace;
          --font-family-ui: system-ui, sans-serif;
          --border-radius: 6px;
          --gap: 8px;

          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: min(1200px, 100% - 40px);

          @media (max-width: 600px) {
            width: min(600px - 40px, 100%)
          }
        }
        .bar {
          background-color: var(--color-background);
          color: var(--color-text);
          box-shadow: 0 0 0 1px black, 0 -1px 20px rgba(255, 255, 255, 0.1);
          box-sizing: border-box;
          font-family: var(--font-family-ui);
          font-size: 14px;
          border-radius: var(--border-radius) var(--border-radius) 0 0;
          overflow: hidden;

          @media (max-width: 560px) {
            border-radius: 0;
          }

          &.is-closed {
            width: min-content;

            @media (max-width: 560px) {
              border-radius: 0 var(--border-radius) 0 0;
            }

            .details {
              display: none;
            }

            .menu > :not(.toggle) {
              display: none;
            }
          }
        }
        .menu {
          display: flex;
          overflow-x: auto;
          margin-bottom: -1px;
          z-index: 1;
          scrollbar-width: thin;
          scrollbar-color: var(--color-line) transparent;

          button {
            display: flex;
            align-items: center;
            column-gap: var(--gap);
            background: none;
            border: none;
            border-right: solid 1px var(--color-line);
            border-bottom: solid 1px transparent;
            height: 40px;
            padding: 0 .8em;
            cursor: pointer;
            font: inherit;
            color: var(--color-dim);
            white-space: nowrap;

            &:hover {
              color: var(--color-base);
            }

            &[aria-pressed="true"] {
              color: var(--color-base);
              background-color: var(--color-highlight);
              border-bottom-color: var(--color-highlight);
            }
            
            svg {
              fill: currentColor;
              width: 20px;
              height: 20px;
            }
          }
          .toggle {
            order: 1;
            margin-left: auto;
            border: none;
          }
        }
        .details {
          max-height: 200px;
          overflow-y: auto;
          border-top: solid 1px var(--color-line);
          background-color: var(--color-highlight);

          &:empty {
            display: none;
          }
        }

        .collection {
          list-style-type: none;
          margin: var(--gap) 0;
          padding: 0;
          display: grid;
          row-gap: 4px;

          > li:hover:has(details),
          > li:has(> details[open]) {
            outline: solid 1px var(--color-line);
            background-color: var(--color-background);
          }
        }
        .badge {
          --background: var(--color-dim);
          --color: var(--color-background);

          display: inline-block;
          background-color: var(--background);
          color: var(--color);
          padding: 2px 4px;
          border-radius: 4px;
          text-transform: uppercase;
          font-size: .85em;
          font-weight: 500;
        }
        .item {
          display: flex;
          column-gap: var(--gap);
          align-items: center;
          padding: 0 var(--gap);

          > :first-child {
            flex: 1 1 auto;
          }
          .item {
            border-radius: var(--border-radius);
            padding-right: 0;
          }
        }
        .item.is-code {
          font-family: var(--font-family-code);
        }
        .item-title {
          padding: var(--gap) 0;
          margin: 0;
          display: flex;
          align-items: center;
          column-gap: var(--gap);

          svg {
            width: 1em;
            height: 1em;
          }
        }
        summary.item-title {
          list-style: none;
          cursor: pointer;
          &:hover {
            color: var(--color-base);
          }
        }
        .item-details {
          padding-bottom: var(--gap);
          margin: 0;
        }
        .item-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--gap);
        }
        .item-action {
          color: var(--color-text);
          text-decoration: none;
          height: 32px;
          display: flex;
          align-items: center;
          column-gap: var(--gap);
          padding: 0 var(--gap);
          border-radius: var(--border-radius);
          border: solid 1px var(--color-line);
          background-color: var(--color-background);

          svg {
            width: 16px;
            height: 16px;
          }

          &:hover {
            background-color: var(--color-highlight);
            color: var(--color-base);
          }
        }
      </style>

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

    this.init();
  }

  async init() {
    const [iconIn, iconOut] = await icons(
      "arrows-in-simple",
      "arrows-out-simple",
    );

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

    if (!data.collections) {
      console.error(`Invalid data format: ${src}`);
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
      onclick: async () => {
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
              collection.items.map((c) =>
                renderItemCollection(c, collection.contexts)
              ),
            ),
          }, this.details);
          this.state.set("active_collection", collection.name);
        }
      },
    });

    this.menu.appendChild(button);

    if (this.state.get("active_collection") === collection.name) {
      button.click();
    }
  }
}

customElements.define("lume-bar", LumeBar);

async function renderItemCollection(item, contexts) {
  const li = dom("li", {
    class: "item",
  });

  if (item.details || item.code || item.items?.length) {
    dom("details", {
      html: [
        dom("summary", {
          class: "item-title",
          html: [
            renderContext(item, contexts),
            item.title,
          ],
        }),
        item.details
          ? dom("div", {
            class: "item-details",
            html: item.details,
          })
          : "",
        item.code
          ? dom("pre", {
            class: "item-details",
            html: item.code,
          })
          : "",
        item.items?.length
          ? dom("ul", {
            class: "collection",
            html: await Promise.all(
              item.items.map((c) => renderItemCollection(c, contexts)),
            ),
          })
          : "",
      ],
    }, li);
  } else {
    dom("p", {
      class: "item-title",
      html: [
        renderContext(item, contexts),
        item.title,
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

const colors = new Map([
  ["error", "var(--color-error)"],
  ["warning", "var(--color-warning)"],
  ["success", "var(--color-success)"],
  ["info", "var(--color-info)"],
  ["important", "var(--color-important)"],
]);

function renderContext(item, contexts) {
  if (!item.context) {
    return "";
  }

  const context = contexts[item.context];
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
    "--color": color ? colors.get(color) ?? color : "var(--color-background)",
    html: item.context,
  });
}
