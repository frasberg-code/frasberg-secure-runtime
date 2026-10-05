import EngineResultViewer from './EngineResultViewer';

export default function TaskViewer() {
  return (
    <EngineResultViewer
      endpoint="/v1/task"
      input="hello task"
      title="Task Engine"
    />
  );
}
