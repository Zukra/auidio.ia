import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AudioProcessRequest, FormRunPayload, HistorySelection, HistoryTaskItem, LaunchMode } from '@/types';
import { BatchFiles } from '@/components/batch-files';
import { History } from '@/components/history';
import { SingleFile } from '@/components/single-file';

const launchModes = [
  { value: 'single', label: 'Запустить один раз' },
  { value: 'batch', label: 'Запустить пакетно' },
  { value: 'history', label: 'Запросы' },
] as const;

type FormPanelProps = {
  onRun: (runPayload: FormRunPayload) => void | Promise<void>;
  isProcessing: boolean;
  initialValue?: Partial<AudioProcessRequest>;
  launchMode: LaunchMode;
  onLaunchModeChange: (value: LaunchMode) => void;
  historyItems: HistoryTaskItem[];
  isHistoryLoading: boolean;
  historyErrorMessage: string;
  selectedHistorySelection: HistorySelection | null;
  onHistorySelect: (selection: HistorySelection) => void;
};

export const FormPanel = ({
  onRun,
  isProcessing,
  initialValue,
  launchMode,
  onLaunchModeChange,
  historyItems,
  isHistoryLoading,
  historyErrorMessage,
  selectedHistorySelection,
  onHistorySelect,
}: FormPanelProps) => {
  return (
    <Card className="h-full min-h-0 w-full min-w-0 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
      <CardContent className="flex h-full flex-col gap-6 p-4">
        <Tabs value={launchMode} onValueChange={(value) => onLaunchModeChange(value as LaunchMode)} className="min-h-0 flex-1 gap-6">
          <TabsList variant="line" className="">
            {launchModes.map((mode) => (
              <TabsTrigger key={mode.value} value={mode.value} className="">
                {mode.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={launchModes[0].value} forceMount className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
            <SingleFile
              onRun={onRun}
              isProcessing={isProcessing}
              initialValue={initialValue}
            />
          </TabsContent>

          <TabsContent value={launchModes[1].value} forceMount className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
            <BatchFiles />
          </TabsContent>

          <TabsContent value={launchModes[2].value} forceMount className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden">
            <History
              items={historyItems}
              isLoading={isHistoryLoading}
              errorMessage={historyErrorMessage}
              selectedHistorySelection={selectedHistorySelection}
              onSelect={onHistorySelect}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
