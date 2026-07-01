import { useState } from 'react';
import { useRequestStore } from '@/stores/requestStore';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/utils/cn';

type SubTab = 'pre' | 'post';

const SNIPPETS: Record<SubTab, { label: string; code: string }[]> = {
  pre: [
    { label: 'Set variable', code: 'pm.environment.set("key", "value");' },
    { label: 'Timestamp', code: 'pm.environment.set("timestamp", Date.now());' },
    { label: 'Random id', code: 'pm.environment.set("id", crypto.randomUUID());' },
  ],
  post: [
    {
      label: 'Status is 200',
      code: 'pm.test("Status is 200", () => {\n  pm.expect(pm.response.code).to.equal(200);\n});',
    },
    {
      label: 'Save token',
      code: 'const data = pm.response.json();\npm.environment.set("token", data.token);',
    },
    {
      label: 'Has property',
      code: 'pm.test("Body has id", () => {\n  pm.expect(pm.response.json()).to.have.property("id");\n});',
    },
    {
      label: 'Response time',
      code: 'pm.test("Under 500ms", () => {\n  pm.expect(pm.response.responseTime).to.be.below(500);\n});',
    },
  ],
};

const PLACEHOLDER: Record<SubTab, string> = {
  pre: '// Runs before the request is sent.\n// Use pm.environment.set(...) to prepare variables.',
  post: '// Runs after the response arrives.\n// Use pm.test(...) and pm.expect(...) to write tests.',
};

export function ScriptsTab() {
  const [sub, setSub] = useState<SubTab>('pre');
  const preRequest = useRequestStore((s) => s.request.scripts.preRequest);
  const postResponse = useRequestStore((s) => s.request.scripts.postResponse);
  const setPre = useRequestStore((s) => s.setPreRequestScript);
  const setPost = useRequestStore((s) => s.setPostResponseScript);

  const value = sub === 'pre' ? preRequest : postResponse;
  const setValue = sub === 'pre' ? setPre : setPost;

  const insert = (code: string) => {
    setValue(value.trim() === '' ? code : `${value.replace(/\s+$/, '')}\n\n${code}`);
  };

  const items: { id: SubTab; label: string; active: boolean }[] = [
    { id: 'pre', label: 'Pre-request', active: preRequest.trim() !== '' },
    { id: 'post', label: 'Post-response', active: postResponse.trim() !== '' },
  ];

  return (
    <div className="flex h-full">
      <div className="w-36 shrink-0 space-y-0.5 border-r border-slate-200 p-1.5 dark:border-slate-800">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setSub(it.id)}
            className={cn(
              'flex w-full items-center justify-between gap-1 rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors',
              sub === it.id
                ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            <span className="truncate">{it.label}</span>
            {it.active && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
          </button>
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Insert:</span>
          {SNIPPETS[sub].map((s) => (
            <button
              key={s.label}
              onClick={() => insert(s.code)}
              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {s.label}
            </button>
          ))}
        </div>
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PLACEHOLDER[sub]}
          className="min-h-[180px] flex-1"
        />
        <p className="text-[11px] text-slate-400">
          JavaScript with <code className="font-mono">pm</code> (environment, response, test, expect)
          and <code className="font-mono">console</code>. Runs in a sandbox.
        </p>
      </div>
    </div>
  );
}
