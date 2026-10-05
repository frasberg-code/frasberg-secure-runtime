import os

ROOT = "/app"
CORE = ("awarenessSelf.consciousnessPerception.mindAwareness.cognitiveMindspace."
        "reasoningArchitecture.logicCognition.designReasoning.blueprintLogic."
        "architecturePlan.structureBlueprint.patternArchitecture.exchangeStructure."
        "interactionFlow.influenceExchange.fieldPropagation.vectorInfluence."
        "forceDirection.dynamicsVector.motionForce.travelKinetics."
        "navigationMotion.routeDecision.pathNavigation.directionMap."
        "pathwayDirection.structuralPathway")

FILES = {}


def add(path, content):
    FILES[path] = content.strip() + "\n"


# ================= packages/identity-engine =================
add("packages/identity-engine/identity-model.ts", """
export interface Identity {
  identityId: string;
  self: any;
  integration: any;
  identityGraph: any;
  createdAt: number;
}
""")

_self_nested = "open"
_keys = CORE.split(".")
_body = '"open"'
for i, k in enumerate(reversed(_keys)):
    indent = "  " * (len(_keys) - i)
    _body = "{\n" + indent + "  " + k + ": " + _body + "\n" + indent + "}"
add("packages/identity-engine/self.ts", "export function buildSelf() {\n  return " + _body + ";\n}")

add("packages/identity-engine/integration.ts", """
export function buildIntegration(self) {
  return {
    harmonyIntegration: "stable",
    checksum: Math.random().toString(36).slice(2)
  };
}
""")

add("packages/identity-engine/identity-graph.ts", """
export function buildIdentityGraph(integration) {
  return {
    nodes: [
      { id: "self", weight: 1 },
      { id: "integration", weight: integration.harmonyIntegration === "stable" ? 1 : 0 }
    ],
    edges: [
      { from: "self", to: "integration", relation: "integrates" }
    ]
  };
}
""")

add("packages/identity-engine/identity-envelope.ts", """
export function buildIdentityEnvelope(identity) {
  return {
    identityId: identity.identityId,
    self: identity.self,
    integration: identity.integration,
    identityGraph: identity.identityGraph,
    timestamp: Date.now()
  };
}
""")

