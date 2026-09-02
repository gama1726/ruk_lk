/**
 * @file Контакты РУК — данные с https://new.ruc.su/contacts/
 */

export type UniversityPhone = {
  display: string
  href: string
}

export type UniversityDepartment = {
  title: string
  phones: string[]
  schedule: string
}

export type UniversityBranch = {
  id: string
  name: string
  contactsUrl: string
  addresses: string[]
  hours?: string
  phones: UniversityPhone[]
  emails: UniversityPhone[]
}

export const universityContactsSourceUrl = 'https://new.ruc.su/contacts/'

export const universityMainContacts = {
  address: '141014, Московская область, г. Мытищи, ул. Веры Волошиной, дом 12/30',
  campusHours: 'пн–сб 8:15–20:45',
  phone: { display: '+7 (495) 640-57-11', href: 'tel:+74956405711' } satisfies UniversityPhone,
  email: { display: 'ruc@ruc.su', href: 'mailto:ruc@ruc.su' } satisfies UniversityPhone,
  directions: [
    'от м. Комсомольская с Ярославского вокзала до платформы «Перловская»',
    'от м. Медведково маршрутным такси № 412 до остановки «Университет»',
  ],
  directionsNote:
    'По всем вопросам звонить в рабочие дни с 9:00 до 18:00 (пт. с 9:00 до 16:45).',
} as const

export const universityPaymentDetails = {
  bank: 'АО «АЛЬФА-БАНК», г. Москва',
  bik: '044525593',
  corrAccount: '30101810200000000593',
  account: '40703810401400000245',
  name:
    'Автономная некоммерческая образовательная организация высшего образования Центросоюза Российской Федерации «Российский университет кооперации»',
  inn: '5029088494',
  kpp: '502901001',
  okpo: '01597945',
  okved: '85.22',
  okato: '46234501000',
  ogrn: '1065029009429',
  legalAddress: universityMainContacts.address,
  actualAddress: universityMainContacts.address,
} as const

export const universityDepartments: UniversityDepartment[] = [
  {
    title: 'Приёмная комиссия',
    phones: ['+7 (495) 640-57-11', '+7 (495) 785-76-78'],
    schedule: 'понедельник–пятница с 9:00 до 18:00; суббота с 10:00 до 15:00',
  },
  {
    title: 'Факультеты высшего образования',
    phones: ['8 (495) 640-57-11 — добавочные номера указаны на сайте университета'],
    schedule: 'понедельник–четверг 8:15–17:30, пятница 8:15–16:15, перерыв 12:00–13:00',
  },
  {
    title: 'Довузовская подготовка',
    phones: ['8 (495) 640-57-11, доб. 10712'],
    schedule: 'понедельник–четверг 8:15–17:30, пятница 8:15–16:15, перерыв 12:00–13:00',
  },
  {
    title: 'Колледж',
    phones: ['8 (495) 640-57-11 — добавочные номера указаны на сайте университета'],
    schedule: 'понедельник–четверг 8:15–17:30, пятница 8:15–16:15, перерыв 12:00–13:00',
  },
]

export const universityFeedbackLinks = [
  {
    label: 'Оценка качества образовательного процесса',
    url: 'https://forms.gle/B64SHg4y3dHYaVoM6',
  },
  {
    label: 'Оценка доступности для обучающихся с ОВЗ',
    url: 'https://forms.gle/S7ARHdcioi8zpmXK6',
  },
] as const

