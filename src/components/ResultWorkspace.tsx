import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Copy, Waves } from 'lucide-react';

import { OutputBox } from '@/components/OutputBox';
import { ProcessStepRow } from '@/components/ProcessStepRow';
import type { ExecutionState, ProcessingStep } from '@/types';

type ResultWorkspaceProps = {
  execution: ExecutionState;
  steps: ProcessingStep[];
};

export const ResultWorkspace = ({ execution, steps }: ResultWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState('result');

  const details = execution.response?.details
    ? JSON.stringify(execution.response.details, null, 2)
    : execution.status === 'error'
      ? JSON.stringify({ status: 'error', message: execution.errorMessage }, null, 2)
      : '{\n  "status": "idle"\n}';

  return (
    <div className="min-w-0 flex flex-col gap-2">
      <Card className="overflow-hidden border-emerald-200 bg-[linear-gradient(180deg,rgba(240,253,250,0.98)_0%,rgba(236,253,245,0.96)_100%)] dark:border-emerald-500/18 dark:bg-[linear-gradient(180deg,rgba(37,54,48,0.92)_0%,rgba(18,24,32,0.96)_100%)]">
        <CardContent className="p-4">
          <Accordion type="single" collapsible defaultValue="workflow-steps">
            <AccordionItem value="workflow-steps" className="border-none">
              <AccordionTrigger className="mb-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 hover:no-underline dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <Waves className="size-4" />
                  <span>Этапы рабочего процесса</span>
                </div>
              </AccordionTrigger>
              <AccordionContent key={`workflow-steps-${steps.length}`} className="pb-0">
                {steps.length > 0 ? (
                  <div className="space-y-1">
                    {steps.map((step) => (
                      <ProcessStepRow key={step.id} step={step} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-emerald-200/80 bg-white/60 px-4 py-5 text-sm text-slate-500 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-500">
                    Этапы появятся после старта обработки.
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card className="flex-1 border-slate-200/80 bg-white/70 dark:border-white/8 dark:bg-white/[0.025]">
        <CardContent className="flex h-full flex-col p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-white/8">
              <TabsList variant="line" className="">
                <TabsTrigger value="result" className="">
                  РЕЗУЛЬТАТ
                </TabsTrigger>
                <TabsTrigger value="details" className="">
                  ДЕТАЛИ
                </TabsTrigger>
              </TabsList>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-500 dark:hover:bg-white/[0.05] dark:hover:text-white"
                onClick={() => navigator.clipboard.writeText(activeTab === 'result' ? execution.response?.result ?? '' : details)}
              >
                <Copy className="size-4" />
              </Button>
            </div>

            <TabsContent value="result" className="mt-0 flex-1">
              <OutputBox>
                <p className="mb-3 text-sm text-slate-500 dark:text-zinc-500">
                  {execution.response?.requestId ?? 'Ожидание запуска задачи'}
                </p>
                <p className="leading-8 text-slate-800 dark:text-zinc-100">
                  {execution.status === 'processing'
                    ? execution.response?.result ?? 'Идет потоковая обработка через API. Статусы шагов и итоговый результат появятся по мере поступления событий.'
                    : execution.status === 'error'
                      ? execution.errorMessage ?? 'Во время обработки произошла ошибка.'
                      : execution.response?.result ?? 'Загрузите файл и нажмите "Выполнить", чтобы увидеть итоговый результат обработки.'}
                </p>
              </OutputBox>
            </TabsContent>

            <TabsContent value="details" className="mt-0 flex-1">
              <OutputBox>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7 text-slate-700 dark:text-zinc-200">{details}</pre>
              </OutputBox>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
