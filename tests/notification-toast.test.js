import { beforeEach, describe, expect, it } from "vitest";
import {
  collectNewNotificationToasts,
  resetNotificationToastMemory,
} from "../lib/notificationToast";

describe("notifications push pendant la navigation", () => {
  beforeEach(() => resetNotificationToastMemory());

  it("ne transforme pas les notifications déjà présentes en nouveaux toasts", () => {
    const existing = [{ _id: "notif-1", lu: false }];
    expect(collectNewNotificationToasts("account-1", existing)).toEqual([]);
    expect(collectNewNotificationToasts("account-1", existing)).toEqual([]);
  });

  it("affiche une nouvelle notification une seule fois malgré un remontage", () => {
    const existing = [{ _id: "notif-1", lu: false }];
    collectNewNotificationToasts("account-1", existing);

    const withNewNotification = [
      { _id: "notif-2", lu: false },
      ...existing,
    ];
    expect(collectNewNotificationToasts("account-1", withNewNotification)).toEqual([
      withNewNotification[0],
    ]);
    expect(collectNewNotificationToasts("account-1", withNewNotification)).toEqual([]);
  });

  it("conserve une référence séparée pour chaque compte", () => {
    collectNewNotificationToasts("account-1", [{ _id: "notif-1", lu: false }]);
    expect(
      collectNewNotificationToasts("account-2", [{ _id: "notif-2", lu: false }])
    ).toEqual([]);
  });
});
