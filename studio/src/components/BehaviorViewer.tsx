import EngineResultViewer from './EngineResultViewer';

export default function BehaviorViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/behavior"
      input="hello behavior"
      title="Behavior Engine"
    />
  );
}
