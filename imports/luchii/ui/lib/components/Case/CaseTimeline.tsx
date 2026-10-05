import React from "react";
import { Card } from "../../design/Card";
import { tokens } from "../../theme/tokens";
import { formatDate } from "../../utils/formatDate";

export const CaseTimeline: React.FC<{
  events: Array<{ id: string; text: string; at: string }>;
}> = ({ events }) => (
  <Card>
    <h2>Timeline</h2>
    <ul style={{ listStyle: "none", padding: 0 }}>
      {events.map((e) => (
        <li
          key={e.id}
          style={{
            padding: tokens.spacing(1),
            marginBottom: tokens.spacing(1),
            borderLeft: `3px solid ${tokens.color.primary}`,
            paddingLeft: tokens.spacing(1.5)
          }}
        >
          <strong>{e.text}</strong>
          <br />
          <small>{formatDate(e.at)}</small>
        </li>
      ))}
    </ul>
  </Card>
);
