import { cn } from '@/utils/cn';

/** Renders the actual extension icon so the in-app logo always matches it. */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={browser.runtime.getURL('/icon/128.png')}
      alt="ApiTab"
      draggable={false}
      className={cn('shrink-0 select-none rounded-md', className)}
    />
  );
}
