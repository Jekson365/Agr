import { useState } from 'react';

import { ImageField } from '@/components/farm/image-field';
import { TerritoryMap } from '@/components/farm/land/territory-map';
import { TerritoryModal } from '@/components/farm/land/territory-modal';
import { formatArea, territoryAreaHectares, type TerritoryPoint } from '@/config/territory';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import type { LandDraft } from '../onboarding-draft';

import '@/components/farm/land/territory-field.css';

type Props = {
  value: LandDraft;
  onChange: (next: LandDraft) => void;
};

export function LandStep({ value, onChange }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [mapOpen, setMapOpen] = useState(false);

  const mapCenter =
    user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null;
  const territoryArea = territoryAreaHectares(value.territory);

  function pickImage(file: File) {
    onChange({ ...value, imageFile: file, imagePreview: URL.createObjectURL(file) });
  }

  function handleTerritorySaved(points: TerritoryPoint[]) {
    const measured = territoryAreaHectares(points);
    const area = measured > 0 && (parseFloat(value.area) || 0) === 0 ? formatArea(measured) : value.area;
    onChange({ ...value, territory: points, area });
    setMapOpen(false);
  }

  return (
    <>
      <div className="onboarding-step">
        <div className="onboarding-fields">
          <div className="field">
            <label>{t('farm.name')}</label>
            <input
              value={value.name}
              onChange={(e) => onChange({ ...value, name: e.target.value })}
              placeholder={t('farm.namePlaceholderLand')}
            />
          </div>

          <div className="field">
            <label>{t('farm.area')}</label>
            <input
              type="number"
              step="0.01"
              value={value.area}
              onChange={(e) => onChange({ ...value, area: e.target.value })}
              placeholder={t('farm.areaPlaceholder')}
            />
          </div>

          <div className="field">
            <label>{t('farm.location')}</label>
            <input
              value={value.location}
              onChange={(e) => onChange({ ...value, location: e.target.value })}
              placeholder={t('farm.locationPlaceholder')}
            />
          </div>

          <ImageField
            label={t('farm.image')}
            chooseLabel={t('farm.chooseImage')}
            changeLabel={t('farm.changeImage')}
            previewUrl={value.imagePreview}
            onPick={pickImage}
          />

          <div className="field onboarding-field-wide">
            <label>{t('landTerritory.label')}</label>
            {value.territory.length > 0 ? (
              <div className="territory-field">
                <div className="territory-field-preview">
                  <TerritoryMap points={value.territory} fallbackCenter={mapCenter} />
                </div>
                <div className="territory-field-meta">
                  <span>{t('landTerritory.corners', { count: value.territory.length })}</span>
                  {territoryArea > 0 && (
                    <button
                      type="button"
                      className="territory-field-area"
                      onClick={() => onChange({ ...value, area: formatArea(territoryArea) })}
                      title={t('landTerritory.useArea')}
                    >
                      ≈ {formatArea(territoryArea)} {t('farm.areaUnit')}
                    </button>
                  )}
                  <span className="territory-field-spacer" />
                  <button type="button" className="territory-field-link" onClick={() => setMapOpen(true)}>
                    {t('landTerritory.edit')}
                  </button>
                  <button
                    type="button"
                    className="territory-field-link danger"
                    onClick={() => onChange({ ...value, territory: [] })}
                  >
                    {t('landTerritory.clear')}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="territory-field-empty" onClick={() => setMapOpen(true)}>
                {t('landTerritory.mark')}
              </button>
            )}
          </div>
        </div>
      </div>

      <TerritoryModal
        open={mapOpen}
        points={value.territory}
        exceptFarmId={null}
        fallbackCenter={mapCenter}
        onClose={() => setMapOpen(false)}
        onSave={handleTerritorySaved}
      />
    </>
  );
}
