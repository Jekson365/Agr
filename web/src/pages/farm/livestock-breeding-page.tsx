import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import {
  BREEDING_STATUS_LABEL_KEY,
  BreedingFormModal,
  type AnimalOption,
  type BreedingForm,
} from '@/components/farm/livestock/breeding/breeding-form-modal';
import { BreedingResultModal } from '@/components/farm/livestock/breeding/breeding-result-modal';
import '@/components/farm/livestock/breeding/breeding.css';
import { DateField } from '@/components/ui/date-field';
import { formatLocalizedIsoDay, todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { livestockImage } from '@/config/livestock-kinds';
import { ApiError, resolveAssetUrl } from '@/services/api-client';
import {
  createBreedingEvent,
  deleteBreedingEvent,
  getAllBreedingEvents,
  getBreedingEvents,
  recordBreedingResult,
  updateBreedingEvent,
} from '@/services/breeding-event-service';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestock, getLivestockItem } from '@/services/livestock-service';
import { BREEDING_STATUSES, type BreedingEvent, type BreedingResultInput, type BreedingStatus } from '@/types/breeding-event';
import type { Livestock } from '@/types/livestock';

/** Badge colour per stage — the class names are the statuses in kebab-case. */
const STATUS_CLASS: Record<BreedingStatus, string> = {
  Breeding: 'breeding',
  PregnancyConfirmed: 'pregnancy-confirmed',
  Completed: 'completed',
  Failed: 'failed',
};

function emptyForm(): BreedingForm {
  return {
    maleAnimalId: null,
    femaleAnimalId: null,
    breedingDate: todayIsoDate(),
    comment: '',
    status: 'Breeding',
  };
}

/**
 * Breeding for one livestock group: the pairings recorded from it, and the form that adds one.
 *
 * The two pickers offer individual animals rather than groups — a group has no gender, and a herd
 * does not breed as a unit. They are drawn from every group on the farm that has animals recorded,
 * not just this one, because a sire is routinely kept apart from the females he serves.
 */
