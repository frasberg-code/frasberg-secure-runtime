import EngineResultViewer from './EngineResultViewer';

export default function CharacterViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/character"
      input="hello character"
      title="Character Engine"
    />
  );
}
