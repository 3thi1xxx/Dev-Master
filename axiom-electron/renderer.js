async function refresh() {
  const result = await window.api.fetchPulse();
  const table = document.getElementById("tokenTable");
  const latency = document.getElementById("latency");

  table.innerHTML = "";
  latency.textContent = result.latency ? `⚡ Latency: ${result.latency}ms` : "⚠ Error fetching tokens";

  (result.tokens || []).forEach(token => {
    const row = document.createElement("tr");

    row.innerHTML = \`
      <td>\${token.token?.name || "Unnamed"}</td>
      <td>\${((Date.now() - new Date(token.createdAt).getTime()) / 60000).toFixed(1)} min</td>
      <td>\${token.volumeSol?.toFixed(2)}</td>
      <td>\${token.liquiditySol?.toFixed(2)}</td>
      <td>\${token.marketCapSol?.toFixed(2)}</td>
      <td>\${token.score}</td>
      <td><a href="https://jup.ag/swap/SOL-\${token.mint}" target="_blank">Buy</a></td>
    \`;

    table.appendChild(row);
  });
}