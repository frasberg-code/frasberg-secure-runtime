import EngineResultViewer from './EngineResultViewer';

export default function IdentityViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/identity"
      input="hello identity"
      title="Identity Engine"
    />
  );
}
