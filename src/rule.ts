export const SkipConfig = {
  OFF: 0, // Disabled
  SINGLE: 1, // Playing multiple 5s always skips the next player
  MULTI: 2, // Playing multiple 5s skips multiple players based on the number of the played cards
} as const;
export type SkipConfig = typeof SkipConfig[keyof typeof SkipConfig];

export type RuleConfig = {
  yagiri: boolean;
  jBack: boolean;
  kakumei: boolean;
  reverse: boolean;
  skip: SkipConfig;
};

export function createDefaultRuleConfig(): RuleConfig {
  return {
    yagiri: false,
    jBack: false,
    kakumei: false,
    reverse: false,
    skip: SkipConfig.OFF,
  };
}
