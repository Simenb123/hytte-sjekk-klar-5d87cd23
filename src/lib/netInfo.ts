// Web-compatible NetInfo fallback
export const NetInfo = {
  fetch: () => Promise.resolve({
    isConnected: typeof window !== "undefined" ? navigator.onLine : true,
    type: "wifi" as const,
  }),
  
  addEventListener: (callback: (state: { isConnected: boolean }) => void) => {
    if (typeof window !== "undefined") {
      const handleOnline = () => callback({ isConnected: true });
      const handleOffline = () => callback({ isConnected: false });
      
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
    return () => {};
  },
};

export default NetInfo;