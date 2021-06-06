import * as Event from "../src/event";
import * as Rank from "../src/rank";

/* eslint @typescript-eslint/no-unused-vars: 0 */
/* eslint @typescript-eslint/no-empty-function: 0 */

describe("EventDispatcher", () => {
  describe("onNagare", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onNagare = f;
      const d = Event.createEventDispatcher(c);
      d.onNagare();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onAgari", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onAgari = f;
      const d = Event.createEventDispatcher(c);
      d.onAgari();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onYagiri", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onYagiri = f;
      const d = Event.createEventDispatcher(c);
      d.onYagiri();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onKakumei", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onKakumei = f;
      const d = Event.createEventDispatcher(c);
      d.onKakumei();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onStrengthInversion", () => {
    it("calls event function", () => {
      const f = jest.fn((strengthInverted: boolean) => {});
      const c = Event.createDefaultEventConfig();
      c.onStrengthInversion = f;
      const d = Event.createEventDispatcher(c);
      d.onStrengthInversion(true);
      expect(f).toHaveBeenCalled();
      expect(f.mock.calls[0][0]).toBeTruthy();
    });
  });

  describe("onDiscard", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onDiscard = f;
      const d = Event.createEventDispatcher(c);
      d.onDiscard();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onPass", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onPass = f;
      const d = Event.createEventDispatcher(c);
      d.onPass();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onGameEnd", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onGameEnd = f;
      const d = Event.createEventDispatcher(c);
      d.onGameEnd();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onPlayerKicked", () => {
    it("calls event function", () => {
      const f = jest.fn();
      const c = Event.createDefaultEventConfig();
      c.onPlayerKicked = f;
      const d = Event.createEventDispatcher(c);
      d.onPlayerKicked();
      expect(f).toHaveBeenCalled();
    });
  });

  describe("onPlayerRankChanged", () => {
    it("calls event function", () => {
      const f = jest.fn(
        (identifier: string, before: Rank.RankType, after: Rank.RankType) => {}
      );
      const c = Event.createDefaultEventConfig();
      c.onPlayerRankChanged = f;
      const d = Event.createEventDispatcher(c);
      d.onPlayerRankChanged(
        "abc",
        Rank.RankType.UNDETERMINED,
        Rank.RankType.DAIFUGO
      );
      expect(f).toHaveBeenCalled();
    });
  });
});
