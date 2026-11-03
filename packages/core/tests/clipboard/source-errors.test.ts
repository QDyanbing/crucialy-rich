import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CLIPBOARD_PARSERS, parseClipboardData } from "../../src";

describe("clipboard source read failures", () => {
  it("stops before reading data when MIME metadata throws", () => {
    const getData = vi.fn(() => "text");
    expect(
      parseClipboardData(
        {
          get types(): string[] {
            throw new Error("Metadata unavailable.");
          },
          getData,
        },
        DEFAULT_CLIPBOARD_PARSERS,
      ),
    ).toBeUndefined();
    expect(getData).not.toHaveBeenCalled();
  });

  it.each(["text/html", "text/markdown", "text/plain"])(
    "does not retry lower formats when reading %s fails",
    (mimeType) => {
      const getData = vi.fn((type: string) => {
        if (type === mimeType) throw new Error("Data unavailable.");
        return "fallback";
      });
      expect(
        parseClipboardData(
          { types: [mimeType, "text/plain"], getData },
          DEFAULT_CLIPBOARD_PARSERS,
        ),
      ).toBeUndefined();
      expect(getData).toHaveBeenCalledExactlyOnceWith(mimeType);
    },
  );

  it("does not bypass unreadable HTML source inspection with a custom parser", () => {
    const parse = vi.fn();
    const getData = vi.fn(() => {
      throw new Error("HTML inaccessible.");
    });
    expect(
      parseClipboardData({ types: ["text/html", "text/plain"], getData }, [
        { mimeType: "text/plain", parse },
      ]),
    ).toBeUndefined();
    expect(getData).toHaveBeenCalledExactlyOnceWith("text/html");
    expect(parse).not.toHaveBeenCalled();
  });

  it("snapshots available MIME metadata once before reading any data", () => {
    const types = ["text/plain"];
    const readTypes = vi.fn(() => types);
    const getData = vi.fn(() => {
      types.push("text/html");
      return "plain";
    });
    const source = {
      get types() {
        return readTypes();
      },
      getData,
    };
    expect(parseClipboardData(source, DEFAULT_CLIPBOARD_PARSERS)?.mimeType).toBe(
      "text/plain",
    );
    expect(readTypes).toHaveBeenCalledTimes(1);
    expect(getData).toHaveBeenCalledExactlyOnceWith("text/plain");
  });

  it("still avoids data reads when no parser matches the MIME snapshot", () => {
    const getData = vi.fn(() => {
      throw new Error("Must not read.");
    });
    expect(
      parseClipboardData({ types: ["image/png"], getData }, DEFAULT_CLIPBOARD_PARSERS),
    ).toBeUndefined();
    expect(getData).not.toHaveBeenCalled();
  });
});
