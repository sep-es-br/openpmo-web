export function isStrategicProjectGoalValid(
  projectGoal: number | null,
  indicatorGoal: number,
  polarity?: string
): boolean {
  if (projectGoal == null || !Number.isFinite(projectGoal)) {
    return false;
  }

  const normalizedPolarity = (polarity || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase();

  if (/\b(max|maximum|maxima|maximo|menor|lower|decrease|decreasing|decrescente|descendente)\b/.test(normalizedPolarity)) {
    return projectGoal <= indicatorGoal;
  }
  if (/\b(min|minimum|minima|minimo|maior|higher|greater|increase|increasing|crescente|ascendente)\b/.test(normalizedPolarity)) {
    return projectGoal >= indicatorGoal;
  }
  return false;
}
