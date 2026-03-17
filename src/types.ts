type AudioProcessRequest = {
  file: File | null;
  typeTask: TaskType;
  userId?: string;
  callbackUrl?: string;
};

type FileView = {
  name: string;
  extension: string;
  sizeLabel: string;
};

type TaskType = 'summary' | 'transcription' | 'transcription & summary';

type ProcessingStepStatus = 'idle' | 'running' | 'success' | 'error';

type ProcessingStep = {
  id: string;
  title: string;
  status: ProcessingStepStatus;
};

type AudioProcessResponse = {
  requestId: string;
  steps: ProcessingStep[];
  result: string;
  details: {
    taskType: TaskType;
    callbackUrl?: string;
    userId?: string;
    fileName?: string;
    fileSizeKb?: number;
    finishedAt: string;
  };
};

type ExecutionState = {
  status: 'idle' | 'processing' | 'completed';
  response: AudioProcessResponse | null;
};

