import { formsFor, parametersIn, SOIL_GROUP_LABEL_KEY, SOIL_GROUP_ORDER } from '@/config/soil';
import { useLanguage } from '@/contexts/language-context';
import type { SoilParameterGroup, SoilReferenceData } from '@/types/soil';
import { resultKey, type InvestigationDraft, type ResultDraft } from './soil-draft';
import { SoilParameterRow } from './soil-parameter-row';

type Props = {
  draft: InvestigationDraft;
  reference: SoilReferenceData;
  onPatch: (key: string, patch: Partial<ResultDraft>) => void;
  only?: SoilParameterGroup;
};

export function SoilParameterGroups({ draft, reference, onPatch, only }: Props) {
  const { t } = useLanguage();

  const groups = only ? [only] : SOIL_GROUP_ORDER;

  return (
    <>
      {groups.map((group) => {
        const parameters = parametersIn(reference, group);
        if (parameters.length === 0) return null;

        return (
          <div key={group}>
            {!only && <h3 className="soil-group-title">{t(SOIL_GROUP_LABEL_KEY[group])}</h3>}
            <div className="modal-form-grid">
              {parameters.flatMap((parameter) =>
                formsFor(parameter.supportsForms).map((form) => {
                  const key = resultKey(parameter.id, form);
                  const entry = draft.results[key];
                  if (!entry) return null;
                  return (
                    <SoilParameterRow
                      key={key}
                      parameter={parameter}
                      form={form}
                      entry={entry}
                      reference={reference}
                      onPatch={(patch) => onPatch(key, patch)}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
