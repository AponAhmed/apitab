import { useEffect, useState } from 'react';
import { useCollectionStore } from '@/stores/collectionStore';
import { useRequestStore } from '@/stores/requestStore';
import { useDialogStore } from '@/stores/dialogStore';
import { toast } from '@/stores/toastStore';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

const NEW = '__new__';

export function SaveRequestDialog() {
  const open = useDialogStore((s) => s.saveRequestOpen);
  const close = useDialogStore((s) => s.closeSaveRequest);
  const collections = useCollectionStore((s) => s.collections);
  const createCollection = useCollectionStore((s) => s.createCollection);
  const saveToCollection = useRequestStore((s) => s.saveToCollection);
  const requestName = useRequestStore((s) => s.request.name);

  const [name, setName] = useState('');
  const [collectionId, setCollectionId] = useState<string>(NEW);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(requestName || 'Untitled Request');
    setCollectionId(collections[0]?.id ?? NEW);
    setNewCollectionName('');
  }, [open, requestName, collections]);

  const isNew = collectionId === NEW;
  const canSave = name.trim() !== '' && (!isNew || newCollectionName.trim() !== '');

  const submit = () => {
    if (!canSave) return;
    let targetId = collectionId;
    if (isNew) targetId = createCollection(newCollectionName).id;
    saveToCollection(targetId, name);
    toast.success('Request saved');
    close();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Save Request"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!canSave}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Request name
          </span>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
            Collection
          </span>
          <Select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW}>+ New collection…</option>
          </Select>
        </label>

        {isNew && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
              New collection name
            </span>
            <Input
              value={newCollectionName}
              placeholder="My Collection"
              onChange={(e) => setNewCollectionName(e.target.value)}
            />
          </label>
        )}
      </form>
    </Modal>
  );
}
