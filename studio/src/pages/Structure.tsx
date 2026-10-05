import StructureViewer from '../components/StructureViewer';
import EngineResultViewer from '../components/EngineResultViewer';

export default function Structure() {
  return (
    <div>
      <h1>Frasberg Structure Engine</h1>
      <StructureViewer />
      <EngineResultViewer
        endpoint="/v1/engine-structure"
        input="hello structure"
        title="Structure Formation Engine"
      />
    </div>
  );
}
