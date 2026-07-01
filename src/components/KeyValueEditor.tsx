import { useId } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Toggle } from './ui/Toggle';
import { IconButton } from './ui/IconButton';
import { VariableInput } from './VariableInput';
import type { KeyValue } from '@/types';

interface KeyValueEditorProps {
  rows: KeyValue[];
  onChange: (id: string, patch: Partial<KeyValue>) => void;
  onRemove: (id: string) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  keySuggestions?: string[];
  valueSuggestions?: string[];
  /** Highlight `{{variables}}` and show the hover editor (default true). */
  enableVariables?: boolean;
}

const inputClass =
  'h-8 w-full min-w-0 bg-transparent px-2 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-brand-50/50 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-brand-950/30';

function Cell({
  value,
  onChange,
  placeholder,
  listId,
  dim,
  borderL,
  enableVariables,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  listId?: string;
  dim: boolean;
  borderL?: boolean;
  enableVariables: boolean;
}) {
  const border = borderL ? 'border-l border-slate-200 dark:border-slate-800' : undefined;
  if (enableVariables) {
    return (
      <VariableInput
        variant="bare"
        value={value}
        onValueChange={onChange}
        placeholder={placeholder}
        list={listId}
        className={cn(border, dim && 'opacity-50')}
      />
    );
  }
  return (
    <input
      list={listId}
      value={value}
      placeholder={placeholder}
      spellCheck={false}
      autoComplete="off"
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputClass, 'font-mono', border, dim && 'opacity-50')}
    />
  );
}

export function KeyValueEditor({
  rows,
  onChange,
  onRemove,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  keySuggestions,
  valueSuggestions,
  enableVariables = true,
}: KeyValueEditorProps) {
  const keyListId = useId();
  const valueListId = useId();

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
      {keySuggestions && (
        <datalist id={keyListId}>
          {keySuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {valueSuggestions && (
        <datalist id={valueListId}>
          {valueSuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {rows.map((row, i) => {
        const isTrailing = i === rows.length - 1 && row.key === '' && row.value === '';
        const dim = !row.enabled && !isTrailing;
        return (
          <div
            key={row.id}
            className={cn(
              'grid grid-cols-[2.25rem_1fr_1fr_2.25rem] items-center',
              i > 0 && 'border-t border-slate-200 dark:border-slate-800',
            )}
          >
            <div className="grid place-items-center">
              <Toggle
                checked={row.enabled}
                onChange={(v) => onChange(row.id, { enabled: v })}
                aria-label="Toggle row"
                className={cn(isTrailing && 'opacity-0')}
              />
            </div>
            <Cell
              value={row.key}
              onChange={(v) => onChange(row.id, { key: v })}
              placeholder={keyPlaceholder}
              listId={keySuggestions ? keyListId : undefined}
              dim={dim}
              enableVariables={enableVariables}
            />
            <Cell
              value={row.value}
              onChange={(v) => onChange(row.id, { value: v })}
              placeholder={valuePlaceholder}
              listId={valueSuggestions ? valueListId : undefined}
              dim={dim}
              borderL
              enableVariables={enableVariables}
            />
            <div className="grid place-items-center">
              {!isTrailing && (
                <IconButton size="sm" onClick={() => onRemove(row.id)} aria-label="Remove row">
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
