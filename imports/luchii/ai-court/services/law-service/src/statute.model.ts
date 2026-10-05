export interface Statute {
  id: string;
  citation: string;
  text: string;
  region: string;
}

export interface Precedent {
  id: string;
  caseName: string;
  summary: string;
  region: string;
  court: string;
}
