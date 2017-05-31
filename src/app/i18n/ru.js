export const formats = {
  decimal: ',',
  thousands: '\xa0',
  grouping: [3],
  currency: ['', ' руб.'],
  dateTime: '%A, %e %B %Y г. %X',
  date: '%d.%m.%Y',
  time: '%H:%M:%S',
  periods: ['AM', 'PM'], // unused
  days: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  shortDays: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
  months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  shortMonths: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
};

export const terms = {
  
export const terms = {
  PHRASE_ALT_ALL: 'Alt + Нажатие для заполнения всех слотов',
  PHRASE_BACKUP_DESC: 'Сохраните все данные перед переносом в другой браузер или устройство',
  PHRASE_CONFIRMATION: 'Вы уверены?',
  PHRASE_EXPORT_DESC: 'Детальный JSON-экспорт вашей сборки для использования в других местах и инструментах',
  PHRASE_FASTEST_RANGE: 'Последовательные прыжки максимальной дальности',
  PHRASE_IMPORT: 'Для импорта вставьте код в эту форму',
  PHRASE_LADEN: 'Масса корабля с учётом топлива и грузов',
  PHRASE_NO_BUILDS: 'Нечего сравнивать',
  PHRASE_NO_RETROCH: 'Нет ранних версий сборки',
  PHRASE_SELECT_BUILDS: 'Выберите конфигурацию для сравнения',
  PHRASE_SG_RECHARGE: 'Восстановление с 50% до 100% объема щита, учитывая полный аккумулятор СИС в начале',
  PHRASE_SG_RECOVER: 'Восстановление с 0% до 50% объема щита, учитывая полный аккумулятор СИС в начале',
  PHRASE_UNLADEN: 'Масса корабля без учета топлива и грузов',
  PHRASE_UPDATE_RDY: 'Доступна новая версия. Нажмите для обновления.',
  PHRASE_ENGAGEMENT_RANGE: 'Дистанция между кораблём и целью',
  PHRASE_SELECT_BLUEPRINT: 'Нажмите чтобы выбрать чертёж',
  PHRASE_BLUEPRINT_WORST: 'Худшие основные значения для чертежа',
  PHRASE_BLUEPRINT_RANDOM: 'Случайный выбор между худшими и лучшими значениями для этого чертежа',
  PHRASE_BLUEPRINT_BEST: 'Лучшие основные значения для чертежа',
  PHRASE_BLUEPRINT_EXTREME: 'Лучшие положительные и худшие отрицательные основные значения для чертежа',
  PHRASE_BLUEPRINT_RESET: 'Убрать все изменения и чертёж',
  PHRASE_SELECT_SPECIAL: 'Нажмите чтобы выбрать экспериментальный эффект',
  PHRASE_NO_SPECIAL: 'Без экспериментального эффекта',
  PHRASE_SHOPPING_LIST: 'Станции что продают эту сборку',
  PHRASE_REFIT_SHOPPING_LIST: 'Станции что продают необходимые модули',
  PHRASE_TOTAL_EFFECTIVE_SHIELD: 'Общий урон что может быть нанесён в каждым типе, если используются все щитонакопители',
  PHRASE_TIME_TO_LOSE_SHIELDS: 'Щиты продержатся',
  PHRASE_TIME_TO_RECOVER_SHIELDS: 'Щиты восстановятся за',
  PHRASE_TIME_TO_RECHARGE_SHIELDS: 'Щиты будут заряжены за',
  PHRASE_SHIELD_SOURCES: 'Подробности энергии щита',
  PHRASE_EFFECTIVE_SHIELD: 'Эффективная сила щита против разных типов урона',
  PHRASE_ARMOUR_SOURCES: 'Подробности состава брони',
  PHRASE_EFFECTIVE_ARMOUR: 'Эффективная сила брони против разных типов урона',
  PHRASE_DAMAGE_TAKEN: '% общих повреждений полученных в разных типах урона',
  PHRASE_TIME_TO_LOSE_ARMOUR: 'Броня продержится',
  PHRASE_MODULE_PROTECTION_EXTERNAL: 'Защита гнёзд',
  PHRASE_MODULE_PROTECTION_INTERNAL: 'Защита всех остальных модулей',
  PHRASE_SHIELD_DAMAGE: 'Подробности источников поддерживаемого ДПС против щитов',
  PHRASE_ARMOUR_DAMAGE: 'Подробности источников поддерживаемого ДПС против брони',

  PHRASE_TIME_TO_REMOVE_SHIELDS: 'Снимет щиты за',
  TT_TIME_TO_REMOVE_SHIELDS: 'Непрерывным огнём из всех орудий',
  PHRASE_TIME_TO_REMOVE_ARMOUR: 'Снимет броню за',
  TT_TIME_TO_REMOVE_ARMOUR: 'Непрерывным огнём из всех орудий',
  PHRASE_TIME_TO_DRAIN_WEP: 'Опустошит ОРУЖ за',
  TT_TIME_TO_DRAIN_WEP: 'Время за которое опустошится аккумулятор ОРУЖ при стрельбе из всех орудий',
  TT_TIME_TO_LOSE_SHIELDS: 'Против поддерживаемой стрельбы из всех орудий противника',
  TT_TIME_TO_LOSE_ARMOUR: 'Против поддерживаемой стрельбы из всех орудий противника',
  TT_MODULE_ARMOUR: 'Броня защищаюшае модули от урона',
  TT_MODULE_PROTECTION_EXTERNAL: 'Процент урона перенаправленного от гнёзд на наборы для усиления модулей',
  TT_MODULE_PROTECTION_INTERNAL: 'Процент урона перенаправленного от модулей вне гнёзд на наборы для усиления модулей',

  TT_EFFECTIVE_SDPS_SHIELDS: 'Реальный поддерживаемый ДПС пока аккумулятор ОРУЖ не пуст',
  TT_EFFECTIVENESS_SHIELDS: 'Эффективность в сравнении с попаданием по цели с 0-сопротивляемостью без пунктов в СИС на 0 метрах',
  TT_EFFECTIVE_SDPS_ARMOUR: 'Реальный поддерживаемый ДПС пока аккумулятор ОРУЖ не пуст',
  TT_EFFECTIVENESS_ARMOUR: 'Эффективность в сравнении с попаданием по цели с 0-сопротивляемостью на 0 метрах',

  PHRASE_EFFECTIVE_SDPS_SHIELDS: 'ПДПС против щитов',
  PHRASE_EFFECTIVE_SDPS_ARMOUR: 'ПДПС против брони',

  TT_SUMMARY_SPEED: 'С полным топливным баком и 4 пунктами в ДВИ',
  TT_SUMMARY_SPEED_NONFUNCTIONAL: 'маневровые двигатели выключены или превышена максимальная масса с топливом и грузом',
  TT_SUMMARY_BOOST: 'С полным топливным баком и 4 пунктами в ДВИ',
  TT_SUMMARY_BOOST_NONFUNCTIONAL: 'Распределитель питания не может обеспечить достаточно энергии для форсажа',
  TT_SUMMARY_SHIELDS: 'Чистая сила щита, включая усилители',
  TT_SUMMARY_SHIELDS_NONFUNCTIONAL: 'Шитогенератор отсутствует или выключен',
  TT_SUMMARY_INTEGRITY: 'Целостность корабля, включая переборки и наборы для усиления корпуса',
  TT_SUMMARY_HULL_MASS: 'Масса корпуса без каких-либо модулей',
  TT_SUMMARY_UNLADEN_MASS: 'Масса корпуса и модулей без топлива и груза',
  TT_SUMMARY_LADEN_MASS: 'Масса корпуса и модулей с топливом и грузом',
  TT_SUMMARY_DPS: 'Урон в секунду при стрельбе из всех орудий',
  TT_SUMMARY_EPS: 'Расход аккумулятора ОРУЖ в секунду при стрельбе из всех орудий',
  TT_SUMMARY_TTD: 'Время расхода аккумулятора ОРУЖ при стрельбе из всех орудий и с 4 пунктами в ОРУЖ',
  TT_SUMMARY_MAX_SINGLE_JUMP: 'Самый дальний возможный прыжок без груза и с топливом достаточным только на сам прыжок',
  TT_SUMMARY_UNLADEN_SINGLE_JUMP: 'Самый дальний возможный прыжок без груза и с полным топливным баком',
  TT_SUMMARY_LADEN_SINGLE_JUMP: 'Самый дальний возможный прыжок с полным грузовым отсеком и с полным топливным баком',
  TT_SUMMARY_UNLADEN_TOTAL_JUMP: 'Самая дальняя общая дистанция без груза, с полным топливным баком и при прыжках на максимальное расстояние',
  TT_SUMMARY_LADEN_TOTAL_JUMP: 'Самая дальняя общая дистанция с полным грузовым отсеком, с полным топливным баком и при прыжках на максимальное расстояние',

HELP_MODIFICATIONS_MENU: 'Ткните на номер чтобы ввести новое значение, или потяните вдоль полосы для малых изменений',
  
  // Other languages fallback to these  values
  // Only Translate to other languages if the name is different in-game
  am: 'Блок Автом. Полевого Ремонта',
  bh: 'Переборки',
  bl: 'Пучковый Лазер',
  bsg: 'Двухпоточный Щитогенератор',
  c: 'Орудие',
  cc: 'Контроллер магнитного снаряда для сбора',
  ch: 'Разбрасыватель дипольных отражателей',
  cr: 'Грузовой стеллаж',
  cs: 'Сканер содержимого',
  dc: 'Стыковочный компьютер',
  ec: 'Электр. противодействие',
  fc: 'Залповое орудие',
  fh: 'Ангар для истребителя',
  fi: 'FSD-перехватчик',
  fs: 'Топливозаборник',
  fsd: 'Рамочно Сместительный двигатель',
  ft: 'Топливный бак',
  fx: 'Контроллер магнитного снаряда для топлива',
  hb: 'Контроллер магнитного снаряда для взлома трюма',
  hr: 'Набор для усиления корпуса',
  hs: 'Теплоотводная катапульта',
  kw: 'Сканер преступников',
  ls: 'Система жизнеобеспечения',
  mc: 'Многоствольное орудие',
  ml: 'Проходочный лазер',
  mr: 'Ракетный лоток',
  mrp: 'Набор для усиления модуля',
  nl: 'Мины',
  pa: 'Ускоритель плазмы',
  pas: 'Комплект для сближения с планетой',
  pc: 'Контроллер магнитного снаряда для геологоразведки',
  pce: 'Каюта пассажира эконом-класса',
  pci: 'Каюта пассажира бизнес-класса',
  pcm: 'Каюта пассажира первого класса',
  pcq: 'Каюта пассажира класса люкс',
  pd: 'Распределитель питания',
  pl: 'Ипмульсный лазер',
  po: 'Точечная оборона',
  pp: 'Силовая установка',
  psg: 'Призматический щитогенератор',
  pv: 'Гараж для планетарного транспорта',
  rf: 'Устройство переработки',
  rg: 'Электромагнитная пушка',
  s: 'Сенсоры',
  sb: 'Усилитель щита',
  sc: 'Сканер обнаружения',
  scb: 'Щитонакопитель',
  sg: 'Щитогенератор',
  ss: 'Сканер Поверхностей',
  t: 'Маневровые двигатели',
  tp: 'Торпедная стойка',
  ul: 'Пульсирующие лазеры',
  ws: 'Сканер следа FSD',

  // Items on the outfitting page
  // Notification of restricted slot
  emptyrestricted: 'пусто (ограниченно)',
  'damage dealt to': 'Урон нанесён',
  'damage received from': 'Урон получен от',
  'against shields': 'Против шитов',
  'against hull': 'Против корпуса',
  'total effective shield': 'Общие эффективные щиты',

  // 'ammo' was overloaded for outfitting page and modul info, so changed to ammunition for outfitting page
  ammunition: 'Припасы',

  // Unit for seconds
  secs: 'с',

  rebuildsperbay: 'Построек за полосу',

  // Blueprint rolls
  worst: 'Худшее',
  average: 'Среднее',
  random: 'Случайное',
  best: 'Лучшее',
  extreme: 'Экстремальное',
  reset: 'Обнулить',
  
  // Weapon, offence, defence and movement
  dpe: 'Урон на МДж энергии',
  dps: 'Урон в Секунду',
  sdps: 'Поддерживаемый урон в секунду',
  dpssdps: 'Урон в секунду (поддерживаемый урон в секунду)',
  eps: 'Энергия в секунду',
  epsseps: 'Энергия в секунду (поддерживаемая энергия в секунду)',
  hps: 'Нагрев в секунду',
  hpsshps: 'Heat per second (sustained heat per second)',
  'damage by': 'Урон',
  'damage from': 'Урон от',
  'shield cells': 'Щитонакопители',
  'recovery': 'Восстановление',
  'recharge': 'Перезарядка',
  'engine pips': 'Пункты в двигателе',
  '4b': '4 пункта и Форсаж',
  'speed': 'Скорость',
  'pitch': 'Тангаж',
  'roll': 'Крен',
  'yaw': 'Рыскание',
  'internal protection': 'Внутренняя защита',
  'external protection': 'Внешняя защита',
  'engagement range': 'Боевое расстояние',
  'total': 'Общее',
  
  // Modifications
  ammo: 'Макс. боекомплект',
  boot: 'Время загрузки',
  brokenregen: 'Скорость восстановления при пробое',
  burst: 'Длина очереди',
  burstrof: 'Скорострельность очереди',
  clip: 'Боекомплект',
  damage: 'Урон',
  distdraw: 'Тяга распределителя',
  duration: 'Продолжительность',
  eff: 'Эффективность',
  engcap: 'Ресурс двигателей',
  engrate: 'Перезарядка двигателей',
  explres: 'Сопротивление взрывам',
  facinglimit: 'Ограничение по направлению',
  hullboost: 'Увеличение корпуса',
  hullreinforcement: 'Укрепление корпуса',
  integrity: 'Целостность',
  jitter: 'Дрожание',
  kinres: 'Сопротивление китетическому урону',
  maxfuel: 'Макс. топлива на прыжок',
  mass: 'Масса',
  optmass: 'Оптимизированная масса',
  optmul: 'Оптимальный усилитель',
  pgen: 'Мощность',
  piercing: 'Бронебойность',
  power: 'Энергопотребление',
  protection: 'Защита от повреждений',
  range: 'Дальность',
  ranget: 'Дальность', // Range in time (for FSD interdictor)
  regen: 'Скорость восстановления',
  reload: 'Время перезарядки',
  rof: 'Скорострельность',
  angle: 'Угол сканера',
  scanrate: 'Скорость сканера',
  scantime: 'Время сканирования',
  shield: 'Щит',
  shieldboost: 'Усиление щитов',
  shieldreinforcement: 'Усилитель щита',
  shotspeed: 'Скорость выстрела',
  spinup: 'Время раскрутки',
  syscap: 'Ресурс систем',
  sysrate: 'Перезарядка систем',
  thermload: 'Тепловая нагрузка',
  thermres: 'Сопротивление термическому урону',
  wepcap: 'Орудийный ресурс',
  weprate: 'Перезарядка оружия',

  // Shield generators use a different terminology
  minmass_sg: 'Мин. масса корпуса',
  optmass_sg: 'Опт. масса корпуса',
  maxmass_sg: 'Макс. масса корпуса',
  minmul_sg: 'Минимальная прочность',
  optmul_sg: 'Оптимальная прочность',
  maxmul_sg: 'Максимальная прочность',
  minmass_psg: 'Мин. масса корпуса',
  optmass_psg: 'Опт. масса корпуса',
  maxmass_psg: 'Макс. масса корпуса',
  minmul_psg: 'Минимальная прочность',
  optmul_psg: 'Оптимальная прочность',
  maxmul_psg: 'Максимальная прочность',
  minmass_bsg: 'Мин. масса корпуса',
  optmass_bsg: 'Опт. масса корпуса',
  maxmass_bsg: 'Макс. масса корпуса',
  minmul_bsg: 'Минимальная прочность',
  optmul_bsg: 'Оптимальная прочность',
  maxmul_bsg: 'Максимальная прочность',

  range_s: 'Типовой диапозон выброса',

  // Damage types
  absolute: 'Общий',
  explosive: 'Взрывч.',
  kinetic: 'Механич.',
  thermal: 'Тепл.',

  // Shield sources
  generator: 'Генератор',
  boosters: 'Усилители',
  cells: 'Накопители',

  // Armour sources
  bulkheads: 'Переборки',
  reinforcement: 'Усилители',

  // Panel headings and subheadings
  'power and costs': 'Энергия и стоимость',
  'costs': 'Цены',
  'retrofit costs': 'Стоимость модификации',
  'reload costs': 'Стоимость перезарядки',
  'profiles': 'Графики',
  'engine profile': 'Двигатели',
  'fsd profile': 'FSD',
  'movement profile': 'Движение',
  'damage to opponent\'s shields': 'Урон щиту противника',
  'damage to opponent\'s hull': 'Урон корпусу противника',
  'offence': 'Нападение',
  'defence': 'Оборона',
  'shield metrics': 'Данные щита',
  'raw shield strength': 'Чистая мощность щита',
  'shield sources': 'Ресурсы щита',
  'damage taken': 'Полученный урон',
  'effective shield': 'Эффективный щит',
  'armour metrics': 'Данные брони',
  'raw armour strength': 'Чистая мощность брони',
  'armour sources': 'Ресурсы брони',
  'raw module armour': 'Чистая броня модулей',
  'effective armour': 'Эффективная броня',
  'offence metrics': 'Данные нападения',
  'defence metrics': 'Данные обороны',
  // Misc items
  'fuel carried': 'Топливо на борту',
  'cargo carried': 'Груз на борту',
  'ship control': 'Управление кораблём',
  'opponent': 'Противник',
  'opponent\'s shields': 'Щит противника',
  'opponent\'s armour': 'Броня противника',
  'shield damage sources': 'источники урона по щиту',
  'armour damage sources': 'источники урона по броне',
  'never': 'Никогда',
  'stock': 'базовый',
  'boost': 'Форсаж',

  // copy of the old ru page
  // Units / Metrics
  '/s': '/с', // Per second
  'm/s': 'м/с', // Meters / Second
  Ls: 'Св.сек', // Light seconds
  LY: 'Св.лет', // Light Years
  CR: 'кр.',  // Credits abbreviation

  // Sizes
  S: 'M', // Small Hardpoint (single Character)
  M: 'С', // Medium Hardpoint size (single character)
  L: 'б', // Large Hardpoint size (single character)
  H: 'O', // Huge Hardpoint size (single character)
  U: 'B', // Utility Hardpoint size (single character) - Kill warrant scanner, etc
  small: 'Малый', // Small ship size
  medium: 'Средний',  // Medium ship size
  large: 'большой', // Large Ship Size
  // Insurance
  alpha: 'Альфа', // Alpha backer insurance level
  beta: 'Бета', // Beta back insurance level
  standard: 'Стандартный',  // Standard insurance level
  // Terms
  'build name': 'название сборки',  // Ship build/configuration/design name
  'compare all': 'сравнить все',
  'create new': 'Создать новый',
  'damage per second': 'урон в секунду',
  'delete all': 'Удалить все',
  'detailed export': 'Подробный экспорт',
  'edit data': 'Редактирование',
  'empty all': 'пусто все',
  'Enter Name': 'Введите имя',
  'fastest range': 'быстрый диапазон',  // Fastet totaljump range - sum of succesive jumps
  'fuel level': 'уровень топлива',  // Percent of fuel (T) in the tank
  'full tank': 'Полный бак',
  'internal compartments': 'внутренние отсеки',
  'jump range': 'Дальность прыжка',
  'mass lock factor': 'Масс. блок',
  'max mass': 'Максимальная масса',
  'net cost': 'разница в цене',
  'none created': 'не создано',
  'refuel time': 'Время дозаправки',  // Time to refuel the tank when scooping
  'retrofit costs': 'цена модификации', // The cost difference when upgrading / downgrading a component
  'retrofit from': 'модификация от',  // Retrofit from Build A against build B
  'T-Load': 'Тепл.',  // Thermal load abbreviation
  'utility mounts': 'Вспомогательное оборудование',
  about: 'О ...', // Link to about page / about Coriolis.io
  action: 'Действие',
  added: 'Добавлено',
  ammo: 'Боекомплект',  // Ammunition
  armour: 'Броня',
  available: 'доступно',  // Available options
  backup: 'Резервная копия',
  bins: 'контейнеры', // Number of Mining Refinery bins
  boost: 'форсаж',
  build: 'cборка',  // Shorthand for the build/configuration/design name
  builds: 'cборки', // Ship build/configuration/design names
  buy: 'купить',
  cancel: 'отменить',
  cargo: 'Груз',
  cells: 'Ячейки',  // Number of cells in a shield cell bank
  close: 'закрыть',
  compare: 'сравнить ',
  comparison: 'сравнение',
  comparisons: 'сравнения',
  cost: 'Стоимость',  // Cost / price of a module or price of a ship
  costs: 'Расходы', // Costs / prices of a modules or prices of ships
  create: 'создать',
  credits: 'Кредиты',
  damage: 'Урон',
  delete: 'Удалить',
  dep: 'Вып', // Weapons/Hardpoints Deployed abbreviation
  deployed: 'Открыты',  // Weapons/Hardpoints Deployed
  disabled: 'Отключено',
  discount: 'Скидка',
  DPS: 'УВС', // Damage per second abbreviation
  efficiency: 'Эффективность',  // Power Plant efficiency
  empty: 'пусто',
  ENG: 'ДВИ', // Abbreviation - Engine recharge rate for power distributor
  export: 'Экспорт',
  forum: 'Форум',
  fuel: 'Топливо',
  hardpoints: 'Орудийные порты',
  hull: 'Корпус', // Ships hull
  import: 'импортировать ',
  insurance: 'Страховка',

  jumps: 'Прыжков',
  laden: 'Груженый',
  language: 'Язык',
  maneuverability: 'Маневренность',

  mass: 'Масса',
  max: 'Макс',

  no: 'Нет',
  pen: 'ПБ',  // Armour peneration abbreviation
  permalink: 'Постоянная ссылка',
  power: 'Мощность',  // Power = Energy / second. Power generated by the power plant, or power consumed (MW / Mega Watts). Used in the power plant section
  pri: 'Осн', // Priority abbreviation for power management
  proceed: 'продолжить',
  PWR: 'Эн',  // Power Abbreviation. See Power
  range: 'Дальность',
  rate: 'скорость',
  recharge: 'перезарядка',  // Shield Recharge time from 50% -> 100%
  recovery: 'включение',  // Shield recovery time (after losing shields/turning on -> 50%)
  reload: 'Перезагрузить',  // Reload weapon/hardpoint
  rename: 'Переименовать',
  repair: 'Починка',
  reset: 'Сброс',
  ret: 'Убр.',  // Retracted abbreviation
  retracted: 'Убрано',  // Weapons/Hardpoints retracted
  ROF: 'В/сек', // Rate of Fire abbreviation

  save: 'Сохранить',
  sell: 'Продать',
  settings: 'Настройки',  // Coriolis application settings
  shields: 'Щиты',
  ship: 'Корабль',
  ships: 'Корабли',
  shortened: 'Укороченный', // Standard/Stock build of a ship when purchased new
  size: 'размер',
  skip: 'пропустить', // Skip past something / ignore it
  speed: 'скорость',
  standard: 'Стандартный',  // Standard / Common modules (FSD, power plant, life support, etc)
  Stock: 'Стандартная комплектация',  // Thermal-load abbreviation
  SYS: 'СИС', // Abbreviation - System recharge rate for power distributor
  time: 'Время',  // time it takes to complete something
  total: 'Всего',
  type: 'Тип',
  unladen: 'Пустой',  // No cargo or fuel
  URL: 'Ссылка',  // Link, Uniform Resource Locator
  WEP: 'ОРУЖ',  // Abbreviation - Weapon recharge rate for power distributor
  yes: 'Да'
};
