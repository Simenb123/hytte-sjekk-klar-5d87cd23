export default {
  addEventListener: () => () => undefined,
  fetch: () => Promise.resolve({ isConnected: true }),
};
