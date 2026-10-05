import React from "react";
import { render, screen } from "@testing-library/react";
import { AuditPanel } from "../AuditPanel";
import * as useAuditHook from "../../../hooks/useAudit";

describe("AuditPanel", () => {
  it("renders loading state", () => {
    jest.spyOn(useAuditHook, "useAudit").mockReturnValue({
      events: [],
      loading: true,
      error: null
    });

    render(<AuditPanel caseId="case_1" />);
    expect(screen.getByText("Loading audit log...")).toBeInTheDocument();
  });

  it("renders audit events", () => {
    jest.spyOn(useAuditHook, "useAudit").mockReturnValue({
      events: [
        {
          id: "1",
          caseId: "case_1",
          actor: "system",
          action: "court.case.created",
          timestamp: "2026-07-13T00:00:00Z"
        }
      ],
      loading: false,
      error: null
    });

    render(<AuditPanel caseId="case_1" />);
    expect(screen.getByText("court.case.created")).toBeInTheDocument();
  });
});