# ================= chain engines (persona -> structure) =================
ENGINES = [
    dict(pkg="persona-engine", iface="Persona", idf="personaId",
         f1="model", f2="projection", graph="personaGraph",
         f1_file="model.ts", f1_fn="buildPersonaModel", f1_arg="identity",
         f1_k1="identityModel", f1_v1="identity.self", f1_k2="integrationModel", f1_v2="identity.integration",
         f2_file="projection.ts", f2_fn="buildPersonaProjection", f2_arg="model",
         sk="structuralProjection", deep="model.identityModel." + CORE, sv="expressed", sa="suppressed",
         hk="harmonyProjection", prev='model.integrationModel.harmonyIntegration === "stable"', hv="coherent", ha="unstable",
         g_file="persona-graph.ts", g_fn="buildPersonaGraph", n1="model", n2="projection", rel="projects",
         env_file="persona-envelope.ts", env_fn="buildPersonaEnvelope", evolve=False),
    dict(pkg="character-engine", iface="Character", idf="characterId",
         f1="formation", f2="expression", graph="characterGraph",
         f1_file="formation.ts", f1_fn="buildCharacterFormation", f1_arg="persona",
         f1_k1="personaFormation", f1_v1="persona.model", f1_k2="projectionFormation", f1_v2="persona.projection",
         f2_file="expression.ts", f2_fn="buildCharacterExpression", f2_arg="formation",
         sk="structuralExpression", deep="formation.personaFormation.identityModel." + CORE, sv="manifested", sa="latent",
         hk="harmonyExpression", prev='formation.projectionFormation.harmonyProjection === "coherent"', hv="stable", ha="unstable",
         g_file="character-graph.ts", g_fn="buildCharacterGraph", n1="formation", n2="expression", rel="expresses",
         env_file="character-envelope.ts", env_fn="buildCharacterEnvelope", evolve=False),
    dict(pkg="role-engine", iface="Role", idf="roleId",
         f1="function", f2="dynamics", graph="roleGraph",
         f1_file="function.ts", f1_fn="buildRoleFunction", f1_arg="character",
         f1_k1="characterFunction", f1_v1="character.formation", f1_k2="expressionFunction", f1_v2="character.expression",
         f2_file="dynamics.ts", f2_fn="buildRoleDynamics", f2_arg="func",
         sk="structuralRoleDynamics", deep="func.characterFunction.personaFormation.identityModel." + CORE, sv="active", sa="dormant",
         hk="harmonyRoleDynamics", prev='func.expressionFunction.harmonyExpression === "stable"', hv="coherent", ha="unstable",
         g_file="role-graph.ts", g_fn="buildRoleGraph", n1="function", n2="dynamics", rel="drives",
         env_file="role-envelope.ts", env_fn="buildRoleEnvelope", evolve=False),
    dict(pkg="function-engine", iface="Func", idf="functionId",
         f1="execution", f2="dynamics", graph="functionGraph",
         f1_file="execution.ts", f1_fn="buildExecution", f1_arg="role",
         f1_k1="roleExecution", f1_v1="role.function", f1_k2="dynamicsExecution", f1_v2="role.dynamics",
         f2_file="dynamics.ts", f2_fn="buildFunctionalDynamics", f2_arg="execution",
         sk="structuralFunctionalDynamics", deep="execution.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="operational", sa="inactive",
         hk="harmonyFunctionalDynamics", prev='execution.dynamicsExecution.harmonyRoleDynamics === "coherent"', hv="stable", ha="unstable",
         g_file="function-graph.ts", g_fn="buildFunctionGraph", n1="execution", n2="dynamics", rel="produces",
         env_file="function-envelope.ts", env_fn="buildFunctionEnvelope", evolve=False),
    dict(pkg="task-engine", iface="Task", idf="taskId",
         f1="action", f2="dynamics", graph="taskGraph",
         f1_file="action.ts", f1_fn="buildAction", f1_arg="func",
         f1_k1="functionAction", f1_v1="func.execution", f1_k2="dynamicsAction", f1_v2="func.dynamics",
         f2_file="dynamics.ts", f2_fn="buildTaskDynamics", f2_arg="action",
         sk="structuralTaskDynamics", deep="action.functionAction.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="engaged", sa="idle",
         hk="harmonyTaskDynamics", prev='action.dynamicsAction.harmonyFunctionalDynamics === "stable"', hv="coherent", ha="unstable",
         g_file="task-graph.ts", g_fn="buildTaskGraph", n1="action", n2="dynamics", rel="drives",
         env_file="task-envelope.ts", env_fn="buildTaskEnvelope", evolve=False),
    dict(pkg="action-engine", iface="Action", idf="actionId",
         f1="motion", f2="dynamics", graph="actionGraph",
         f1_file="motion.ts", f1_fn="buildMotion", f1_arg="task",
         f1_k1="taskMotion", f1_v1="task.action", f1_k2="dynamicsMotion", f1_v2="task.dynamics",
         f2_file="dynamics.ts", f2_fn="buildActionDynamics", f2_arg="motion",
         sk="structuralActionDynamics", deep="motion.taskMotion.functionAction.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="in_motion", sa="static",
         hk="harmonyActionDynamics", prev='motion.dynamicsMotion.harmonyTaskDynamics === "coherent"', hv="stable", ha="unstable",
         g_file="action-graph.ts", g_fn="buildActionGraph", n1="motion", n2="dynamics", rel="drives",
         env_file="action-envelope.ts", env_fn="buildActionEnvelope", evolve=False),
    dict(pkg="behavior-engine", iface="Behavior", idf="behaviorId",
         f1="pattern", f2="dynamics", graph="behaviorGraph",
         f1_file="pattern.ts", f1_fn="buildPattern", f1_arg="action",
         f1_k1="actionPattern", f1_v1="action.motion", f1_k2="dynamicsPattern", f1_v2="action.dynamics",
         f2_file="dynamics.ts", f2_fn="buildBehaviorDynamics", f2_arg="pattern",
         sk="structuralBehaviorDynamics", deep="pattern.actionPattern.taskMotion.functionAction.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="emergent", sa="suppressed",
         hk="harmonyBehaviorDynamics", prev='pattern.dynamicsPattern.harmonyActionDynamics === "stable"', hv="coherent", ha="unstable",
         g_file="behavior-graph.ts", g_fn="buildBehaviorGraph", n1="pattern", n2="dynamics", rel="produces",
         env_file="behavior-envelope.ts", env_fn="buildBehaviorEnvelope", evolve=True, ev_fn="evolveBehavior"),
    dict(pkg="pattern-engine", iface="Pattern", idf="patternId",
         f1="structure", f2="dynamics", graph="patternGraph",
         f1_file="structure.ts", f1_fn="buildStructure", f1_arg="behavior",
         f1_k1="behaviorStructure", f1_v1="behavior.pattern", f1_k2="dynamicsStructure", f1_v2="behavior.dynamics",
         f2_file="dynamics.ts", f2_fn="buildPatternDynamics", f2_arg="structure",
         sk="structuralPatternDynamics", deep="structure.behaviorStructure.actionPattern.taskMotion.functionAction.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="patterned", sa="dispersed",
         hk="harmonyPatternDynamics", prev='structure.dynamicsStructure.harmonyBehaviorDynamics === "coherent"', hv="stable", ha="unstable",
         g_file="pattern-graph.ts", g_fn="buildPatternGraph", n1="structure", n2="dynamics", rel="shapes",
         env_file="pattern-envelope.ts", env_fn="buildPatternEnvelope", evolve=True, ev_fn="evolvePattern"),
    dict(pkg="structure-engine", iface="Structure", idf="structureId",
         f1="formation", f2="dynamics", graph="structureGraph",
         f1_file="formation.ts", f1_fn="buildFormation", f1_arg="pattern",
         f1_k1="patternFormation", f1_v1="pattern.structure", f1_k2="dynamicsFormation", f1_v2="pattern.dynamics",
         f2_file="dynamics.ts", f2_fn="buildStructuralDynamics", f2_arg="formation",
         sk="structuralStructuralDynamics", deep="formation.patternFormation.behaviorStructure.actionPattern.taskMotion.functionAction.roleExecution.characterFunction.personaFormation.identityModel." + CORE,
         sv="structured", sa="collapsed",
         hk="harmonyStructuralDynamics", prev='formation.dynamicsFormation.harmonyPatternDynamics === "stable"', hv="coherent", ha="unstable",
         g_file="structure-graph.ts", g_fn="buildStructureGraph", n1="formation", n2="dynamics", rel="stabilizes",
         env_file="structure-envelope.ts", env_fn="buildStructureEnvelope", evolve=True, ev_fn="evolveStructure"),
]

