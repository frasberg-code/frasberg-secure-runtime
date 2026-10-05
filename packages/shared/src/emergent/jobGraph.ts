export interface JobNode {
  id: string;
  type: 'logic' | 'video' | 'music' | 'voice' | 'image';
  dependsOn?: string[];
}

export const jobGraph: JobNode[] = [
  { id: 'logic', type: 'logic' },
  { id: 'video', type: 'video', dependsOn: ['logic'] },
  { id: 'music', type: 'music', dependsOn: ['logic'] },
  { id: 'voice', type: 'voice', dependsOn: ['logic'] },
  { id: 'image', type: 'image', dependsOn: ['logic'] },
];
