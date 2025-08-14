// Web-compatible KeepAwake fallback
export const KeepAwake = {
  activateKeepAwake: async (): Promise<void> => {
    // No-op for web, browsers handle screen wake automatically
    if (typeof window !== "undefined" && "wakeLock" in navigator) {
      try {
        await (navigator as any).wakeLock.request("screen");
      } catch (err) {
        // Silently ignore wake lock errors
      }
    }
  },
  
  deactivateKeepAwake: async (): Promise<void> => {
    // No-op for web
  },
};

export const activateKeepAwake = KeepAwake.activateKeepAwake;
export const deactivateKeepAwake = KeepAwake.deactivateKeepAwake;

export default KeepAwake;
