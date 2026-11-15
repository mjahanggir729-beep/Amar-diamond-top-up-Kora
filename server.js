const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_SESSIONS = new Map();
const USER_SESSION_MS = 24 * 60 * 60 * 1000;
​function loadUsers() {
try {
if (fs.existsSync(USERS_FILE)) {
return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}
} catch (e) {}
return {};
}
​function saveUsers(users) {
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
if (typeof USE_GH !== 'undefined' && USE_GH && storage.ok) {
enqueue(() => ghPut(GH_DIR + '/users.json', Buffer.from(JSON.stringify(users, null, 2)), 'Update users'));
}
}
​function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
return { salt, hash };
}
​function parseCookies(req) {
const list = {};
const rc = req.headers.cookie;
if (rc) {
rc.split(';').forEach(cookie => {
const parts = cookie.split('=');
list[parts.shift().trim()] = decodeURI(parts.join('='));
});
}
return list;
}
​function getAuthenticatedUser(req) {
const cookies = parseCookies(req);
const token = cookies.ffx_user_session;
if (!token || !USER_SESSIONS.has(token)) return null;
const session = USER_SESSIONS.get(token);
if (Date.now() - session.createdAt > USER_SESSION_MS) {
USER_SESSIONS.delete(token);
return null;
}
return session.username;
}