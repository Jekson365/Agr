import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { TerritoryMap, type PlantingLayer } from '@/components/farm/land/territory-map';
import { orchardColour } from '@/config/orchard-colours';
import { drawsRows } from '@/config/planting-patterns';
import { toOwnTerritories } from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';
import { OrchardList } from './orchard-list';
import { PatternControls } from './pattern-controls';
import { usePositioning } from './use-positioning';
import './positioning.css';

/**
 * Where an orchard's trees stand. Draw the shape of the ground it is planted on, pick how the
 * trees are set out on it, and the plan fills the outline — the farm's other land is drawn behind
 * it so the piece being marked reads as part of the whole.
 *
 * Nothing here moves a balance: it is a plan of where the trees are, not a record of trees.
 */
export function PositioningPage() {
  const { t } = useLanguage();
  const state = usePositioning();
  const { selected, plan, draft, boundary } = state;

  const drawn = boundary.length >= 3;
  const others = toOwnTerritories(state.farms);

  /** A third of the closer spacing, so trees read as separate at any sensible layout. */
  const radiusFor = (trees: number, rows: number) => Math.max(0.4, Math.min(trees || 4, rows || 4) / 3);

  const layers: PlantingLayer[] = [
    ...state.otherPlans.map((other) => ({
      key: `orchard-${other.id}`,
      colour: orchardColour(other.id),
      radius: radiusFor(other.plan.treeSpacing, other.plan.rowSpacing),
      trees: other.plan.trees,
      runs: drawsRows(other.pattern) ? other.plan.runs : undefined,
      outline: other.outline,
    })),
    ...(state.activeId != null
      ? [
          {
            key: `orchard-${state.activeId}`,
            colour: orchardColour(state.activeId),
            radius: radiusFor(plan.treeSpacing, plan.rowSpacing),
            trees: plan.trees,
            runs: drawsRows(draft.pattern) ? plan.runs : undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="pos-page">
      <Link to="/farm/fruits" className="back-link">
        ← {t('farm.fruits')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('positioning.title')}</h1>
        {selected && drawn && (
          <div className="pos-actions">
            <button type="button" className="btn btn-secondary" disabled={state.saving} onClick={state.clear}>
              {t('positioning.clear')}
            </button>
            <button type="button" className="btn" disabled={state.saving} onClick={state.save}>
              {t('common.save')}
            </button>
          </div>
        )}
      </div>

      <p className="pos-intro">{t('positioning.intro')}</p>

      {state.error && <div className="error-banner">{state.error}</div>}

      {state.loading ? (
        <div className="state-box">…</div>
      ) : (
        <div className="pos-split">
          <OrchardList
            orchards={state.orchards}
            blocks={state.blocks}
            selectedIds={state.selectedIds}
            activeId={state.activeId}
            onToggle={state.toggle}
          />

          {selected == null ? (
            <div className="pos-pane">
              <p className="pos-empty">{t('positioning.noOrchards')}</p>
            </div>
          ) : (
            <div className="pos-pane">
              <div className="pos-map">
                <TerritoryMap
                  points={boundary}
                  onChange={state.setBoundary}
                  others={others}
                  plantings={layers}
                  className="pos-map-canvas"
                />
                {!drawn && <p className="pos-map-hint">{t('positioning.drawHint')}</p>}
              </div>

              <PatternControls
                draft={draft}
                plan={plan}
                available={selected.amount}
                onChange={state.changeDraft}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
