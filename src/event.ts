import { RankType } from "./rank";

type NagareCallback = () => void;
type AgariCallback = () => void;
type YagiriCallback = () => void;
type JBackCallback = () => void;
type KakumeiCallback = () => void;
type StrengthInversionCallback = (strengthInverted: boolean) => void;
type DiscardCallback = () => void;
type PassCallback = () => void;
type GameEndCallback = () => void;
type PlayerKickedCallback = () => void;
type PlayerRankChangedCallback = (
  identifier: string,
  before: RankType,
  after: RankType
) => void;
type InitialInfoProvidedCallback = (
  playerCount: number,
  deckCount: number
) => void;
type CardsProvidedCallback = (
  identifier: string,
  providedCount: number
) => void;

export interface EventReceiver {
  onNagare: NagareCallback;
  onAgari: AgariCallback;
  onYagiri: YagiriCallback;
  onJBack: JBackCallback;
  onKakumei: KakumeiCallback;
  onStrengthInversion: StrengthInversionCallback;
  onDiscard: DiscardCallback;
  onPass: PassCallback;
  onGameEnd: GameEndCallback;
  onPlayerKicked: PlayerKickedCallback;
  onPlayerRankChanged: PlayerRankChangedCallback;
  onInitialInfoProvided: InitialInfoProvidedCallback;
  onCardsProvided: CardsProvidedCallback;
}
