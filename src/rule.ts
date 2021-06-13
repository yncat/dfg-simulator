export type RuleConfig = {
  yagiri: boolean;
  jBack: boolean;
};

export function createDefaultRuleConfig(): RuleConfig {
  return {
    yagiri: false,
    jBack: false,
  };
}
