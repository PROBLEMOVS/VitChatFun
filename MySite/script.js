import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase, ref, set, push, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 🔧 Firebase конфіг
const firebaseConfig = {
  apiKey: "AIzaSyA2OlOHug5WwibrhxqrQJ4YbDa5rsL6Jfw",
  authDomain: "vitchatfun.firebaseapp.com",
  databaseURL: "https://vitchatfun-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "vitchatfun",
  storageBucket: "vitchatfun.appspot.com",
  messagingSenderId: "534399167962",
  appId: "1:534399167962:web:b204667198d1ba858d64e3",
  measurementId: "G-3F1ZF40D3N"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🎯 Змінні
let username = "";
let currentGroup = "";
let isLeader = false;

const regScreen = document.getElementById("registration");
const mainApp = document.getElementById("mainApp");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const usernameInput = document.getElementById("usernameInput");

guestLoginBtn.onclick = () => {
  const name = usernameInput.value.trim();
  if (!name) return alert("Введіть ім’я");
  username = name;
  regScreen.style.display = "none";
  mainApp.style.display = "block";
  activateTab('chat');
};

function activateTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tc => {
    tc.style.display = (tc.id === tabId) ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
}

// 🔁 Вкладки
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    activateTab(btn.dataset.tab);
  });
});

// 📦 Чат
const groupSelection = document.getElementById("groupSelection");
const createGroupForm = document.getElementById("createGroupForm");
const joinGroupForm = document.getElementById("joinGroupForm");
const chatRoom = document.getElementById("chatRoom");

document.getElementById("createGroupBtn").onclick = () => {
  groupSelection.style.display = "none";
  createGroupForm.style.display = "block";
};
document.getElementById("cancelCreateGroupBtn").onclick = () => {
  createGroupForm.style.display = "none";
  groupSelection.style.display = "block";
};
document.getElementById("joinGroupBtn").onclick = () => {
  groupSelection.style.display = "none";
  joinGroupForm.style.display = "block";
};
document.getElementById("cancelJoinGroupBtn").onclick = () => {
  joinGroupForm.style.display = "none";
  groupSelection.style.display = "block";
};

// ✅ Створити групу
document.getElementById("confirmCreateGroupBtn").onclick = async () => {
  const name = document.getElementById("createGroupName").value.trim();
  const pass = document.getElementById("createGroupPass").value.trim();
  if (!name) return alert("Введіть назву групи");

  const groupRef = ref(db, "groups/" + name);
  onValue(groupRef, snap => {
    if (snap.exists()) {
      alert("Група вже існує");
    } else {
      set(groupRef, {
        password: pass || null,
        leader: username,
        users: { [username]: true },
        messages: {}
      });
      joinGroup(name);
    }
  }, { onlyOnce: true });
};

// 🔓 Приєднатись
document.getElementById("confirmJoinGroupBtn").onclick = async () => {
  const name = document.getElementById("joinGroupName").value.trim();
  const pass = document.getElementById("joinGroupPass").value.trim();

  const groupRef = ref(db, "groups/" + name);
  onValue(groupRef, snap => {
    if (!snap.exists()) return alert("Такої групи немає");
    const data = snap.val();
    if (data.password && data.password !== pass) return alert("Невірний пароль");

    update(ref(db, `groups/${name}/users`), {
      [username]: true
    });
    joinGroup(name);
  }, { onlyOnce: true });
};

function joinGroup(name) {
  currentGroup = name;
  groupSelection.style.display = "none";
  createGroupForm.style.display = "none";
  joinGroupForm.style.display = "none";
  chatRoom.style.display = "flex";

  document.getElementById("currentGroupName").textContent = name;

  // Чи лідер
  onValue(ref(db, `groups/${name}/leader`), snap => {
    isLeader = snap.val() === username;
    document.getElementById("kickUserBtn").style.display = isLeader ? "inline-block" : "none";
    document.getElementById("deleteGroupBtn").style.display = isLeader ? "inline-block" : "none";
  }, { onlyOnce: true });

  listenToChat(name);
  listenToUsers(name);
}

// 📡 Слухачі
let msgListener, userListener;

function listenToChat(name) {
  const msgRef = ref(db, `groups/${name}/messages`);
  msgListener = onValue(msgRef, snap => {
    const chat = document.getElementById("chatMessages");
    chat.innerHTML = "";
    if (!snap.exists()) return;
    Object.values(snap.val()).forEach(m => {
      const div = document.createElement("div");
      div.textContent = `${m.user}: ${m.text}`;
      div.className = "message " + (m.user === username ? "self" : "other");
      chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;
  });
}

function listenToUsers(name) {
  const usersRef = ref(db, `groups/${name}/users`);
  userListener = onValue(usersRef, snap => {
    const list = document.getElementById("usersUl");
    list.innerHTML = "";
    const users = snap.val() || {};
    document.getElementById("usersCount").textContent = Object.keys(users).length;
    for (let u in users) {
      const li = document.createElement("li");
      li.textContent = u;
      if (isLeader && u !== username) {
        const kick = document.createElement("button");
        kick.textContent = "Вигнати";
        kick.onclick = () => kickUser(u);
        li.appendChild(kick);
      }
      list.appendChild(li);
    }
  });
}

// 💬 Надіслати повідомлення
document.getElementById("sendMessageBtn").onclick = () => {
  const text = document.getElementById("messageInput").value.trim();
  if (!text) return;
  const msgRef = push(ref(db, `groups/${currentGroup}/messages`));
  set(msgRef, {
    user: username,
    text
  });
  document.getElementById("messageInput").value = "";
};

// ❌ Вийти
document.getElementById("leaveGroupBtn").onclick = () => {
  update(ref(db, `groups/${currentGroup}/users`), { [username]: null });
  currentGroup = "";
  chatRoom.style.display = "none";
  groupSelection.style.display = "block";
  clearListeners();
};

// ❌ Видалити
document.getElementById("deleteGroupBtn").onclick = () => {
  if (!isLeader) return;
  if (!confirm("Видалити групу повністю?")) return;
  remove(ref(db, `groups/${currentGroup}`));
  currentGroup = "";
  chatRoom.style.display = "none";
  groupSelection.style.display = "block";
  clearListeners();
};

// ❌ Вигнати
function kickUser(user) {
  update(ref(db, `groups/${currentGroup}/users`), { [user]: null });
}

function clearListeners() {
  if (msgListener) msgListener();
  if (userListener) userListener();
}