export const formatDate = (ts: string) =>
  new Date(ts).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
