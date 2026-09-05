const STORAGE_KEY = 'farm.harvest.listCollapsed';

export function loadListCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveListCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    // A browser refusing storage still folds and unfolds; the choice just lasts as long as the page.
  }
}
