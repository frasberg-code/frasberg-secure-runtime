import { create } from "zustand";

type CourtState = {
  selectedCaseId: string | null;
  selectedEvidenceIds: string[];
  setCase: (id: string | null) => void;
  setEvidence: (ids: string[]) => void;
  clearSelection: () => void;
};

export const useCourtStore = create<CourtState>((set) => ({
  selectedCaseId: null,
  selectedEvidenceIds: [],
  setCase: (id) => set({ selectedCaseId: id }),
  setEvidence: (ids) => set({ selectedEvidenceIds: ids }),
  clearSelection: () => set({ selectedCaseId: null, selectedEvidenceIds: [] })
}));
