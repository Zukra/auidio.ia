export type AudioProcessRequest = {
  file: File | null;
  typeTask: TaskType;
  userId?: string;
  callbackUrl?: string;
};

export type AudioUploadResponse = {
  id: string;
  name: string;
  size: number;
  extension: string;
  mime_type: string;
  created_by: string;
  created_at: number;
  preview_url: string | null;
  source_url: string;
};

export type AudioFileInput = {
  type: 'audio';
  transfer_method: 'local_file';
  url: '';
  upload_file_id: string;
};

export type AudioProcessPayload = {
  inputs: {
    audio_file: AudioFileInput;
    type_task: TaskType;
    user_id: string;
    callback_url: string;
  };
  response_mode: 'streaming';
};

export type FormRunPayload = {
  payload: AudioProcessPayload;
  upload: AudioUploadResponse;
};

export type FileView = {
  name: string;
  extension: string;
  sizeLabel: string;
};

export type TaskType = 'summary' | 'transcription' | 'transcription & summary';

export type ProcessingStepStatus = 'idle' | 'running' | 'success' | 'error';

export type ProcessingStep = {
  id: string;
  title: string;
  status: ProcessingStepStatus;
};

export type AudioProcessResponse = {
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

export type LaunchMode = 'single' | 'batch' | 'history';

export type HistoryItem = {
  id: string;
  requestId: string;
  fileName: string;
  processedAt: string;
  taskType: TaskType;
  result: string;
};

export type ExecutionState = {
  status: 'idle' | 'processing' | 'completed' | 'error';
  response: AudioProcessResponse | null;
  errorMessage?: string;
};

export type WorkflowStartedEvent = {
  type: 'workflow_started';
  requestId: string;
};

export type StepUpdateEvent = {
  type: 'step_update';
  step: ProcessingStep;
};

export type ResultEvent = {
  type: 'result';
  result: string;
  details: AudioProcessResponse['details'];
};

export type WorkflowCompletedEvent = {
  type: 'workflow_completed';
  requestId: string;
};

export type WorkflowErrorEvent = {
  type: 'error';
  message: string;
};

export type AudioProcessStreamEvent =
  | WorkflowStartedEvent
  | StepUpdateEvent
  | ResultEvent
  | WorkflowCompletedEvent
  | WorkflowErrorEvent;
