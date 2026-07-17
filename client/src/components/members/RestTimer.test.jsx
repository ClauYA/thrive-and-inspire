import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { createRef } from "react";
import { LanguageProvider } from "../../i18n/LanguageContext.jsx";
import RestTimer from "./RestTimer.jsx";

function setup() {
  const ref = createRef();
  const utils = render(
    <LanguageProvider>
      <RestTimer ref={ref} />
    </LanguageProvider>
  );
  return { ref, ...utils };
}

describe("RestTimer", () => {
  let createOscillator;

  beforeEach(() => {
    vi.useFakeTimers();
    createOscillator = vi.fn(() => ({
      connect: vi.fn(),
      frequency: {},
      type: "",
      start: vi.fn(),
      stop: vi.fn(),
    }));
    const createGain = vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    }));
    class FakeAudioContext {
      constructor() {
        this.currentTime = 0;
        this.state = "running";
        this.destination = {};
        this.createOscillator = createOscillator;
        this.createGain = createGain;
        this.resume = vi.fn();
      }
    }
    window.AudioContext = FakeAudioContext;
    navigator.vibrate = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not render until started", () => {
    const { container } = setup();
    expect(container.firstChild).toBeNull();
  });

  it("counts down and formats mm:ss", () => {
    const { ref, getByText } = setup();
    act(() => ref.current.start(90));
    expect(getByText("1:30")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    expect(getByText("1:29")).toBeInTheDocument();
  });

  it("pads seconds under ten", () => {
    const { ref, getByText } = setup();
    act(() => ref.current.start(5));
    expect(getByText("0:05")).toBeInTheDocument();
  });

  it("beeps and shows the done state at zero", () => {
    const { ref, getByText } = setup();
    act(() => ref.current.start(2));
    act(() => vi.advanceTimersByTime(2000));
    expect(getByText(/done/i)).toBeInTheDocument();
    expect(createOscillator).toHaveBeenCalled();
  });
});
