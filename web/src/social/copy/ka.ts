import ka from '@/locales/ka.json';
import type { AnimalLabels, CoverCopy, PaperworkLabels, PostCopy, PostSlug } from '@/social/copy/post-copy';

const lead = (text: string) => text.split(/ — |: /)[0];

const { manage, harvest, market, reports, map } = ka.landing;

export const KA_POSTS: Record<PostSlug, PostCopy> = {
  crops: {
    eyebrow: manage.stock.title,
    title: manage.stock.point1,
    accent: 'ნებისმიერი',
    body: manage.stock.body,
    points: [manage.stock.point2, manage.stock.point3],
  },
  harvest: {
    eyebrow: harvest.eyebrow,
    title: harvest.title,
    accent: 'სრული ციკლის',
    body: 'აკონტროლე მოსავლის ციკლი დაგეგმვიდან დასაწყობებამდე',
    points: [harvest.stages.title, harvest.warehouse.title],
  },
  orchard: {
    eyebrow: ka.farm.fruits,
    title: manage.fruits.title,
    accent: 'ხეხილის ბაღის',
    body: manage.fruits.body,
    points: [lead(manage.fruits.point3), lead(manage.fruits.point1)],
  },
  greenhouse: {
    eyebrow: ka.farm.greenhouse,
    title: manage.greenhouse.title,
    accent: 'სათბურის',
    body: manage.greenhouse.body,
    points: [ka.greenhouse.positioning.title, ka.greenhouse.harvestTitle],
  },
  livestock: {
    eyebrow: ka.farm.livestock,
    title: 'პირუტყვის მართვა',
    accent: 'პირუტყვის',
    body: manage.livestock.body,
    points: [lead(manage.livestock.point4), 'გენეტიკა'],
  },
  market: {
    eyebrow: market.eyebrow,
    title: market.title,
    accent: 'საკუთარი ნაწარმი',
    body: market.subtitle,
    points: [market.buySell.title, market.equipment.title],
  },
  reports: {
    eyebrow: reports.eyebrow,
    title: reports.title,
    accent: 'ანალიტიკა',
    body: 'მოსავლიანობა, შემოსავალი, ხარჯები და წმინდა მოგება კულტურების მიხედვით.',
    points: [reports.financial.title, reports.inventory.title],
  },
  map: {
    eyebrow: map.eyebrow,
    title: map.title,
    accent: 'მეზობელი',
    body: map.nearby.title,
    points: [map.draw.title, map.connect.title],
  },
  timeline: {
    eyebrow: ka.dashboard.calendar,
    title: ka.harvestTimeline.title,
    accent: 'ვადები',
    body: 'კალენდარი დაგეხმარება უკეთეს პირობებში და ხელსაყრელ პერიოდში დაგეგმო მოსავალი.',
    points: [ka.harvest.expectedDate, ka.harvestTimeline.markDay],
  },
  paperwork: {
    eyebrow: 'რატომ მთაბარი?',
    title: 'დაიღალე რვეულებით და Excel-ით?',
    accent: 'დაიღალე',
    body: 'ფურცლები იკარგება, ფორმულები ირევა, დათვლას საათები სჭირდება. „მთაბარი“ თავად დაითვლის.',
    points: ['ავტომატური ანგარიშები', 'ყველა ჩანაწერი ერთ სივრცეში'],
  },
  'animal-profile': {
    eyebrow: ka.farm.livestock,
    title: 'თითოეულ ცხოველს თავისი პროფილი',
    accent: 'თითოეულ ცხოველს',
    body: 'ყურის ნიშანი, წონა, ვაქცინაციები და მშობლები — ყოველი ცხოველის ისტორია ცალკე ინახება.',
    points: [ka.history.title, ka.history.medicalTab],
  },
  overview: {
    eyebrow: 'ყველა ფუნქცია',
    title: lead(ka.landing.seo.description),
    accent: 'ერთ სივრცეში',
    body: 'მიწიდან ბაზრამდე — ყველაფერი, რაც ფერმას სჭირდება.',
    points: ['ტელეფონშიც და კომპიუტერშიც', 'სრულად ქართულ ენაზე'],
  },
};

export const KA_COVER: CoverCopy = {
  title: lead(ka.landing.seo.description),
  accent: 'ერთ სივრცეში',
};

export const KA_ANIMAL: AnimalLabels = {
  vaccination: 'ვაქცინაცია',
  checkup: 'გასინჯვა',
  genetics: 'გენეტიკა',
};

export const KA_PAPERWORK: PaperworkLabels = {
  paper: 'რვეული და Excel',
  paperTime: '3 სთ',
  appTime: '5 წთ',
};
