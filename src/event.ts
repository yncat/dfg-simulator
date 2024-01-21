import { RankType } from "./rank";
import type { Result } from "./result";
import { CardSelectionPair } from "./cardSelection";

type NagareCallback = () => void;
type AgariCallback = (identifier: string) => void;
type ForbiddenAgariCallback = (identifier: string) => void;
type YagiriCallback = (identifier: string) => void;
type JBackCallback = (identifier: string) => void;
type KakumeiCallback = (identifier: string) => void;
type StrengthInversionCallback = (strengthInverted: boolean) => void;
type DiscardCallback = (
  identifier: string,
  discardPair: CardSelectionPair,
  remainingHandCount: number
) => void;
type PassCallback = (identifier: string, remainingHandCount: number) => void;
type GameEndCallback = (result: Result) => void;
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
type ReverseCallback = () => void;
type SkipCallback = (identifier: string) => void;
type transferCallback = (
  identifier: string,
  targetIdentifier: string,
  transferred: CardSelectionPair
) => void;
type exileCallback = (identifier: string, exiled: CardSelectionPair) => void;
type miyakoochiCallback = (identifier: string) => void;

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
  onReverse: ReverseCallback;
  onSkip: SkipCallback;
  onTransfer: transferCallback;
  onExile: exileCallback;
  onMiyakoochi: miyakoochiCallback;
}
