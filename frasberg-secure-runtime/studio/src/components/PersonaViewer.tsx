import EngineResultViewer from './EngineResultViewer';

export default function PersonaViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/persona"
      input="hello persona"
      title="Persona Engine"
    />
  );
}
