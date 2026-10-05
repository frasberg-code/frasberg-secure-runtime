# Learnings / Bug Patterns

## SVG text + build instrumentation (June 2026)
The frontend build injects x-* instrumentation attributes and MANGLES multi-child SVG `<text>` nodes:
`<text>{label} n{n.id}</text>` renders only the static " n" part.
FIX: always use a single template-literal child: `<text>{`${label} n${n.id}`}</text>`.
Affected+fixed: Playground.jsx node labels, RegionMesh.jsx region status text. HTML elements are unaffected.
