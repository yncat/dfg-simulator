import { RankType } from "./rank";
import { DiscardPair } from "./discard";

type NagareCallback = () => void;
type AgariCallback = (identifier: string) => void;
type ForbiddenAgariCallback = (identifier: string) => void;
type YagiriCallback = (identifier: string) => void;
type JBackCallback = (identifier: string) => void;
type KakumeiCallback = (identifier: string) => void;
type StrengthInversionCallback = (strengthInverted: boolean) => void;
type DiscardCallback = (identifier: string, discardPair: DiscardPair) => void;
type PassCallback = (identifier: string) => void;
type GameEndCallback = () => void;
type PlayerKickedCallback = (identifier: string) => void;
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
  onForbiddenAgari: ForbiddenAgariCallback;
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
