import EngineResultViewer from './EngineResultViewer';

export default function RoleViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/role"
      input="hello role"
      title="Role Engine"
    />
  );
}
