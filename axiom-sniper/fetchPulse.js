

import fetch from 'node-fetch';

const headers = {
  "Content-Type": "application/json",
  "Cookie": "auth-access-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdXRoZW50aWNhdGVkVXNlcklkIjoiNjQ5NThiYjEtMzAxNi00NzgwLThiMDktZjY4NzA2MmNmYTIwIiwiaWF0IjoxNzUyMTE2NjkxLCJleHAiOjE3NTIxMTc2NTF9.0ys7Q-WlfKT37482NCNjwqW-NFHY_QBr4zIMbfiLBdg"
};

fetch("https://api.axiom.trade/tracked-wallets", {
  method: "POST",
  headers: headers,
  body: JSON.stringify([
    { "account": "2tJt...your wallet address..." }
  ])
})
  .then(async res => {
    const text = await res.text();
    console.log("✅ Raw response:", text);
  })
  .catch(err => console.error("❌ Error:", err));





