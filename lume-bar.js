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

          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: min(1200px, 100% - 2rem);
        }
        .bar {
          background-color: var(--color-background);
          color: var(--color-text);
          box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
          box-sizing: border-box;
          font-family: var(--font-family-ui);
          font-size: 14px;
          border-radius: 6px 6px 0 0;
          overflow: hidden;
        }
        .menu {
          display: flex;
          overflow-x: auto;
          margin-bottom: -1px;
          z-index: 1;

          button {
            display: flex;
            align-items: center;
            column-gap: .5rem;
            background: none;
            border: none;
            border-right: solid 1px var(--color-line);
            border-bottom: solid 1px transparent;
            height: 40px;
            padding: 0 .8em;
            cursor: pointer;
            font: inherit;
            color: var(--color-dim);

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
          padding: 10px;
          border-top: solid 1px var(--color-line);
          background-color: var(--color-highlight);

          &:empty {
            display: none;
          }
        }
        .bar.is-closed {
          width: min-content;
          .details {
            display: none;
          }
          .menu > :not(.toggle) {
            display: none;
          }
        }
        .collection {
          list-style-type: none;
          margin: 0;
          padding: 0;

          > li + li {
            border-top: solid 1px var(--color-line);
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
          font-size: 12px;
          font-weight: 500;
        }
        .item.is-code {
          font-family: var(--font-family-code);
        }
        .item-text {
          padding: 10px 0;
          margin: 0;
          display: flex;
          align-items: center;
          column-gap: 16px;

          svg {
            width: 1em;
            height: 1em;
          }
        }
        summary.item-text {
          list-style: none;
          cursor: pointer;
          &:hover {
            color: var(--color-base);
          }
        }
        .item-details {
          padding-bottom: 10px;
          margin: 0;
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
          dom("ul", {
            class: "collection",
            html: await Promise.all(collection.items.map(renderItemCollection)),
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

async function renderItemCollection(item) {
  const li = dom("li", {
    class: "item",
  });

  if (item.details || item.code) {
    dom("details", {
      html: [
        dom("summary", {
          class: "item-text",
          html: [
            renderBadge(item.badge),
            item.text,
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
      ],
    }, li);
  } else {
    dom("p", {
      class: "item-text",
      html: [
        renderBadge(item.badge),
        item.text,
      ],
    }, li);
  }

  return li;
}

function renderBadge(badge) {
  if (!badge) {
    return "";
  }
  const [text, color] = badge.split(":").map((s) => s.trim());
  return dom("span", {
    class: "badge",
    "--background": `var(--color-${color}, var(--color-dim))`,
    "--color": "var(--color-background)",
    html: text,
  });
}
