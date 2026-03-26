export default {
  app: { name: 'Mind Diary' },

  onboarding: {
    namePrompt: "Як тебе звати?",
    writePrompt: "Напиши щось про свій день. Що завгодно.",
    atomsExplain: "Твій запис розклався на атоми — окремі думки, фрази, медіа. Кожен атом живе самостійно.",
    combinePrompt: "Обери кілька атомів і об'єднай їх. Це створить молекулу — зв'язок між думками.",
    combineFirstPrompt: "Обери кілька атомів і об'єднай їх у першу молекулу.",
    combineSecondPrompt: "Тепер об'єднай решту атомів у другу молекулу.",
    combineMoleculesPrompt: "Обери обидві молекули і об'єднай їх. Молекули зливаються в одну — плоску, без вкладень.",
    moleculeExplain: "Молекула — це група атомів, які ти зв'язав(ла). Кожне об'єднання оновлює їх, не даючи згаснути.",
    detailPrompt: "Затисни молекулу, щоб відкрити деталі.",
    detailExplain: "Тут ти бачиш вміст молекули. Перегляд деталей оновлює згасання.",
    fadeExplain: "Атоми згасають з часом, як справжні спогади. Об'єднання та взаємодія тримають їх яскравими. Те, що важливо — ти збережеш. Решта згасне.",
    doneMessage: "Ти готовий/готова. Пиши, об'єднуй, будуй.",
    start: "Почати",
  },

  canvas: {
    emptyState: "Напиши першу думку. Вона розкладеться на атоми.",
    hintLongPress: "Затисни елемент, щоб відкрити деталі",
  },

  composer: {
    placeholder: "Напиши щось...",
    send: "Надіслати",
  },

  combine: {
    title: "Об'єднати",
    notePlaceholder: "Додай нотатку...",
    confirm: "Об'єднати",
    cancel: "Скасувати",
    selected: "{count} обрано",
    resultMolecule: "Нова молекула",
    resultStory: "Нова історія",
  },

  detail: {
    addHere: "Додати сюди",
    created: "Створено {date}",
    interactions: "{count} взаємодій",
  },

  levels: {
    atom: "Атом",
    molecule: "Молекула",
    story: "Історія",
  },

  settings: {
    title: "Налаштування",
    name: "Ім'я",
    language: "Мова",
    exportJSON: "Експорт даних",
    importJSON: "Імпорт даних",
    nodeCount: "{count} вузлів",
    resetOnboarding: "Пройти онбординг знову",
  },

  common: {
    save: "Зберегти",
    cancel: "Скасувати",
    done: "Готово",
    back: "Назад",
    close: "Закрити",
    delete: "Видалити",
    attachPhoto: "Додати фото",
    maxPhotos: "Максимум 10 фото",
    maxPhotosReached: "Максимум фото",
    attachLocation: "Додати місце",
    somePlace: "Якесь місце",
    useMyLocation: "Моє місце",
    searchPlace: "Шукати місце...",
    confirmLocation: "Підтвердити",
    viewMedia: "Переглянути медіа",
    confirmDelete: "Точно видалити?",
    deleteConfirmMessage: "Цю дію неможливо скасувати.",
  },
};
