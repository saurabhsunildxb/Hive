require('dotenv').config();
const app = require('./index');

async function debugRoutes() {
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  console.log('\n--- TESTING ROUTE MOUNTING DIAGNOSTICS ---');

  // Login as demo owner
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@hive.demo', password: 'HiveDemo@123' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  // 1. GET /api/v1/workspaces
  const wsRes = await fetch(`${baseUrl}/api/v1/workspaces`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const wsData = await wsRes.json();
  const wsId = wsData.data?.[0]?.workspace?.id;
  console.log('Workspaces List:', wsRes.status, 'Workspace ID:', wsId);

  // 2. GET /api/v1/workspaces/:wsId
  const wsSingleRes = await fetch(`${baseUrl}/api/v1/workspaces/${wsId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /workspaces/:id Status:', wsSingleRes.status);

  // 3. GET /api/v1/workspaces/:wsId/members
  const wsMembersRes = await fetch(`${baseUrl}/api/v1/workspaces/${wsId}/members`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('GET /workspaces/:id/members Status:', wsMembersRes.status);

  // 4. GET /api/v1/workspaces/:wsId/projects
  const wsProjRes = await fetch(`${baseUrl}/api/v1/workspaces/${wsId}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const wsProjData = await wsProjRes.json();
  console.log('GET /workspaces/:id/projects Status:', wsProjRes.status, wsProjData);

  // 5. GET /api/v1/notifications
  const notifRes = await fetch(`${baseUrl}/api/v1/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const notifData = await notifRes.json();
  console.log('GET /notifications Status:', notifRes.status, notifData);

  server.close();
}

debugRoutes();
