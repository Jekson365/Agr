import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KindPicker, type KindOption } from '@/components/farm/shared/kind-picker';
import { styles } from '@/components/farm/shared/styles';
import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_DEFAULT_UNIT,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_OPTIONS,
} from '@/components/farm/tree-stock/tree-stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createFruitKind, getFruitKinds } from '@/services/fruit-kind-service';
import { createTreeProduct, getTreeProducts } from '@/services/tree-product-service';
import { createTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { FruitKind } from '@/types/fruit-kind';
import type { TreeProduct } from '@/types/tree-product';
import type { FruitType, TreeStock, TreeStockUnit } from '@/types/tree-stock';

type Props = {
  visible: boolean;
  editingStock: TreeStock | null;
  /** The rows that already exist, so a duplicate name — or a product another row already yields —
   *  is caught before saving, and the product is kept out of the picker in the first place. */
  existingItems: TreeStock[];
  onClose: () => void;
  onSaved: (stock: TreeStock, isNew: boolean) => void;
};

export function TreeStockFormModal({ visible, editingStock, existingItems, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<FruitKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [fruitType, setFruitType] = useState<FruitType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<TreeStockUnit>('Kilogram');

  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  /** The catalog product these trees yield. One to an orchard, and required to add a new one. */
  const [productId, setProductId] = useState<number | null>(null);
  /** The products the other rows already yield — one orchard per product, so these aren't on offer. */
  const [takenProducts, setTakenProducts] = useState<Set<number>>(new Set());
  /**
   * Whether this form has added a product already. An orchard yields a single one, so the + is
   * spent once used: a second would write a catalog entry that nothing produces, since only the
   * selected one is ever assigned.
   */
  const [addedProduct, setAddedProduct] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  // Initialize the fields, and load the catalogs to pick from, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setFruitType(editingStock?.type ?? '');
    setNameInput(editingStock?.name ?? '');
    setAmountInput(editingStock ? String(editingStock.amount) : '');
    setUnit(editingStock?.unit ?? 'Kilogram');
    setFormError(null);
    setAddedProduct(false);
    loadKinds(editingStock?.type ?? null);

    const taken = new Set(
      existingItems
        .filter((item) => item.id !== editingStock?.id && item.treeProductId != null)
        .map((item) => item.treeProductId as number)
    );
    setTakenProducts(taken);
    loadProducts(editingStock?.treeProductId ?? null, taken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingStock]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getFruitKinds();
      setKinds(list);
      if (!preset) {
        setFruitType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    try {
      const created = await createFruitKind({ name });
      setKinds((prev) => (prev.some((k) => k.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: fruitTypeLabel(created.name, t) };
    } catch {
      return null;
    }
  }

  async function loadProducts(preset: number | null, taken: Set<number>) {
    setProductsLoading(true);
    try {
      const list = await getTreeProducts();
      setProducts(list);
      // A product is required, so default to the assigned one, else the first one still free.
      setProductId(preset ?? list.find((product) => !taken.has(product.id))?.id ?? null);
    } catch {
      setProducts([]);
      setProductId(preset);
    } finally {
      setProductsLoading(false);
    }
  }

  /** A product added inline. The catalog can be empty on a farm that has picked nothing yet, and
   *  without this there would be nothing to name — so no fruit could be recorded at all. */
  async function handleAddProduct(name: string): Promise<KindOption | null> {
    try {
      const created = await createTreeProduct({ name, unit: TREE_PRODUCT_DEFAULT_UNIT });
      setProducts((prev) => (prev.some((p) => p.id === created.id) ? prev : [...prev, created]));
      setAddedProduct(true);
      return { value: String(created.id), label: productLabel(created) };
    } catch {
      return null;
    }
  }

  const productLabel = (product: TreeProduct) =>
    `${product.name} (${t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg')})`;

  /** What's on offer: every product no other row already yields. */
  const freeProducts = products.filter((product) => !takenProducts.has(product.id));

  /** What an existing orchard yields, to show back beside its trees. A row recorded before produce
   *  was asked for has none, and shows a dash. */
  const assigned = products.find((product) => product.id === editingStock?.treeProductId);
  const assignedProductLabel = assigned ? productLabel(assigned) : '—';

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  // A new fruit has to name what it produces. An existing one keeps the product it already has —
  // the field only shows it back, and the server keeps what it has when none is sent.
  const canSubmit = amount >= 0 && fruitType.trim() !== '' && (isEditing || productId != null) && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    const trimmedName = nameInput.trim();
    // The label is what tells two stocks of the same fruit apart, so it can't be shared. A blank
    // one isn't a label — those rows show their fruit's name instead, and any number may exist.
    const nameTaken =
      trimmedName !== '' &&
      existingItems.some(
        (item) => item.id !== editingStock?.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    if (nameTaken) {
      setFormError(t('treeStock.nameDuplicate'));
      return;
    }

    // Only a new orchard picks a product, and the picker leaves out the ones another row yields —
    // so this only catches one that was taken while the form sat open.
    if (!isEditing && productId != null && takenProducts.has(productId)) {
      setFormError(t('treeProduct.taken'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = trimmedName;
      if (isEditing) {
        // The produce isn't on offer here, so the row carries the product it already had straight
        // through — spread in with the rest of the orchard.
        const updated: TreeStock = { ...editingStock, type: fruitType, name, amount, unit };
        await updateTreeStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeStock({
          type: fruitType,
          name,
          amount,
          unit,
          landPlotId: null,
          treeProductId: productId,
        });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server refuses a name, or a product, another row already holds — one added from
      // another session, say, which this form couldn't have known about. It says which, and once
      // a harvest has picked these trees it refuses to move the product at all.
      if (err instanceof ApiError && err.status === 409) {
        setFormError(err.message || t('treeStock.nameDuplicate'));
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('treeStock.edit') : t('treeStock.add')}</Text>

          {/* An existing orchard is settled: its fruit is what its produce and picked-tree history
              hang off, its label is how it is named everywhere it appears, and how many trees
              stand is the sum of the movements logged against it — recorded on its history page,
              not typed over here. All three are shown back rather than offered. */}
          <Text style={styles.fieldLabel}>{t('farm.type')}</Text>
          {isEditing ? (
            <Text style={styles.emptyHint}>{fruitTypeLabel(fruitType, t)}</Text>
          ) : (
            <KindPicker
              options={kinds.map((k) => ({ value: k.name, label: fruitTypeLabel(k.name, t), icon: fruitKindImage(k.name) }))}
              selected={fruitType}
              onSelect={setFruitType}
              onAddNew={handleAddKind}
              addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
              loading={kindsLoading}
            />
          )}

          <Text style={styles.fieldLabel}>{t('farm.name')}</Text>
          {isEditing ? (
            <Text style={styles.emptyHint}>{nameInput.trim() || '—'}</Text>
          ) : (
            <TextInput
              style={styles.input}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={t('treeStock.namePlaceholder')}
              placeholderTextColor={Brand.muted}
            />
          )}

          <Text style={styles.fieldLabel}>{t('farm.amount')}</Text>
          {isEditing ? (
            <Text style={styles.emptyHint}>{amountInput}</Text>
          ) : (
            <TextInput
              style={styles.input}
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder={t('farm.amountPlaceholder')}
              placeholderTextColor={Brand.muted}
              keyboardType="decimal-pad"
            />
          )}

          <Text style={styles.fieldLabel}>{t('farm.unit')}</Text>
          {isEditing ? (
            <Text style={styles.emptyHint}>{t(TREE_STOCK_UNIT_LABEL_KEY[unit] ?? 'farm.unitKg')}</Text>
          ) : (
            <View style={styles.kindRow}>
              {TREE_STOCK_UNIT_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={[styles.kindChip, unit === opt.value && styles.kindChipActive]}
                  onPress={() => setUnit(opt.value as TreeStockUnit)}>
                  <Text style={[styles.kindChipLabel, unit === opt.value && styles.kindChipLabelActive]}>
                    {t(opt.labelKey)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Named once, with the row: what these trees yield is booked against that product from
              the first harvest on, so an existing orchard shows it back rather than offering to
              move it. A new one picks from the products no other fruit yields, or adds one inline
              — without that, a farm whose catalog is still empty could not record its trees at
              all — and only once, since only the selected product is ever assigned. */}
          <Text style={styles.fieldLabel}>{t('treeProduct.producesLabel')}</Text>
          {isEditing ? (
            <Text style={styles.emptyHint}>{assignedProductLabel}</Text>
          ) : (
            <>
              <KindPicker
                options={freeProducts.map((product) => ({ value: String(product.id), label: productLabel(product) }))}
                selected={productId != null ? String(productId) : ''}
                onSelect={(value) => setProductId(Number(value))}
                onAddNew={handleAddProduct}
                addPlaceholder={t('treeProduct.name')}
                allowAdd={!addedProduct}
                loading={productsLoading}
              />
              {!productsLoading && freeProducts.length === 0 && (
                <Text style={styles.emptyHint}>
                  {t(products.length === 0 ? 'treeProduct.requiredHint' : 'treeProduct.allTaken')}
                </Text>
              )}
            </>
          )}

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          {/* Every field an existing orchard shows is settled at this point, so there is nothing
              for a Save to write — it reads as what it is, a look at the row. */}
          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{isEditing ? t('common.close') : t('common.cancel')}</Text>
            </Pressable>
            {!isEditing && (
              <Pressable
                style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitLabel}>{t('common.add')}</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
