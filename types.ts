/** A collection of messages to show in a tab */
export interface Collection {
  /**
   * The name of the collection
   */
  name: string;

  /**
   * The icon name to show in the tab
   * @see https://phosphoricons.com/
   */
  icon?: string;

  /**
   * A list of context to group the items
   */
  contexts?: Record<string, ItemContext>;

  /**
   * The text to show when the collection is empty
   * @example "No items found"
   */
  empty?: string;

  /**
   * A list of items to show in the collection
   */
  items: Item[];
}

export interface ItemContext {
  /**
   * The title of the context
   * if not provided, the context name will be used
   */
  title?: string;

  /**
   * The background color of the badge with the context
   * It can be any valid CSS color value
   * or the keywords: "success", "warning", "error", "info" and "important"
   * By default is gray
   */
  background?: string;

  /**
   * The text color of the badge with the context
   * It can be any valid CSS color value
   * or the keywords: "success", "warning", "error", "info" and "important"
   * By default is black
   */
  color?: string;

  /**
   * Optional icon name to show in the badge instead of the text
   * @see https://phosphoricons.com/
   */
  icon?: string;
}

export interface Item {
  /**
   * The title of the item
   */
  title: string;

  /**
   * The context name of the item.
   */
  context?: string;

  /**
   * Small text to show at the right of the title
   * It can be a number or a string
   * @example 2, "3 errors", "4 warnings"
   */
  details?: string | number;

  /**
   * The text to show if the item is expanded
   */
  text?: string;

  /**
   * The code to show if the item is expanded
   */
  code?: string;

  /**
   * List of sub-items to show in the expanded view
   */
  items?: Item[];

  /**
   * List of actions for this item
   */
  actions?: Action[];
}

export interface Action {
  /**
   * The text to show in the action button
   */
  text: string;

  /**
   * The URL to open when the action is clicked
   */
  href?: string;

  /**
   * The callback to perform when the action is clicked
   * It must be a string with the code to execute
   * @example "alert('Hello world!')"
   */
  onclick?: string;

  /**
   * The icon name to show in the action button
   * @see https://phosphoricons.com/
   */
  icon?: string;

  /**
   * The target to open the URL
   * It can be "_blank", "_self", "_parent", "_top", etc.
   */
  target?: string;

  /**
   * Data to pass to send a message to the background script
   */
  data?: Record<string, string | number | boolean>;
}
