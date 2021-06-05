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

export class EventDispatcher {
  private eventConfig: EventConfig;
  constructor(eventConfig: EventConfig) {
    this.eventConfig = eventConfig;
  }

  public onNagare(): void {
    if (this.eventConfig.onNagare !== null) {
      this.eventConfig.onNagare();
    }
  }

  public onAgari(): void {
    if (this.eventConfig.onAgari !== null) {
      this.eventConfig.onAgari();
    }
  }

  public onYagiri(): void {
    if (this.eventConfig.onYagiri !== null) {
      this.eventConfig.onYagiri();
    }
  }

  public onKakumei(): void {
    if (this.eventConfig.onKakumei !== null) {
      this.eventConfig.onKakumei();
    }
  }

  public onStrengthInversion(strengthInverted: boolean): void {
    if (this.eventConfig.onStrengthInversion !== null) {
      this.eventConfig.onStrengthInversion(strengthInverted);
    }
  }

  public onDiscard(): void {
    if (this.eventConfig.onDiscard !== null) {
      this.eventConfig.onDiscard();
    }
  }

  public onPass(): void {
    if (this.eventConfig.onPass !== null) {
      this.eventConfig.onPass();
    }
  }

  public onGameEnd(): void {
    if (this.eventConfig.onGameEnd !== null) {
      this.eventConfig.onGameEnd();
    }
  }

  public onPlayerKicked(): void {
    if (this.eventConfig.onPlayerKicked !== null) {
      this.eventConfig.onPlayerKicked();
    }
  }
}

export function createEventDispatcher(
  eventConfig: EventConfig
): EventDispatcher {
  return new EventDispatcher(eventConfig);
}
