import { dom } from "./deps.js";
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
          --color-primary: hsl(0deg, 88%, 65%);

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
          padding: 10px 10px 20px 10px;
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

    const toggleButton = dom("button", {
      class: "toggle",
      text: "Toggle",
      onclick: () => this.state.get("closed") ? this.open() : this.close(),
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

  addCollection(collection) {
    this.collections.push(collection);

    const button = dom("button", {
      text: collection.name,
      onclick: () => {
        const pressed = button.getAttribute("aria-pressed") === "true";

        if (pressed) {
          button.removeAttribute("aria-pressed");
          this.details.innerHTML = "";
        } else {
          this.menu.querySelectorAll("button").forEach((btn) =>
            button !== btn && btn.removeAttribute("aria-pressed")
          );
          button.setAttribute("aria-pressed", "true");
          this.details.innerHTML = "Details for " + collection.name;
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
