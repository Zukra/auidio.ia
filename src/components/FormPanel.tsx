import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectLabel, SelectGroup, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, LoaderCircle, Play, Trash2, Upload } from 'lucide-react';
import { FileChip } from '@/components/FileChip';
import { FieldBlock } from '@/components/FieldBlock';

const launchModes = [
  { value: 'single', label: 'Запустить один раз' },
  { value: 'batch', label: 'Запустить пакетно' },
] as const;

const taskOptions: { value: TaskType; label: string }[] = [
  { value: 'summary', label: 'summary' },
  { value: 'transcription', label: 'transcription' },
  { value: 'transcription & summary', label: 'transcription & summary' },
];

const initialRequest: AudioProcessRequest = {
  file: null,
  typeTask: 'summary',
  userId: '',
  callbackUrl: '',
};

type FormPanelProps = {
  onRun: (request: AudioProcessRequest) => void | Promise<void>;
  isProcessing: boolean;
  initialValue?: Partial<AudioProcessRequest>;
};

function formatFile(file: File | null): FileView | null {
  if (!file) {
    return null;
  }

  const parts = file.name.split('.');
  const extension = parts.length > 1 ? parts.at(-1)?.toUpperCase() ?? 'FILE' : 'FILE';
  const sizeLabel = `${(file.size / 1024).toFixed(2)} KB`;

  return {
    name: file.name,
    extension,
    sizeLabel,
  };
}

export const FormPanel = ({ onRun, isProcessing, initialValue }: FormPanelProps) => {
  const [launchMode, setLaunchMode] = useState<(typeof launchModes)[number]['value']>('single');
  const [request, setRequest] = useState<AudioProcessRequest>({ ...initialRequest, ...initialValue });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileView = useMemo(() => formatFile(request.file), [request.file]);

  const handleTextField = (field: 'userId' | 'callbackUrl') => (event: ChangeEvent<HTMLInputElement>) => {
    setRequest((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setRequest((current) => ({ ...current, file: nextFile }));
  };

  const handleFileRemove = () => {
    setRequest((current) => ({ ...current, file: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setRequest({ ...initialRequest, ...initialValue });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full min-w-0 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
      <CardContent className="flex h-full flex-col gap-6 p-4">
        <Tabs value={launchMode} onValueChange={(value) => setLaunchMode(value as (typeof launchModes)[number]['value'])} className="gap-6">
          <TabsList variant="line" className="">
            {launchModes.map((mode) => (
              <TabsTrigger key={mode.value} value={mode.value} className="">
                {mode.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={launchModes[0].value} className="mt-0 flex-1">
            <div className="space-y-2">
              <div className="space-y-2">
                <Label htmlFor="audio-file" className="text-base font-semibold text-slate-900 dark:text-white">audio_file</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 justify-center rounded-2xl border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    Локальная загрузка
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 justify-center rounded-2xl border-slate-200 bg-white/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200"
                  >
                    <Link2 className="size-4" />
                    Cсылка на файл
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  id="audio-file"
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileChip fileView={fileView} onRemove={handleFileRemove} />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-semibold text-slate-900 dark:text-white">
                  type_task
                </Label>
                <Select value={request.typeTask} onValueChange={(value) => setRequest((current) => ({ ...current, typeTask: value as TaskType }))}>
                  <SelectTrigger className="bg-white/80 text-slate-800 dark:bg-white/[0.03] dark:text-zinc-200">
                    <SelectValue placeholder="Выберите сценарий" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 bg-white/95 text-slate-800 dark:border-white/10 dark:bg-[#171c29]/95 dark:text-zinc-100">
                    {taskOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="rounded-xl">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <FieldBlock label="user_id" hint="необязательно">
                <Input
                  value={request.userId}
                  onChange={handleTextField('userId')}
                  placeholder="user_id"
                  className="bg-white/80 text-slate-800 placeholder:text-slate-400 dark:bg-white/[0.03] dark:text-zinc-200 dark:placeholder:text-zinc-600"
                />
              </FieldBlock>

              <FieldBlock label="callback_url" hint="необязательно">
                <Input
                  value={request.callbackUrl}
                  onChange={handleTextField('callbackUrl')}
                  placeholder="callback_url"
                  className="bg-white/80 text-slate-800 placeholder:text-slate-400 dark:bg-white/[0.03] dark:text-zinc-200 dark:placeholder:text-zinc-600"
                />
              </FieldBlock>

              <div className="mt-auto flex flex-col items-stretch justify-between gap-6 pt-4 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-2xl border-slate-200 bg-white/80 px-5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-white/8 dark:bg-white/[0.03] dark:text-zinc-300 dark:hover:bg-white/[0.05] dark:hover:text-white"
                  onClick={handleClear}
                >
                  <Trash2 className="size-4" />
                  Очистить
                </Button>

                <Button
                  type="button"
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-white hover:bg-blue-500"
                  onClick={() => onRun(request)}
                  disabled={isProcessing}
                >
                  {isProcessing ?
                    <LoaderCircle className="size-4 animate-spin" /> :
                    <Play className="size-4" data-icon="inline-start" />
                  }
                  Выполнить
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value={launchModes[1].value} className="mt-0 flex-1">
            <div className="flex min-h-svh p-6">
              <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
                <div>
                  <h1 className="font-medium">Project ready!</h1>
                  <p>You may now add components and start building.</p>
                  <p>We&apos;ve already added the button component for you.</p>
                  <Button className="mt-2">Button</Button>
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  (Press <kbd>d</kbd> to toggle dark mode)
                </div>

                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Fruits</SelectLabel>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