/** Филиалы РУК — данные со страниц /contacts/ региональных сайтов. */
export const universityBranches: UniversityBranch[] = [
  {
    id: 'main',
    name: 'Российский университет кооперации (головной вуз)',
    contactsUrl: 'https://new.ruc.su/contacts/',
    addresses: [universityMainContacts.address],
    hours: universityMainContacts.campusHours,
    phones: [universityMainContacts.phone],
    emails: [universityMainContacts.email],
  },
  {
    id: 'kazan',
    name: 'Казанский кооперативный институт (филиал)',
    contactsUrl: 'https://new-kazan.ruc.su/contacts/',
    addresses: [
      'Корпус А, Б: 420081, Республика Татарстан, г. Казань, ул. Н. Ершова, 58',
      'Корпус В: 420087, Республика Татарстан, г. Казань, ул. Даурская, 32, лит. А',
      'Корпус Г: 420039, Республика Татарстан, г. Казань, ул. Исаева, 12',
    ],
    phones: [{ display: '+7 (843) 210-30-27', href: 'tel:+78432103027' }],
    emails: [{ display: 'kazan@ruc.su', href: 'mailto:kazan@ruc.su' }],
  },
  {
    id: 'krasnodar',
    name: 'Краснодарский кооперативный институт (филиал)',
    contactsUrl: 'https://new-krasnodar.ruc.su/contacts/',
    addresses: [
      '350015, Краснодарский край, г. Краснодар, Центральный округ, ул. им. Митрофана Седина, д. 168/1',
    ],
    hours: 'пн–сб 8:15–20:45',
    phones: [{ display: '+7 (861) 255-15-72', href: 'tel:+78612551572' }],
    emails: [{ display: 'krasnodar@ruc.su', href: 'mailto:krasnodar@ruc.su' }],
  },
  {
    id: 'vladimir',
    name: 'Владимирский филиал',
    contactsUrl: 'https://new-vladimir.ruc.su/contacts/',
    addresses: ['600000, г. Владимир, ул. Воровского, д. 16'],
    phones: [{ display: '8 (4922) 32-26-56', href: 'tel:+74922322656' }],
    emails: [{ display: 'vladimir@ruc.su', href: 'mailto:vladimir@ruc.su' }],
  },
  {
    id: 'arzamas',
    name: 'Арзамасский филиал',
    contactsUrl: 'https://new-arzamas.ruc.su/contacts/',
    addresses: ['607220, Нижегородская область, г. Арзамас, проспект Ленина, д. 200'],
    phones: [
      { display: '+7 (83147) 2-14-29', href: 'tel:+78314721429' },
      { display: '+7 (920) 026-77-79', href: 'tel:+79200267779' },
    ],
    emails: [{ display: 'arzamas@ruc.su', href: 'mailto:arzamas@ruc.su' }],
  },
  {
    id: 'ufa',
    name: 'Башкирский кооперативный институт (филиал)',
    contactsUrl: 'https://new-ufa.ruc.su/contacts/',
    addresses: ['450000, Республика Башкортостан, г. Уфа, ул. Ленина, 26'],
    phones: [{ display: '+7 (347) 273-39-51', href: 'tel:+73472733951' }],
    emails: [{ display: 'ufa@ruc.su', href: 'mailto:ufa@ruc.su' }],
  },
  {
    id: 'volgograd',
    name: 'Волгоградский кооперативный институт (филиал)',
    contactsUrl: 'https://new-volgograd.ruc.su/contacts/',
    addresses: ['400002, г. Волгоград, ул. Новосибирская, д. 76'],
    phones: [{ display: '+7 (8442) 41-76-93', href: 'tel:+78442417693' }],
    emails: [{ display: 'volgograd@ruc.su', href: 'mailto:volgograd@ruc.su' }],
  },
  {
    id: 'izhevsk',
    name: 'Ижевский филиал',
    contactsUrl: 'https://new-izhevsk.ruc.su/contacts/',
    addresses: ['426073, г. Ижевск, ул. Молодежная, д. 109'],
    phones: [{ display: '+7 (3412) 37-19-11', href: 'tel:+73412371911' }],
    emails: [{ display: 'izhevsk@ruc.su', href: 'mailto:izhevsk@ruc.su' }],
  },
  {
    id: 'kaliningrad',
    name: 'Калининградский филиал',
    contactsUrl: 'https://new-kaliningrad.ruc.su/contacts/',
    addresses: ['236022, г. Калининград, ул. К. Маркса, д. 17'],
    phones: [
      { display: '+7 (4012) 21-78-87', href: 'tel:+74012217887' },
      { display: '+7 (4012) 21-65-77', href: 'tel:+74012216577' },
    ],
    emails: [{ display: 'kaliningrad@ruc.su', href: 'mailto:kaliningrad@ruc.su' }],
  },
  {
    id: 'pk',
    name: 'Камчатский филиал',
    contactsUrl: 'https://new-pk.ruc.su/contacts/',
    addresses: ['683003, Камчатский край, г. Петропавловск-Камчатский, ул. Ключевская, д. 11'],
    phones: [
      { display: '+7 (4152) 42-39-59', href: 'tel:+74152423959' },
      { display: '+7 (4152) 42-80-01', href: 'tel:+74152428001' },
    ],
    emails: [{ display: 'pk@ruc.su', href: 'mailto:pk@ruc.su' }],
  },
  {
    id: 'crimea',
    name: 'Крымский кооперативный институт (филиал)',
    contactsUrl: 'https://new-crimea.ruc.su/contacts/',
    addresses: [
      '297536, Республика Крым, Симферопольский муниципальный район, с. Совхозное, ул. Южная, д. 39',
    ],
    phones: [{ display: '+7 (978) 166-82-82', href: 'tel:+79781668282' }],
    emails: [{ display: 'crimea@ruc.su', href: 'mailto:crimea@ruc.su' }],
  },
  {
    id: 'engels',
    name: 'Поволжский кооперативный институт (филиал)',
    contactsUrl: 'https://new-engels.ruc.su/contacts/',
    addresses: ['413100, Саратовская область, г. Энгельс, ул. Красноармейская, д. 24'],
    phones: [{ display: '+7 (8453) 56-85-66', href: 'tel:+78453568566' }],
    emails: [{ display: 'engels@ruc.su', href: 'mailto:engels@ruc.su' }],
  },
  {
    id: 'saransk',
    name: 'Саранский кооперативный институт (филиал)',
    contactsUrl: 'https://new-saransk.ruc.su/contacts/',
    addresses: ['430027, Республика Мордовия, г. Саранск, ул. Транспортная, 17'],
    phones: [
      { display: '+7 (8342) 35-65-43', href: 'tel:+78342356543' },
      { display: '+7 (8342) 32-33-82', href: 'tel:+78342323382' },
    ],
    emails: [{ display: 'saransk@ruc.su', href: 'mailto:saransk@ruc.su' }],
  },
  {
    id: 'smolensk',
    name: 'Смоленский кооперативный институт (филиал)',
    contactsUrl: 'https://new-smolensk.ruc.su/contacts/',
    addresses: ['214018, Смоленская область, г. Смоленск, проспект Гагарина, д. 5'],
    phones: [{ display: '+7 (4812) 65-84-49', href: 'tel:+74812658449' }],
    emails: [{ display: 'smolensk@ruc.su', href: 'mailto:smolensk@ruc.su' }],
  },
  {
    id: 'cheb',
    name: 'Чебоксарский кооперативный институт (филиал)',
    contactsUrl: 'https://new-cheb.ruc.su/contacts/',
    addresses: ['428025, Чувашская Республика, г. Чебоксары, пр. М. Горького, д. 24'],
    phones: [{ display: '+7 (495) 640-57-11', href: 'tel:+74956405711' }],
    emails: [{ display: 'cheb@ruc.su', href: 'mailto:cheb@ruc.su' }],
  },
]

