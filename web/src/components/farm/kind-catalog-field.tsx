import { useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { kindDeleteMessage } from '@/components/farm/kind-delete-message';
import { KindDropdown } from '@/components/farm/kind-dropdown';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';

/** A row of one of the kind catalogs (stock kinds, fruit kinds) — both are just an id and a name. */
export type CatalogKind = { id: number; name: string };

/**
 * Everything that differs between one kind catalog and the next: where its rows come from, and how
 * a name becomes a label and an icon. Declare it once per catalog as a module constant, so the
 * field's load effect isn't chasing a new object every render.
 */
export type KindCatalog = {
  list: () => Promise<CatalogKind[]>;
  create: (name: string) => Promise<CatalogKind>;
  remove: (id: number) => Promise<void>;
  /** Built-in kinds are stored under an English key and shown translated; a user-added one shows
   *  the name it was created with. */
  label: (name: string, t: (key: string) => string) => string;
  icon: (name: string) => string;
  /** Whether a kind is one of the seeded built-ins. Those are offered but never deletable. */
  isBuiltIn: (name: string) => boolean;
};

type Props = {
  /** Reloads the catalog whenever this flips true — i.e. when the form it sits in opens. */
  open: boolean;
  catalog: KindCatalog;
  /** The selected kind's name. Owned by the form, since saving needs it. */
  value: string;
  onChange: (name: string) => void;
  /** Kept selected when the form opens; with none, the catalog's first kind is chosen. */
  preset: string | null;
  labelText: string;
  addPlaceholder: string;
  /**
   * How the catalog is offered. 'chips' — the default — lays every kind out at once, which suits a
   * short catalog. 'dropdown' is one field tall with a search box, for catalogs the user keeps
   * adding to until scanning a chip row stops being quicker than typing.
   */
  variant?: 'chips' | 'dropdown';
  /** Whether the catalog may be added to from the form. Defaults to true; the stock form passes
   *  false, leaving the field a picker over a settled list. */
  allowAdd?: boolean;
};

/**
 * The "what kind is it?" field shared by the stock and fruit forms: a picker over a catalog that
 * can also be added to and deleted from without leaving the form. The two catalogs behave
 * identically — same duplicate rules, same conflict handling, same "don't leave the form pointing
 * at a deleted kind" — so they differ only by the {@link KindCatalog} passed in.
 */
export function KindCatalogField({
  open,
  catalog,
  value,
  onChange,
  preset,
  labelText,
  addPlaceholder,
  variant = 'chips',
  allowAdd = true,
}: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<CatalogKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset]);

  async function load() {
    setLoading(true);
    try {
      const list = await catalog.list();
      setKinds(list);
      if (!preset) {
        onChange(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(name: string): Promise<KindOption | null> {
    setError(null);

    // A name is a duplicate if it matches an existing kind's raw name OR its localized label —
    // built-in kinds are stored under English keys ("Milk") but displayed translated ("რძე"),
    // and either spelling would show up as a second identical entry in the picker.
    const candidate = name.trim().toLowerCase();
    const isDuplicate = kinds.some((kind) => {
      const label = catalog.label(kind.name, t);
      return kind.name.toLowerCase() === candidate || label.toLowerCase() === candidate;
    });
    if (isDuplicate) {
      setError(t('farm.typeDuplicate'));
      return null;
    }

    try {
      const created = await catalog.create(name);
      setKinds((prev) => (prev.some((kind) => kind.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: catalog.label(created.name, t) };
    } catch (err) {
      // The server rejects names that already exist (e.g. added from another session).
      setError(err instanceof ApiError && err.status === 409 ? t('farm.typeDuplicate') : t('farm.typeSaveError'));
      return null;
    }
  }

  async function confirmDeleteNow() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;

    setError(null);
    try {
      await catalog.remove(id);
      const deleted = kinds.find((kind) => kind.id === id);
      const next = kinds.filter((kind) => kind.id !== id);
      setKinds(next);
      // Don't leave the form pointing at a kind that no longer exists.
      if (deleted && deleted.name === value) {
        onChange(next[0]?.name ?? '');
      }
    } catch (err) {
      setError(kindDeleteMessage(err, t));
    } finally {
      setConfirmDelete(null);
    }
  }

  /* The two forms take the same props and do the same three things, so which one renders is the
     only difference between the variants. */
  const Picker = variant === 'dropdown' ? KindDropdown : KindPicker;

  return (
    <div className="field">
      <label>{labelText}</label>
      <Picker
        options={kinds.map((kind) => ({
          value: kind.name,
          label: catalog.label(kind.name, t),
          icon: catalog.icon(kind.name),
          removable: !catalog.isBuiltIn(kind.name),
        }))}
        selected={value}
        onSelect={onChange}
        onAddNew={handleAdd}
        addPlaceholder={addPlaceholder}
        allowAdd={allowAdd}
        loading={loading}
        onRemove={(name) => {
          const kind = kinds.find((k) => k.name === name);
          if (kind) setConfirmDelete({ id: kind.id, label: catalog.label(kind.name, t) });
        }}
        removeLabel={t('common.delete')}
      />
      {error && <div className="error-banner">{error}</div>}

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteNow}
      />
    </div>
  );
}
