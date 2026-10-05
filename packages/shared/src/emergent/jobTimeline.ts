export type TimelineEventType =
  | 'logic'
  | 'video'
  | 'music'
  | 'voice'
  | 'image'
  | 'worldgraph'
  | 'diagnostic';

export interface JobTimelineEvent {
  id: string;
  jobId: string;
  type: TimelineEventType;
  status: 'queued' | 'running' | 'completed' | 'failed';
  timestamp: number;
  meta?: any;
}

const MAX_EVENTS = 5000;
const timelineStore: JobTimelineEvent[] = [];

export function recordTimelineEvent(event: JobTimelineEvent) {
  timelineStore.push(event);
  if (timelineStore.length > MAX_EVENTS) {
    timelineStore.splice(0, timelineStore.length - MAX_EVENTS);
  }
}

export function getTimelineForJob(jobId: string): JobTimelineEvent[] {
  return timelineStore.filter((e) => e.jobId === jobId);
}
