import EngineResultViewer from './EngineResultViewer';

export default function FunctionViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/function"
      input="hello function"
      title="Function Engine"
    />
  );
}
