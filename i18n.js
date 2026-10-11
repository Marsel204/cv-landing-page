// Pure helpers shared by the site and its single-file preview.
export function normalizeLanguage(value) {
  return value === 'id' ? 'id' : 'en';
}

export function translate(language, dictionary, message, parameters = {}) {
  const template = normalizeLanguage(language) === 'id' ? dictionary[message] ?? message : message;
  return template.replace(/\{([a-zA-Z]+)\}/g, (token, key) =>
    Object.hasOwn(parameters, key) ? String(parameters[key]) : token);
}

export function localizeProject(project, language, translations) {
  return normalizeLanguage(language) === 'id'
    ? { ...project, ...translations[project.id] }
    : project;
}
