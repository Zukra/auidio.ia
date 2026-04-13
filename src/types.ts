export type ApiRecord = Record<string, unknown>;

export type AudioProcessRequest = {
  file: File | null;
  typeTask: TaskType;
  userId?: string;
  callbackUrl?: string;
};

export type AudioUploadResponse = ApiRecord;
export type AudioProcessPayload = ApiRecord;

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

export type AudioProcessResponse = ApiRecord;

export type LaunchMode = 'single' | 'batch' | 'history';

export type HistoryItem = Record<string, string>;

export type ExecutionState = {
  status: 'idle' | 'processing' | 'completed' | 'error';
  response: ApiRecord | null;
  errorMessage?: string;
};

export type AudioProcessStreamEvent = ApiRecord;
