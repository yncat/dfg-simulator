export type NagareCallback = () => void;
export type AgariCallback = () => void;
export type YagiriCallback = () => void;
export type KakumeiCallback = () => void;
export type StrengthInversionCallback = (strengthInverted: boolean) => void;
export type DiscardCallback = () => void;
export type PassCallback = () => void;
export type GameEndCallback = () => void;
export type PlayerKickedCallback = () => void;

export type EventConfig = {
  onNagare: NagareCallback | null;
  onAgari: AgariCallback | null;
  onYagiri: YagiriCallback | null;
  onKakumei: KakumeiCallback | null;
  onStrengthInversion: StrengthInversionCallback | null;
  onDiscard: DiscardCallback | null;
  onPass: PassCallback | null;
  onGameEnd: GameEndCallback | null;
  onPlayerKicked: PlayerKickedCallback | null;
};

export function createDefaultEventConfig(): EventConfig {
  return {
    onNagare: null,
    onAgari: null,
    onYagiri: null,
    onKakumei: null,
    onStrengthInversion: null,
    onDiscard: null,
    onPass: null,
    onGameEnd: null,
    onPlayerKicked: null,
  };
}
