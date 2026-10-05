export interface TableColumn {
  name: string;
  width?: number;
}

export class OutputFormatter {
  static formatTable(
    headers: string[],
    rows: (string | number | boolean)[][]
  ): string {
    const columnWidths = headers.map((h) => Math.max(h.length, 12));

    rows.forEach((row) => {
      row.forEach((cell, i) => {
        const width = String(cell).length;
        columnWidths[i] = Math.max(columnWidths[i], width);
      });
    });

    const separator = columnWidths
      .map((w) => "─".repeat(w + 2))
      .join("┼");
    const headerRow = headers
      .map((h, i) => h.padEnd(columnWidths[i]))
      .join(" │ ");

    let output = "┌" + separator.slice(1) + "┐\n";
    output += "│ " + headerRow + " │\n";
    output += "├" + separator.slice(1) + "┤\n";

    rows.forEach((row) => {
      const cells = row
        .map((c, i) => String(c).padEnd(columnWidths[i]))
        .join(" │ ");
      output += "│ " + cells + " │\n";
    });

    output += "└" + separator.slice(1) + "┘";
    return output;
  }

  static formatJSON(data: unknown): string {
    return JSON.stringify(data, null, 2);
  }

  static formatYAML(data: unknown): string {
    return this.toYAML(data, 0);
  }

  private static toYAML(data: unknown, indent: number): string {
    const spaces = " ".repeat(indent);

    if (data === null || data === undefined) {
      return "null";
    }

    if (typeof data === "string") {
      return `'${data}'`;
    }

    if (typeof data === "number" || typeof data === "boolean") {
      return String(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return "[]";
      }
      return data
        .map((item) => `${spaces}- ${this.toYAML(item, indent + 2)}`)
        .join("\n");
    }

    if (typeof data === "object") {
      const entries = Object.entries(data as Record<string, unknown>);
      if (entries.length === 0) {
        return "{}";
      }
      return entries
        .map(
          ([key, value]) =>
            `${spaces}${key}: ${this.toYAML(value, indent + 2)}`
        )
        .join("\n");
    }

    return String(data);
  }
}

export function printOutput(
  data: unknown,
  format: "json" | "table" | "yaml"
): void {
  switch (format) {
    case "json":
      console.log(OutputFormatter.formatJSON(data));
      break;
    case "yaml":
      console.log(OutputFormatter.formatYAML(data));
      break;
    case "table":
      if (typeof data === "string") {
        console.log(data);
      } else {
        console.log(OutputFormatter.formatJSON(data));
      }
      break;
  }
}
