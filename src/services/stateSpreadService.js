import { getStateSpreadConfig } from "../data/stateSpreads";

function sortRules(rules = []) {
  return [...rules].sort((a, b) => a.applicableFrom.localeCompare(b.applicableFrom));
}

/** Rule in force on an ISO date (inclusive from, exclusive/null to). */
export function getSpreadRuleOn(stateId, isoDate) {
  const config = getStateSpreadConfig(stateId);
  if (!config?.rules?.length || !isoDate) return null;

  const active = sortRules(config.rules).filter((rule) => {
    const fromOk = rule.applicableFrom <= isoDate;
    const toOk = !rule.applicableTo || isoDate < rule.applicableTo;
    return fromOk && toOk;
  });

  return active.at(-1) || null;
}

/** Current (latest open-ended or most recent) rule for UI display. */
export function getCurrentSpreadRule(stateId, asOfIso = new Date().toISOString().slice(0, 10)) {
  return getSpreadRuleOn(stateId, asOfIso);
}

export function getStateSpreadMeta(stateId) {
  const config = getStateSpreadConfig(stateId);
  if (!config) return null;
  const current = getCurrentSpreadRule(stateId);
  return {
    stateId: config.stateId,
    authority: config.authority,
    portal: config.portal,
    current,
    rules: sortRules(config.rules),
  };
}

/**
 * Contiguous segments in [startIso, endIso) where the state spread rule is constant.
 */
export function getSpreadSegments(stateId, startIso, endIso) {
  if (!startIso || !endIso || endIso <= startIso) return [];

  const config = getStateSpreadConfig(stateId);
  if (!config?.rules?.length) {
    throw new Error(`No spread config found for state "${stateId}".`);
  }

  const rules = sortRules(config.rules);
  const breaks = new Set([startIso, endIso]);
  for (const rule of rules) {
    if (rule.applicableFrom > startIso && rule.applicableFrom < endIso) {
      breaks.add(rule.applicableFrom);
    }
    if (rule.applicableTo && rule.applicableTo > startIso && rule.applicableTo < endIso) {
      breaks.add(rule.applicableTo);
    }
  }

  const points = [...breaks].sort();
  const segments = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const rule = getSpreadRuleOn(stateId, from);
    if (!rule) {
      throw new Error(
        `No ${stateId} spread rule covers ${from}. Add an applicableFrom/To entry in stateSpreads/${stateId}.json.`
      );
    }
    segments.push({
      from,
      to,
      spreadPct: Number(rule.spreadPct),
      method: rule.method,
      mclrBasis: rule.mclrBasis || "sbi_highest",
      ruleId: rule.id,
      source: rule.source,
      sourceUrl: rule.sourceUrl,
      applicableFrom: rule.applicableFrom,
      applicableTo: rule.applicableTo,
    });
  }
  return segments;
}
