const seenIdsByAccount = new Map();

/**
 * Une première lecture initialise la référence sans générer de toast.
 * Les lectures suivantes ne retournent que les notifications réellement créées
 * depuis cette référence, même si le composant visuel est remonté.
 */
export function collectNewNotificationToasts(accountId, notifications = []) {
  if (!accountId) return [];

  let seenIds = seenIdsByAccount.get(accountId);
  if (!seenIds) {
    seenIds = new Set(notifications.map((notification) => notification._id));
    seenIdsByAccount.set(accountId, seenIds);
    return [];
  }

  const fresh = notifications.filter(
    (notification) => !notification.lu && !seenIds.has(notification._id)
  );
  notifications.forEach((notification) => seenIds.add(notification._id));
  return fresh;
}

export function resetNotificationToastMemory() {
  seenIdsByAccount.clear();
}
