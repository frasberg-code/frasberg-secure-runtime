import PatternViewer from '../components/PatternViewer';
import EngineResultViewer from '../components/EngineResultViewer';

export default function Pattern() {
  return (
    <div>
      <h1>Frasberg Pattern Engine</h1>
      <PatternViewer />
      <EngineResultViewer
        endpoint="/v1/engine-pattern"
        input="hello pattern"
        title="Pattern Formation Engine"
      />
    </div>
  );
}
