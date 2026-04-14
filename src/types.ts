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

export type HistoryResultItem = {
  id: number;
  taskId: number;
  file: string;
  result: string;
  updatedAt: string;
};

export type HistoryTaskItem = {
  id: number;
  userId: number;
  name: string;
  taskType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  errorMessage: string | null;
  results: HistoryResultItem[];
};

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
  response: ApiRecord | null;
  errorMessage?: string;
};

export type AudioProcessStreamEvent = ApiRecord;