for e in ENGINES:
    base = "packages/" + e["pkg"] + "/"
    model_file = e["pkg"].replace("-engine", "") + "-model.ts"
    add(base + model_file, f"""
export interface {e['iface']} {{
  {e['idf']}: string;
  {e['f1']}: any;
  {e['f2']}: any;
  {e['graph']}: any;
  createdAt: number;
}}
""")
    add(base + e["f1_file"], f"""
export function {e['f1_fn']}({e['f1_arg']}) {{
  return {{
    {e['f1_k1']}: {e['f1_v1']},
    {e['f1_k2']}: {e['f1_v2']},
    timestamp: Date.now()
  }};
}}
""")
    add(base + e["f2_file"], f"""
export function {e['f2_fn']}({e['f2_arg']}) {{
  return {{
    {e['sk']}:
      {e['deep']} === "open"
        ? "{e['sv']}"
        : "{e['sa']}",
    {e['hk']}: {e['prev']} ? "{e['hv']}" : "{e['ha']}",
    checksum: Math.random().toString(36).slice(2)
  }};
}}
""")
    add(base + e["g_file"], f"""
export function {e['g_fn']}(dynamics) {{
  return {{
    nodes: [
      {{ id: "{e['n1']}", weight: dynamics.{e['sk']} === "{e['sv']}" ? 1 : 0 }},
      {{ id: "{e['n2']}", weight: dynamics.{e['hk']} === "{e['hv']}" ? 1 : 0 }}
    ],
    edges: [
      {{ from: "{e['n1']}", to: "{e['n2']}", relation: "{e['rel']}" }}
    ]
  }};
}}
""")
    inst = e["iface"].lower() if e["iface"] != "Func" else "func"
    add(base + e["env_file"], f"""
export function {e['env_fn']}({inst}) {{
  return {{
    {e['idf']}: {inst}.{e['idf']},
    {e['f1']}: {inst}.{e['f1']},
    {e['f2']}: {inst}.{e['f2']},
    {e['graph']}: {inst}.{e['graph']},
    timestamp: Date.now()
  }};
}}
""")
    if e.get("evolve"):
        add(base + "evolve.ts", f"""
export function {e['ev_fn']}({inst}) {{
  return {{
    {e['idf']}: {inst}.{e['idf']},
    evolutionScore: Math.random(),
    evolvedAt: Date.now()
  }};
}}
""")

