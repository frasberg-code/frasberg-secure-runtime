import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AppShell } from "../AppShell";

describe("AppShell", () => {
  it("renders title", () => {
    render(
      <BrowserRouter>
        <AppShell title="Test Dashboard">
          <div>Content</div>
        </AppShell>
      </BrowserRouter>
    );

    expect(screen.getByText("Test Dashboard")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <BrowserRouter>
        <AppShell title="Test">
          <div>Test Content</div>
        </AppShell>
      </BrowserRouter>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("renders navigation items", () => {
    render(
      <BrowserRouter>
        <AppShell
          title="Test"
          navItems={[{ to: "/test", label: "Test Item" }]}
        >
          <div>Content</div>
        </AppShell>
      </BrowserRouter>
    );

    expect(screen.getByText("Test Item")).toBeInTheDocument();
  });
});
