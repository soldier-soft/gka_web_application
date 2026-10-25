const testAccounts = [
  { role: 'Owner', email: 'owner@gkaconstruction.com', pass: 'GKAadmin2026!' },
  { role: 'PM', email: 'pm@gkaconstruction.com', pass: 'GKApm2026!' },
  { role: 'Supervisor', email: 'supervisor@gkaconstruction.com', pass: 'GKAsuper2026!' },
  { role: 'Accounts', email: 'accounts@gkaconstruction.com', pass: 'GKAaccounts2026!' },
  { role: 'Client', email: 'client@gingerhotel.com', pass: 'GKAclient2026!' },
];

async function runTests() {
  console.log('Testing authentication for all 5 roles against http://127.0.0.1:5000/api/v1/auth/login...\n');
  
  for (const acc of testAccounts) {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: acc.email, password: acc.pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log(`✅ [${acc.role}] SUCCESS! Logged in as: ${data.user.name} (${data.user.role}) - Token received: ${data.token.slice(0, 20)}...`);
      } else {
        console.error(`❌ [${acc.role}] FAILED (${res.status}):`, data.message);
      }
    } catch (err) {
      console.error(`❌ [${acc.role}] ERROR:`, err.message);
    }
  }
}

runTests();