# ================= apps: engine-server / gateway-server / public-api =================
for name, ev_fn, pkg in [("behavior", "evolveBehavior", "behavior-engine"),
                         ("pattern", "evolvePattern", "pattern-engine"),
                         ("structure", "evolveStructure", "structure-engine")]:
    cap = name.capitalize()
    add(f"apps/engine-server/{name}-execute.ts", f"""
import {{ {ev_fn} }} from "../../packages/{pkg}/evolve";

export async function execute{cap}({name}, input) {{
  const evolution = {ev_fn}({name});

  return {{
    {name}Id: {name}.{name}Id,
    evolution,
    output: `{cap} processed: ${{input}}`
  }};
}}
""")
    add(f"apps/public-api/{name}.ts", f"""
import {{ execute{cap} }} from "../../apps/engine-server/{name}-execute";

export async function {name}(req, res) {{
  const {name} = req.{name};
  const input = req.body.input;

  const result = await execute{cap}({name}, input);

  res.json(result);
}}
""")
    add(f"studio/src/components/{cap}Viewer.tsx", f"""
import {{ useEffect, useState }} from "react";
import {{ useFrasbergClient }} from "../hooks/useFrasbergClient";

export default function {cap}Viewer() {{
  const client = useFrasbergClient();
  const [result, setResult] = useState(null);

  useEffect(() => {{
    client.request("/v1/{name}", {{
      input: "hello {name}"
    }}).then(res => {{
      setResult(res.payload);
    }});
  }}, []);

  return (
    <div>
      <h3>{cap} Engine</h3>
      <pre>{{JSON.stringify(result, null, 2)}}</pre>
    </div>
  );
}}
""")
    add(f"studio/src/pages/{cap}.tsx", f"""
import {cap}Viewer from "../components/{cap}Viewer";

export default function {cap}() {{
  return (
    <div>
      <h1>Frasberg {cap} Engine</h1>
      <{cap}Viewer />
    </div>
  );
}}
""")

add("apps/gateway-server/middleware/behavior.ts", """
import crypto from "crypto";
import { buildPattern } from "../../../packages/behavior-engine/pattern";
import { buildBehaviorDynamics } from "../../../packages/behavior-engine/dynamics";
import { buildBehaviorGraph } from "../../../packages/behavior-engine/behavior-graph";

export function injectBehavior(req, res, next) {
  const action = req.action;

  const pattern = buildPattern(action);
  const dynamics = buildBehaviorDynamics(pattern);
  const graph = buildBehaviorGraph(dynamics);

  req.behavior = {
    behaviorId: crypto.randomUUID(),
    pattern,
    dynamics,
    behaviorGraph: graph,
    createdAt: Date.now()
  };

  next();
}
""")

add("apps/gateway-server/middleware/pattern.ts", """
import crypto from "crypto";
import { buildStructure } from "../../../packages/pattern-engine/structure";
import { buildPatternDynamics } from "../../../packages/pattern-engine/dynamics";
import { buildPatternGraph } from "../../../packages/pattern-engine/pattern-graph";

export function injectPattern(req, res, next) {
  const behavior = req.behavior;

  const structure = buildStructure(behavior);
  const dynamics = buildPatternDynamics(structure);
  const graph = buildPatternGraph(dynamics);

  req.pattern = {
    patternId: crypto.randomUUID(),
    structure,
    dynamics,
    patternGraph: graph,
    createdAt: Date.now()
  };

  next();
}
""")

add("apps/gateway-server/middleware/structure.ts", """
import crypto from "crypto";
import { buildFormation } from "../../../packages/structure-engine/formation";
import { buildStructuralDynamics } from "../../../packages/structure-engine/dynamics";
import { buildStructureGraph } from "../../../packages/structure-engine/structure-graph";

export function injectStructure(req, res, next) {
  const pattern = req.pattern;

  const formation = buildFormation(pattern);
  const dynamics = buildStructuralDynamics(formation);
  const graph = buildStructureGraph(dynamics);

  req.structure = {
    structureId: crypto.randomUUID(),
    formation,
    dynamics,
    structureGraph: graph,
    createdAt: Date.now()
  };

  next();
}
""")

add("apps/gateway-server/middleware/identity-structure-parallel.ts", """
// OPTION 1 — PARALLEL FLOW (chosen by MR).
// The existing pattern/structure pipeline stays primary and untouched.
// These engines run as a parallel enrichment chain BEFORE the existing
// identity middleware; x-owner-id enforcement remains authoritative.
import { injectBehavior } from "./behavior";
import { injectPattern } from "./pattern";
import { injectStructure } from "./structure";

export const injectIdentityStructureParallel = [
  injectBehavior,
  injectPattern,
  injectStructure
];

// Wiring (inside the checkout gateway):
//   app.use(injectIdentityStructureParallel);   // NEW PARALLEL FLOW
//   app.use(existingIdentityMiddleware);         // x-owner-id enforcement
//   app.use(existingPatternStructurePipeline);   // existing runtime behavior
""")

print(f"writing {len(FILES)} files under {ROOT} ...")
for rel, content in FILES.items():
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
print("done")
