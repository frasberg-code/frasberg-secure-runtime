import React from "react";
import { render, screen } from "@testing-library/react";
import { CaseList } from "../CaseList";
import * as useCasesHook from "../../../hooks/useCases";

describe("CaseList", () => {
  it("renders loading state", () => {
    jest.spyOn(useCasesHook, "useCases").mockReturnValue({
      cases: [],
      loading: true,
      error: null
    });

    render(<CaseList />);
    expect(screen.getByText("Loading cases...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    jest.spyOn(useCasesHook, "useCases").mockReturnValue({
      cases: [],
      loading: false,
      error: "Failed to load"
    });

    render(<CaseList />);
    expect(screen.getByText(/Error/)).toBeInTheDocument();
  });

  it("renders cases", () => {
    jest.spyOn(useCasesHook, "useCases").mockReturnValue({
      cases: [
        { id: "1", title: "Case 1", status: "OPEN", createdAt: "2026-07-13T00:00:00Z" }
      ],
      loading: false,
      error: null
    });

    render(<CaseList />);
    expect(screen.getByText("Case 1")).toBeInTheDocument();
  });
});
