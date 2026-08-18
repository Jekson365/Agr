import { useEffect, useState } from 'react';

import { KindDropdown } from '@/components/farm/kind-dropdown';
import { KindPicker, type KindOption } from '@/components/farm/kind-picker';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';

/** A row of one of the kind catalogs. `imagePath` is the picture a user gave their own kind;
 *  it is empty on the built-ins, which are drawn from artwork bundled with the app. */
export type CatalogKind = { id: number; name: string; imagePath: string };

/**
 * Everything that differs between one kind catalog and the next: where its rows come from, and how
 * a name becomes a label and an icon. Declare it once per catalog as a module constant, so the
 * field's load effect isn't chasing a new object every render.
 */
export type KindCatalog = {
  list: () => Promise<CatalogKind[]>;
  /** Uploads the picture, if one was chosen, then creates the kind carrying it. */
  create: (name: string, icon: File | null) => Promise<CatalogKind>;
  /** Built-in kinds are stored under an English key and shown translated; a user-added one shows
   *  the name it was created with. */
  label: (name: string, t: (key: string) => string) => string;
  /** Resolved from the kind rather than its name alone, so a kind added in this very form is
   *  drawn with its own picture before the icon registry has seen it. */
  icon: (kind: CatalogKind) => string;
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
 * The "what kind is it?" field shared by the stock, fruit and livestock forms: a picker over a
 * catalog that can also be added to without leaving the form. The catalogs behave identically —
 * same duplicate rules, same conflict handling — so they differ only by the {@link KindCatalog}
 * passed in.
 *
 * **A kind is never removed from here.** Everything recorded against one refers to it by name, so
 * a catalog only ever grows: what was once recorded stays nameable. The API still has a delete —
 * this field simply does not offer it.
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

  async function handleAdd(name: string, icon: File | null): Promise<KindOption | null> {
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
      const created = await catalog.create(name, icon);
      setKinds((prev) => (prev.some((kind) => kind.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: catalog.label(created.name, t), icon: catalog.icon(created) };
    } catch (err) {
      // The server rejects names that already exist (e.g. added from another session).
      setError(err instanceof ApiError && err.status === 409 ? t('farm.typeDuplicate') : t('farm.typeSaveError'));
      return null;
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
          icon: catalog.icon(kind),
        }))}
        selected={value}
        onSelect={onChange}
        onAddNew={handleAdd}
        addPlaceholder={addPlaceholder}
        iconLabel={t('farm.typeIcon')}
        allowAdd={allowAdd}
        loading={loading}
      />
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
