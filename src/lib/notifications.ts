// Utility functions for system notifications

// Extended notification options
interface ExtendedNotificationOptions extends NotificationOptions {
  autoClose?: boolean;
  timeout?: number;
}

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  let permission = Notification.permission;

  // If permission is not granted and not denied, request it
  if (permission !== "granted" && permission !== "denied") {
    permission = await Notification.requestPermission();
  }

  return permission === "granted";
}

/**
 * Show a system notification
 */
export function showNotification(
  title: string,
  options: ExtendedNotificationOptions = {}
): Notification | undefined {
  // Don't attempt to show notifications if not supported
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return;
  }

  // Only show if permission is granted
  if (Notification.permission === "granted") {
    // Extract custom options
    const { autoClose, timeout, ...standardOptions } = options;

    // Merge default options with provided standard options
    const notificationOptions: NotificationOptions = {
      icon: "/favicon.ico", // Default icon
      badge: "/favicon.ico",
      silent: false,
      ...standardOptions,
    };

    try {
      const notification = new Notification(title, notificationOptions);

      // Auto close after 10 seconds by default if not specified
      if (autoClose !== false) {
        setTimeout(() => {
          notification.close();
        }, timeout || 10000);
      }

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  } else {
    console.warn("Notification permission not granted");
  }

  return undefined;
}

/**
 * Check if notifications are supported and permission is granted
 */
export function canShowNotifications(): boolean {
  return "Notification" in window && Notification.permission === "granted";
}

/**
 * Check if the page is currently visible
 */
export function isPageVisible(): boolean {
  return document.visibilityState === "visible";
}

/**
 * Setup visibility change detection
 */
export function setupVisibilityDetection(
  callback: (isVisible: boolean) => void
): () => void {
  const handleVisibilityChange = () => {
    callback(document.visibilityState === "visible");
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Return cleanup function
  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}
