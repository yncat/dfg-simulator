export type RuleConfig = {
  yagiri: boolean;
  jBack: boolean;
  kakumei: boolean;
  reverse: boolean;
};

export function createDefaultRuleConfig(): RuleConfig {
  return {
    yagiri: false,
    jBack: false,
    kakumei: false,
    reverse: false,
  };
}
