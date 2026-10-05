import EngineResultViewer from './EngineResultViewer';

export default function ActionViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/action"
      input="hello action"
      title="Action Engine"
    />
  );
}
