import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { orchardColour } from '@/config/orchard-colours';
import { useLanguage } from '@/contexts/language-context';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  orchard: TreeStock;
  creating: boolean;
};

export function TreatmentPlanHead({ orchard, creating }: Props) {
  const { t } = useLanguage();

  return (
    <div className="trt-pos-head">
      <span className="trt-pos-dot" style={{ background: orchardColour(orchard.id) }} aria-hidden="true" />
      <img src={fruitKindImage(orchard.type)} alt="" className="trt-pos-icon" />
      <span className="trt-pos-name">{treeStockLabel(orchard, t)}</span>
      <span className="trt-pos-label">{t('positioning.title')}</span>
      {creating && <span className="trt-pos-new">{t('treatment.newArea')}</span>}
    </div>
  );
}
