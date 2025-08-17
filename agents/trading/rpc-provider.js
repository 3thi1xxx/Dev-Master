// resolve RPC from config, but the executor actually performs IO
export function resolveRpc(cfg) {
  return cfg.rpcUrl || (cfg.rpcUrls && cfg.rpcUrls[0]) || "RPC_DISABLED";
} 