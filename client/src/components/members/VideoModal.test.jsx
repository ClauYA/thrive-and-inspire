import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { LanguageProvider } from "../../i18n/LanguageContext.jsx";
import VideoModal, { resolveEmbed } from "./VideoModal.jsx";

const wrap = (ui) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe("resolveEmbed", () => {
  it("embeds specific YouTube links by id", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=abcdefghijk",
      "https://youtu.be/abcdefghijk",
      "https://www.youtube.com/shorts/abcdefghijk",
      "https://www.youtube.com/embed/abcdefghijk",
    ]) {
      const r = resolveEmbed(url, "Squat");
      expect(r.type).toBe("yt");
      expect(r.src).toContain("/embed/abcdefghijk");
    }
  });

  it("plays direct video files", () => {
    expect(resolveEmbed("https://x.com/clip.mp4").type).toBe("file");
    expect(resolveEmbed("https://x.com/clip.webm").type).toBe("file");
  });

  it("falls back to a search embed using the exercise name", () => {
    const r = resolveEmbed("", "Barbell Row");
    expect(r.type).toBe("yt");
    expect(r.src).toContain("listType=search");
    expect(r.src).toContain(encodeURIComponent("how to Barbell Row"));
  });
});

describe("VideoModal", () => {
  it("renders nothing when closed", () => {
    const { container } = wrap(<VideoModal open={false} onClose={() => {}} name="Squat" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a video element for a file url", () => {
    const { container } = wrap(<VideoModal open onClose={() => {}} url="https://x.com/clip.mp4" name="Squat" />);
    expect(container.querySelector("video")).toBeTruthy();
  });

  it("closes on the X button and on Escape", () => {
    const onClose = vi.fn();
    const { getByLabelText } = wrap(<VideoModal open onClose={onClose} name="Squat" />);
    fireEvent.click(getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
