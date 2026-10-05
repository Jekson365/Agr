export type PostSlug =
  | 'crops'
  | 'harvest'
  | 'orchard'
  | 'greenhouse'
  | 'livestock'
  | 'market'
  | 'reports'
  | 'map'
  | 'timeline'
  | 'paperwork'
  | 'animal-profile'
  | 'overview'
  | 'harvest-compare'
  | 'winery';

export type PostCopy = {
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  points: string[];
};

export type CoverCopy = {
  title: string;
  accent: string;
};

export type PaperworkLabels = {
  paper: string;
  paperTime: string;
  appTime: string;
};

export type CompareLabels = {
  previous: string;
  current: string;
  versus: string;
  before: string;
  profit: string;
};

export type WineryLabels = {
  harvest: string;
  making: string;
  bottling: string;
  bottles: string;
};

export type AnimalLabels = {
  vaccination: string;
  checkup: string;
  genetics: string;
};
