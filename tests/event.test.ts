import * as Event from "../src/event";

describe("EventDispatcher", () => {
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
});
