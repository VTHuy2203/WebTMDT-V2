const assert = require('node:assert/strict');
const { io } = require('socket.io-client');
const { PrismaClient } = require('@prisma/client');

const base = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';
const db = new PrismaClient();
async function api(path, init = {}) {
  const response = await fetch(base + path, { ...init, headers: { 'content-type': 'application/json', ...(init.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${JSON.stringify(payload)}`);
  return payload.data;
}
function event(socket, name) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${name}`)), 5000);
    socket.once(name, (data) => { clearTimeout(timer); resolve(data); });
  });
}
function eventWhere(socket, name, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(name, listener);
      reject(new Error(`Timeout waiting for matching ${name}`));
    }, 5000);
    const listener = (data) => {
      if (!predicate(data)) return;
      clearTimeout(timer);
      socket.off(name, listener);
      resolve(data);
    };
    socket.on(name, listener);
  });
}
function connected(token) {
  const socket = io(new URL(base).origin + '/chat', { auth: { token }, transports: ['websocket'] });
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', reject);
  });
}

async function main() {
  const stamp = Date.now();
  const email = `chat-test-${stamp}@example.com`;
  let buyer;
  let conversation;
  let buyerSocket;
  let adminSocket;
  try {
    const buyerAuthResponse = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-client-app': 'buyer' },
      body: JSON.stringify({ fullName: 'Chat Test', email, phoneNumber: `07${String(stamp).slice(-8)}`, password: 'ChatTest@12345' }),
    });
    const buyerAuthPayload = await buyerAuthResponse.json();
    assert.equal(buyerAuthResponse.ok, true, JSON.stringify(buyerAuthPayload));
    assert.match(buyerAuthResponse.headers.get('set-cookie') || '', /marketplace_refresh_buyer=/);
    buyer = buyerAuthPayload.data;

    const adminAuthResponse = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-client-app': 'admin' },
      body: JSON.stringify({ email: 'admin@marketplace.local', password: 'Marketplace@123' }),
    });
    const adminAuthPayload = await adminAuthResponse.json();
    assert.equal(adminAuthResponse.ok, true, JSON.stringify(adminAuthPayload));
    assert.match(adminAuthResponse.headers.get('set-cookie') || '', /marketplace_refresh_admin=/);
    const admin = adminAuthPayload.data;
    [buyerSocket, adminSocket] = await Promise.all([connected(buyer.token), connected(admin.token)]);
    await assert.rejects(
      () => api('/conversations/admin-support', { method: 'POST', headers: { authorization: `Bearer ${admin.token}` } }),
      /403 .*BUYER_ACCOUNT_REQUIRED/,
    );
    conversation = await api('/conversations/admin-support', { method: 'POST', headers: { authorization: `Bearer ${buyer.token}` } });

    const adminMessageEvent = eventWhere(adminSocket, 'message.created', (item) => item.body === 'Buyer cần Admin hỗ trợ');
    const buyerAutomaticEvent = eventWhere(buyerSocket, 'message.created', (item) => item.body?.startsWith('Dạ,'));
    const adminNotificationEvent = event(adminSocket, 'notification.created');
    const buyerMessage = await api(`/conversations/${conversation.id}/messages`, { method: 'POST', headers: { authorization: `Bearer ${buyer.token}` }, body: JSON.stringify({ text: 'Buyer cần Admin hỗ trợ' }) });
    assert.equal(buyerMessage.senderId, buyer.user.id);
    assert.equal((await adminMessageEvent).body, 'Buyer cần Admin hỗ trợ');
    assert.match((await buyerAutomaticEvent).body, /^Dạ,/);
    assert.equal((await adminNotificationEvent).conversationId, conversation.id);

    const inbox = await api('/admin/conversations', { headers: { authorization: `Bearer ${admin.token}` } });
    assert.ok(inbox.some((item) => item.id === conversation.id && item.automationEnabled === true
      && item.messages.some((message) => message.text === 'Buyer cần Admin hỗ trợ')));

    const buyerHandoffEvent = eventWhere(buyerSocket, 'message.created', (item) => item.body === 'Tôi đã chuyển tin nhắn này đến bộ phận chuyên môn.');
    const buyerReplyEvent = eventWhere(buyerSocket, 'message.created', (item) => item.body === 'Admin đã nhận được yêu cầu');
    await api(`/admin/conversations/${conversation.id}/reply`, { method: 'POST', headers: { authorization: `Bearer ${admin.token}` }, body: JSON.stringify({ text: 'Admin đã nhận được yêu cầu' }) });
    assert.equal((await buyerHandoffEvent).body, 'Tôi đã chuyển tin nhắn này đến bộ phận chuyên môn.');
    assert.equal((await buyerReplyEvent).body, 'Admin đã nhận được yêu cầu');

    const secondBuyerEvent = eventWhere(adminSocket, 'message.created', (item) => item.body === 'Tin nhắn sau khi Admin tiếp quản');
    await api(`/conversations/${conversation.id}/messages`, { method: 'POST', headers: { authorization: `Bearer ${buyer.token}` }, body: JSON.stringify({ text: 'Tin nhắn sau khi Admin tiếp quản' }) });
    await secondBuyerEvent;
    let stored = await db.message.count({ where: { conversationId: conversation.id } });
    assert.equal(stored, 5);

    const automationEnabledEvent = eventWhere(adminSocket, 'conversation.automation.changed', (item) => item.conversationId === conversation.id && item.automationEnabled === true);
    await api(`/admin/conversations/${conversation.id}/automation`, { method: 'PATCH', headers: { authorization: `Bearer ${admin.token}` }, body: JSON.stringify({ enabled: true }) });
    await automationEnabledEvent;
    const resumedBotEvent = eventWhere(buyerSocket, 'message.created', (item) => item.body?.startsWith('Dạ,'));
    await api(`/conversations/${conversation.id}/messages`, { method: 'POST', headers: { authorization: `Bearer ${buyer.token}` }, body: JSON.stringify({ text: 'Bot hãy hỗ trợ lại' }) });
    await resumedBotEvent;
    stored = await db.message.count({ where: { conversationId: conversation.id } });
    assert.equal(stored, 7);

    const automationDisabledEvent = eventWhere(adminSocket, 'conversation.automation.changed', (item) => item.conversationId === conversation.id && item.automationEnabled === false);
    await api(`/admin/conversations/${conversation.id}/automation`, { method: 'PATCH', headers: { authorization: `Bearer ${admin.token}` }, body: JSON.stringify({ enabled: false }) });
    await automationDisabledEvent;
    await api(`/conversations/${conversation.id}/messages`, { method: 'POST', headers: { authorization: `Bearer ${buyer.token}` }, body: JSON.stringify({ text: 'Bot không được trả lời tin này' }) });
    stored = await db.message.count({ where: { conversationId: conversation.id } });
    assert.equal(stored, 8);
    const state = await db.conversation.findUnique({ where: { id: conversation.id } });
    assert.equal(state.automationEnabled, false);
    assert.ok(state.handoffAt);
    const handoffCount = await db.message.count({ where: { conversationId: conversation.id, body: 'Tôi đã chuyển tin nhắn này đến bộ phận chuyên môn.' } });
    assert.equal(handoffCount, 1);
    console.log('Chat E2E passed: per-inbox Auto on/off + realtime + Admin takeover + resume');
  } finally {
    buyerSocket?.disconnect(); adminSocket?.disconnect();
    if (conversation) await db.conversation.delete({ where: { id: conversation.id } }).catch(() => {});
    if (buyer?.user?.id) await db.user.delete({ where: { id: buyer.user.id } }).catch(() => {});
    await db.$disconnect();
  }
}
main().catch((error) => { console.error(error); process.exit(1); });