export function LivestockBreedingPage() {
  const { t, language } = useLanguage();
  const { livestockId: livestockIdParam } = useParams<{ livestockId: string }>();
  const livestockId = Number(livestockIdParam);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [events, setEvents] = useState<BreedingEvent[]>([]);
  const [animals, setAnimals] = useState<AnimalOption[]>([]);
  /** Every event on the farm, for working out which females are already spoken for. The table
   *  below still shows this group's events only. */
  const [allEvents, setAllEvents] = useState<BreedingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BreedingEvent | null>(null);
  const [form, setForm] = useState<BreedingForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);
  /** The row currently being saved from its own controls, which are disabled while it is. */
  const [savingId, setSavingId] = useState<number | null>(null);
  /** Comments as typed, by event id. A row falls back to the stored comment until it is touched,
   *  and its draft is dropped once the save lands or fails. */
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  /** The stage a row is being moved to, waiting on the day it happened. One at a time — the date
   *  question is the answer to a click, and two open at once would be two unfinished answers. */
  const [pendingStage, setPendingStage] = useState<{ eventId: number; status: BreedingStatus; date: string } | null>(
    null
  );
  /** Every group on the farm, so a result can be put into any of the parents' own kind. */
  const [groups, setGroups] = useState<Livestock[]>([]);
  /** The event whose result is being recorded. */
  const [resultFor, setResultFor] = useState<BreedingEvent | null>(null);
  const [resultSaving, setResultSaving] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);

  useEffect(() => {
    if (!livestockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [group, eventList, everyEvent, groups] = await Promise.all([
        getLivestockItem(livestockId),
        getBreedingEvents(livestockId),
        getAllBreedingEvents(),
        getLivestock(),
      ]);
      setLivestock(group);
      setEvents(eventList);
      setAllEvents(everyEvent);
      setCommentDrafts({});
      setPendingStage(null);

      // One call per group: the details endpoint answers for a single group only. A farm has a
      // handful of them, and this runs once per page load.
      const perGroup = await Promise.all(
        groups.map(async (item) => {
          try {
            const details = await getLivestockDetails(item.id);
            return details.map((detail) => ({ detail, groupName: item.name, groupType: item.type }));
          } catch {
            // One unreadable group should not empty both pickers.
            return [] as AnimalOption[];
          }
        })
      );
      setAnimals(perGroup.flat());
      setGroups(groups);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /**
   * Animals this group can be paired with: the same kind as its own. A chicken group offers
   * chickens, whatever other animals the farm keeps — they may live in different groups, which is
   * why this is not simply this group's own animals, but they are all the one kind.
   */
  const breedable = animals.filter((option) => option.groupType === livestock?.type);

  // Only animals whose gender is recorded can be offered: an animal of unknown sex belongs on
  // neither side of a pairing.
  const males = breedable.filter((option) => option.detail.gender === 'Male');
  const allFemales = breedable.filter((option) => option.detail.gender === 'Female');
  // Unfiltered on purpose: this only resolves codes for display, and an existing event may name
  // an animal that today's rule would not offer.
  const animalById = new Map(animals.map((option) => [option.detail.id, option]));

  /**
   * Females not already tied to an unfinished pairing. A female stays held from the moment she is
   * paired until that event completes or fails — waiting on the outcome counts as much as a
   * confirmed pregnancy, since re-pairing her in either state is the same mistake.
   *
   * The event being edited is excluded: it is allowed to be the one holding her, which is the case
   * whenever its own status or date is what is being changed. Drawn from every group's events, not
   * just this page's, because the pairing that holds her may have been recorded elsewhere. The
   * server refuses this too — two pages open at once would otherwise double-book her.
   */
  const heldFemaleIds = new Set(
    allEvents
      .filter(
        (item) =>
          item.id !== editingEvent?.id && (item.status === 'Breeding' || item.status === 'PregnancyConfirmed')
      )
      .map((item) => item.femaleAnimalId)
      .filter((id): id is number => id != null)
  );
  const females = allFemales.filter((option) => !heldFemaleIds.has(option.detail.id));

  function openAdd() {
    setEditingEvent(null);
    setForm(emptyForm());
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(item: BreedingEvent) {
    setEditingEvent(item);
    setForm({
      maleAnimalId: item.maleAnimalId,
      femaleAnimalId: item.femaleAnimalId,
      breedingDate: item.breedingDate.slice(0, 10),
      comment: item.comment ?? '',
      status: item.status,
    });
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    if (saving || form.maleAnimalId == null || form.femaleAnimalId == null) return;
    if (form.maleAnimalId === form.femaleAnimalId) {
      setFormError(t('breedingEvent.samePair'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingEvent) {
        const updated: BreedingEvent = {
          ...editingEvent,
          maleAnimalId: form.maleAnimalId,
          femaleAnimalId: form.femaleAnimalId,
          breedingDate: form.breedingDate,
          comment: form.comment.trim() || null,
          status: form.status,
        };
        await updateBreedingEvent(updated.id, updated);
      } else {
        await createBreedingEvent({
          livestockId,
          maleAnimalId: form.maleAnimalId,
          femaleAnimalId: form.femaleAnimalId,
          breedingDate: form.breedingDate,
          comment: form.comment.trim() || null,
          status: form.status,
          // The server owns these and rebuilds them from the status; sent null so the shape is
          // whole rather than to say anything.
          pregnancyConfirmedDate: null,
          completedDate: null,
          failedDate: null,
        });
      }
      setFormOpen(false);
      // Read back rather than patching in place: a status change stamps a stage date server-side,
      // and that date is not something this form can work out for itself.
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t('breedingEvent.femaleBusy')
          : err instanceof ApiError && err.status === 400
            ? t('breedingEvent.samePair')
            : err instanceof Error
              ? err.message
              : t('breedingEvent.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  /**
   * Saves one field of a record straight from its row.
   *
   * The row is patched in place rather than re-read: a stage change now carries the day it
   * happened, so what the server stores is exactly what was sent and there is nothing to learn
   * by asking for it back.
   */
  async function saveInline(item: BreedingEvent, changes: Partial<BreedingEvent>) {
    if (savingId != null) return;
    const updated: BreedingEvent = { ...item, ...changes };

    setSavingId(item.id);
    setError(null);
    try {
      await updateBreedingEvent(item.id, updated);
      const apply = (prev: BreedingEvent[]) => prev.map((row) => (row.id === item.id ? updated : row));
      setEvents(apply);
      setAllEvents(apply);
    } catch (err) {
      // Refusals land on the page rather than in a form — there is no form open to put them in.
      setError(
        err instanceof ApiError && err.status === 409 ? t('breedingEvent.femaleBusy') : t('breedingEvent.saveError')
      );
      // Put the row back to what the server still holds, so the control does not sit showing a
      // value that was never saved.
      setCommentDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  }

  /** Which stage date field a status writes to. Breeding writes back to the event's own
   *  breedingDate, which is that stage's date. */
  const STAGE_DATE_FIELD: Record<BreedingStatus, keyof BreedingEvent> = {
    Breeding: 'breedingDate',
    PregnancyConfirmed: 'pregnancyConfirmedDate',
    Completed: 'completedDate',
    Failed: 'failedDate',
  };

  /**
   * Opens the date question for a stage. Offers the date that stage already carries, so clicking
   * the stage an event is already at corrects its date rather than starting from today.
   */
  function openStageEdit(item: BreedingEvent, status: BreedingStatus) {
    const existing = item[STAGE_DATE_FIELD[status]] as string | null;
    setPendingStage({ eventId: item.id, status, date: existing?.slice(0, 10) ?? todayIsoDate() });
  }

  /** Saves the stage and the day it happened together — one is meaningless here without the other. */
  async function submitStage(item: BreedingEvent) {
    if (!pendingStage || pendingStage.eventId !== item.id || !pendingStage.date) return;
    const { status, date } = pendingStage;

    await saveInline(item, { status, [STAGE_DATE_FIELD[status]]: date } as Partial<BreedingEvent>);
    setPendingStage(null);
  }

  /** The comment as typed, saved only when it actually differs from the stored one. */
  async function saveComment(item: BreedingEvent) {
    const draft = commentDrafts[item.id];
    if (draft === undefined) return;

    const next = draft.trim() || null;
    if (next === (item.comment ?? null)) return;

    await saveInline(item, { comment: next });
  }

  async function confirmDeleteEvent() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteBreedingEvent(id);
      setEvents((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  /**
   * The animal's own photo, falling back to its kind's artwork — and to the generic animal mark
   * for one that is gone, where there is no kind left to fall back to either.
   */
  function animalImage(id: number | null): string {
    const option = id == null ? undefined : animalById.get(id);
    if (option?.detail.imagePath) return resolveAssetUrl(option.detail.imagePath);
    return livestockImage(option?.groupType ?? '');
  }

  /**
   * Records what a pairing produced. The offspring are individual animals in a group of the
   * parents' kind, each stamped with both parents by the server, and the group's head count rises
   * with them — the one path that grows a herd, where realization is the one that shrinks it.
   */
  async function submitResult(input: BreedingResultInput) {
    if (!resultFor) return;
    setResultSaving(true);
    setResultError(null);
    try {
      await recordBreedingResult(resultFor.id, input);
      setResultFor(null);
      // The receiving group's count changed, and it may well be this page's own.
      await load();
    } catch (err) {
      setResultError(err instanceof Error ? err.message : t('breedingEvent.saveError'));
    } finally {
      setResultSaving(false);
    }
  }

  /**
   * Where an animal's own page lives. Null for one that is gone — the event keeps its record of
   * the pairing, but there is nothing left to open.
   *
   * Built from the animal's own group, not the group this page is for: a sire kept in another
   * chicken group has his history there.
   */
  function animalHref(id: number | null): string | null {
    const option = id == null ? undefined : animalById.get(id);
    if (!option) return null;
    return `/farm/livestock/${option.detail.livestockId}/animal/${option.detail.id}`;
  }

  /** One parent as shown on a row: its picture and its tag, linked to its own page when it has
   *  one. Both sides render through this so they cannot drift apart. */
  function renderParent(id: number | null) {
    const href = animalHref(id);
    const content = (
      <>
        <img src={animalImage(id)} alt="" className="breeding-row-avatar" />
        {animalCode(id)}
      </>
    );

    return href ? (
      <Link to={href} className="breeding-row-parent link">
        {content}
      </Link>
    ) : (
      <span className="breeding-row-parent">{content}</span>
    );
  }

  /** An animal's code, or a stand-in once the animal itself has been removed. */
  function animalCode(id: number | null): string {
    if (id == null) return t('breedingEvent.unknownAnimal');
    return animalById.get(id)?.detail.code ?? t('breedingEvent.unknownAnimal');
  }

  /** The dates the event has collected, each labelled with the stage it belongs to. */
  function stageDates(item: BreedingEvent): string[] {
    const stages: [BreedingStatus, string | null][] = [
      ['Breeding', item.breedingDate],
      ['PregnancyConfirmed', item.pregnancyConfirmedDate],
      ['Completed', item.completedDate],
      ['Failed', item.failedDate],
    ];
    return stages
      .filter(([, date]) => date != null)
      .map(([status, date]) => `${t(BREEDING_STATUS_LABEL_KEY[status])}: ${formatLocalizedIsoDay(date!, language)}`);
  }

  const noAnimals = males.length === 0 || females.length === 0;
  // Distinguishes "none recorded" from "all of them are already carrying".
  const allFemalesHeld = males.length > 0 && allFemales.length > 0 && females.length === 0;

  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            {t('farm.breeding')}
            {livestock ? ` · ${livestock.name}` : ''}
          </h1>
          {livestock && (
            <span className="page-header-count">
              {t('farm.count')}: {livestock.count}
            </span>
          )}
        </div>
        {/* A pairing needs one of each, so with either side empty there is nothing to record. */}
        <button type="button" className="add-button" onClick={openAdd} disabled={loading || noAnimals}>
          + {t('breedingEvent.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('breedingEvent.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          {noAnimals && (
            <p className="limit-hint">
              {allFemalesHeld ? t('breedingEvent.allFemalesBusy') : t('breedingEvent.noAnimals')}
            </p>
          )}

          {events.length === 0 ? (
            <p className="empty-state">{t('breedingEvent.empty')}</p>
          ) : (
            <div className="breeding-list">
              {events.map((item) => (
                <div key={item.id} className="breeding-row">
                  <div className="breeding-row-top">
                    <div className="breeding-row-main">
                      <div className="breeding-row-pair">
                        {/* The two parents, each shown as itself and each a way into its own
                            history. A pairing is between two particular animals, and a photo says
                            which far faster than a tag number does. */}
                        {renderParent(item.maleAnimalId)}
                        <span className="breeding-row-join">×</span>
                        {renderParent(item.femaleAnimalId)}
                        <span className={`breeding-status-badge ${STATUS_CLASS[item.status]}`}>
                          {t(BREEDING_STATUS_LABEL_KEY[item.status])}
                        </span>
                      </div>

                      {/* Every stage the event has been through, not just the one it is at. */}
                      <div className="breeding-row-meta">
                        {stageDates(item).map((label) => (
                          <span key={label}>{label}</span>
                        ))}
                      </div>
                    </div>

                    {/* Offered on every pairing rather than only a completed one: a result is
                        what moves it to completed, and being made to set the stage first would be
                        a step in the wrong order. */}
                    <button type="button" className="secondary-button" onClick={() => setResultFor(item)}>
                      {t('breedingEvent.result')}
                    </button>

                    <CardMenu
                      onEdit={() => openEdit(item)}
                      onDelete={() =>
                        setConfirmDelete({
                          id: item.id,
                          label: `${animalCode(item.maleAnimalId)} × ${animalCode(item.femaleAnimalId)}`,
                        })
                      }
                    />
                  </div>

                  {/* Every stage on the row, the one it is at marked. Picking one asks for the day
                      it happened rather than assuming today — a pregnancy is confirmed in the
                      barn and recorded later — so nothing is saved until that is answered. */}
                  <div className="breeding-row-stages">
                    {BREEDING_STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className={`breeding-stage-chip ${STATUS_CLASS[status]}${status === item.status ? ' active' : ''}`}
                        disabled={savingId === item.id}
                        onClick={() => openStageEdit(item, status)}
                      >
                        {t(BREEDING_STATUS_LABEL_KEY[status])}
                      </button>
                    ))}
                  </div>

                  {pendingStage?.eventId === item.id && (
                    <div className="breeding-stage-form">
                      <span className="breeding-stage-form-label">
                        {t(BREEDING_STATUS_LABEL_KEY[pendingStage.status])}
                      </span>
                      <DateField
                        value={pendingStage.date}
                        onChange={(value) =>
                          setPendingStage((prev) => (prev ? { ...prev, date: value ?? '' } : prev))
                        }
                        clearable={false}
                      />
                      <button
                        type="button"
                        className="add-button"
                        disabled={savingId === item.id || !pendingStage.date}
                        onClick={() => submitStage(item)}
                      >
                        {t('common.save')}
                      </button>
                      <button type="button" className="retry-button" onClick={() => setPendingStage(null)}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  )}

                  <div className="breeding-row-edit">
                    <input
                      value={commentDrafts[item.id] ?? item.comment ?? ''}
                      disabled={savingId === item.id}
                      placeholder={t('breedingEvent.commentPlaceholder')}
                      aria-label={t('breedingEvent.comment')}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onBlur={() => saveComment(item)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <BreedingResultModal
        open={resultFor != null}
        groups={groups.filter((group) => group.type === livestock?.type)}
        saving={resultSaving}
        error={resultError}
        onClose={() => setResultFor(null)}
        onSubmit={submitResult}
      />

      <BreedingFormModal
        open={formOpen}
        isEditing={editingEvent != null}
        form={form}
        males={males}
        females={females}
        saving={saving}
        error={formError}
        onFormChange={setForm}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteEvent}
      />
    </div>
  );
}
