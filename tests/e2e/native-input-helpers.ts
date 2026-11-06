import { type Page } from "@playwright/test";

export async function nativeDelete(page: Page, inputType: string) {
  return page.getByLabel("已渲染文档").evaluate((root, inputType) => {
    const event = new InputEvent("beforeinput", {
      inputType,
      bubbles: true,
      cancelable: true,
    });
    root.dispatchEvent(event);
    return event.defaultPrevented;
  }, inputType);
}
