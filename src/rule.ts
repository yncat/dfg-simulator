export type RuleConfig = {
  yagiri: boolean;
};

export function createDefaultRuleConfig(): RuleConfig {
  return {
    yagiri: false,
  };
}