/** Ключевые слова для сопоставления поля branch из 1С с карточкой филиала. */
const branchKeywordMatchers: ReadonlyArray<{ id: string; keywords: readonly string[] }> = [
  { id: 'kazan', keywords: ['казан'] },
  { id: 'krasnodar', keywords: ['краснодар'] },
  { id: 'vladimir', keywords: ['владимир'] },
  { id: 'arzamas', keywords: ['арзамас'] },
  { id: 'ufa', keywords: ['уфа', 'башкир'] },
  { id: 'volgograd', keywords: ['волгоград'] },
  { id: 'izhevsk', keywords: ['ижевск', 'удмурт'] },
  { id: 'kaliningrad', keywords: ['калининград'] },
  { id: 'pk', keywords: ['камчат', 'петропавловск'] },
  { id: 'crimea', keywords: ['крым', 'симферополь', 'совхозн'] },
  { id: 'engels', keywords: ['энгельс', 'поволжск'] },
  { id: 'saransk', keywords: ['саранск', 'мордов'] },
  { id: 'smolensk', keywords: ['смоленск'] },
  { id: 'cheb', keywords: ['чебоксар', 'чуваш'] },
]

const mainUniversityBranch = universityBranches.find((branch) => branch.id === 'main')!

/** Находит контакты филиала по строке branch из профиля студента (1С). */
export function resolveUniversityBranch(branchLabel?: string | null): UniversityBranch {
  const haystack = (branchLabel ?? '').trim().toLocaleLowerCase('ru-RU')
  if (!haystack || !haystack.includes('филиал')) {
    return mainUniversityBranch
  }

  for (const { id, keywords } of branchKeywordMatchers) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return universityBranches.find((branch) => branch.id === id) ?? mainUniversityBranch
    }
  }

  return mainUniversityBranch
}

/** Краткие контакты филиала для карточек профиля и других блоков. */
export function universityContactsForBranch(branchLabel?: string | null) {
  const branch = resolveUniversityBranch(branchLabel)
  const phone = branch.phones[0] ?? universityMainContacts.phone
  const email = branch.emails[0] ?? universityMainContacts.email

  return {
    branch,
    phone: phone.display,
    phoneHref: phone.href,
    email: email.display,
    emailHref: email.href,
  }
}

/** Краткие контакты для карточек профиля и других блоков. */
export const universityContactsShort = {
  phone: universityMainContacts.phone.display,
  phoneHref: universityMainContacts.phone.href,
  email: universityMainContacts.email.display,
  emailHref: universityMainContacts.email.href,
} as const
