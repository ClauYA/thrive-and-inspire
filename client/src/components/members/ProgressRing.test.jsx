import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import ProgressRing from "./ProgressRing.jsx";

describe("ProgressRing", () => {
  it("rounds the percentage label", () => {
    const { getByText } = render(<ProgressRing pct={42.6} />);
    expect(getByText("43%")).toBeInTheDocument();
  });

  it("clamps a 150% arc to full (offset 0)", () => {
    const { container } = render(<ProgressRing pct={150} size={84} />);
    const arc = container.querySelectorAll("circle")[1];
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBe(0);
  });

  it("clamps a -10% arc to empty (offset = circumference)", () => {
    const { container } = render(<ProgressRing pct={-10} size={84} />);
    const arc = container.querySelectorAll("circle")[1];
    const stroke = 9;
    const circ = 2 * Math.PI * ((84 - stroke) / 2);
    expect(Number(arc.getAttribute("stroke-dashoffset"))).toBeCloseTo(circ, 4);
  });

  it("shows the value/goal line only when both are present", () => {
    const withVals = render(<ProgressRing pct={50} value={70} goal={140} unit="g" />);
    expect(within(withVals.container).getByText("70/140g")).toBeInTheDocument();

    const without = render(<ProgressRing pct={50} />);
    expect(within(without.container).queryByText(/\d+\/\d+/)).toBeNull();
  });

  it("uses the thinner stroke when size < 64", () => {
    const { container } = render(<ProgressRing pct={50} size={54} />);
    expect(container.querySelector("circle").getAttribute("stroke-width")).toBe("7");
  });
});
