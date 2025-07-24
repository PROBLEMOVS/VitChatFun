// script.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA2OlOHug5WwibrhxqrQJ4YbDa5rsL6Jfw",
  authDomain: "vitchatfun.firebaseapp.com",
  databaseURL: "https://vitchatfun-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "vitchatfun",
  storageBucket: "vitchatfun.appspot.com",
  messagingSenderId: "534399167962",
  appId: "1:534399167962:web:b204667198d64e3",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const registration = document.getElementById("registration");
const usernameInput = document.getElementById("usernameInput");
const guestLoginBtn = document.getElementById("guestLoginBtn");
const avatarList = document.getElementById("avatarList");

const mainApp = document.getElementById("mainApp");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

let currentUser = null;
let currentGroup = null;
let currentGroupLeader = null;

const chatMessages = document.getElementById("chatMessages");
const usersUl = document.getElementById("usersUl");
const usersCount = document.getElementById("usersCount");

const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");

const createGroupBtn = document.getElementById("createGroupBtn");
const joinGroupBtn = document.getElementById("joinGroupBtn");

const createGroupForm = document.getElementById("createGroupForm");
const joinGroupForm = document.getElementById("joinGroupForm");
const groupSelection = document.getElementById("groupSelection");

const createGroupName = document.getElementById("createGroupName");
const createGroupPass = document.getElementById("createGroupPass");
const confirmCreateGroupBtn = document.getElementById("confirmCreateGroupBtn");
const cancelCreateGroupBtn = document.getElementById("cancelCreateGroupBtn");

const joinGroupName = document.getElementById("joinGroupName");
const joinGroupPass = document.getElementById("joinGroupPass");
const confirmJoinGroupBtn = document.getElementById("confirmJoinGroupBtn");
const cancelJoinGroupBtn = document.getElementById("cancelJoinGroupBtn");

const chatRoom = document.getElementById("chatRoom");
const currentGroupNameSpan = document.getElementById("currentGroupName");

const leaveGroupBtn = document.getElementById("leaveGroupBtn");
const deleteGroupBtn = document.getElementById("deleteGroupBtn");

// Аватарки
const avatarUrls = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/65.jpg",
  "https://randomuser.me/api/portraits/women/12.jpg",
  "https://randomuser.me/api/portraits/men/18.jpg",
  "https://randomuser.me/api/portraits/women/25.jpg",
  "https://randomuser.me/api/portraits/men/90.jpg",
  "https://randomuser.me/api/portraits/women/80.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/52.jpg"
];

let selectedAvatarIndex = 0;

function renderAvatars() {
  avatarList.innerHTML = "";
  avatarUrls.forEach((url, i) => {
    const img = document.createElement("img");
    img.src = url;
    img.alt = "avatar";
    img.style.cursor = "pointer";
    img.style.width = "48px";
    img.style.height = "48px";
    img.style.borderRadius = "50%";
    img.style.border = i === selectedAvatarIndex ? "3px solid blue" : "2px solid gray";
    img.style.marginRight = "5px";
    img.addEventListener("click", () => {
      selectedAvatarIndex = i;
      renderAvatars();
    });
    avatarList.appendChild(img);
  });
}

guestLoginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  if (!username) {
    alert("Введіть ім'я!");
    return;
  }
  currentUser = {
    name: username,
    avatar: avatarUrls[selectedAvatarIndex],
    id: "user_" + Math.random().toString(36).substr(2, 9),
  };
  registration.style.display = "none";
  mainApp.style.display = "block";
  console.log("User logged in:", currentUser);
});

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.getAttribute("data-tab");
    tabContents.forEach(tc => (tc.style.display = tc.id === target ? "block" : "none"));
  });
});

// Створення групи
createGroupBtn.onclick = () => {
  groupSelection.style.display = "none";
  createGroupForm.style.display = "block";
};
cancelCreateGroupBtn.onclick = () => {
  createGroupForm.style.display = "none";
  groupSelection.style.display = "block";
  createGroupName.value = "";
  createGroupPass.value = "";
};

// Приєднання до групи
joinGroupBtn.onclick = () => {
  groupSelection.style.display = "none";
  joinGroupForm.style.display = "block";
};
cancelJoinGroupBtn.onclick = () => {
  joinGroupForm.style.display = "none";
  groupSelection.style.display = "block";
  joinGroupName.value = "";
  joinGroupPass.value = "";
};

confirmCreateGroupBtn.onclick = async () => {
  const groupName = createGroupName.value.trim();
  if (!groupName) {
    alert("Введіть назву групи");
    return;
  }
  const password = createGroupPass.value;

  const groupRef = ref(db, `groups/${groupName}`);
  const snapshot = await new Promise(resolve => {
    onValue(groupRef, snap => resolve(snap), { onlyOnce: true });
  });

  if (snapshot.exists()) {
    alert("Група з такою назвою вже існує");
    return;
  }

  await set(groupRef, {
    password: password || "",
    leaderId: currentUser.id,
    users: {
      [currentUser.id]: {
        name: currentUser.name,
        avatar: currentUser.avatar,
      }
    },
    messages: {}
  });

  enterGroup(groupName);
};

confirmJoinGroupBtn.onclick = async () => {
  const groupName = joinGroupName.value.trim();
  if (!groupName) {
    alert("Введіть назву групи");
    return;
  }
  const password = joinGroupPass.value;

  const groupRef = ref(db, `groups/${groupName}`);
  const snapshot = await new Promise(resolve => {
    onValue(groupRef, snap => resolve(snap), { onlyOnce: true });
  });

  if (!snapshot.exists()) {
    alert("Такої групи не існує");
    return;
  }

  const groupData = snapshot.val();
  if (groupData.password !== password) {
    alert("Неправильний пароль");
    return;
  }

  const userRef = ref(db, `groups/${groupName}/users/${currentUser.id}`);
  await set(userRef, {
    name: currentUser.name,
    avatar: currentUser.avatar
  });

  enterGroup(groupName);
};

function enterGroup(groupName) {
  currentGroup = groupName;
  currentGroupNameSpan.textContent = groupName;
  groupSelection.style.display = "none";
  createGroupForm.style.display = "none";
  joinGroupForm.style.display = "none";
  chatRoom.style.display = "block";

  const groupLeaderRef = ref(db, `groups/${currentGroup}/leaderId`);
  onValue(groupLeaderRef, snap => {
    currentGroupLeader = snap.val();
    deleteGroupBtn.style.display = currentUser.id === currentGroupLeader ? "inline-block" : "none";
  });

  listenMessages();
  listenUsers();
}

sendMessageBtn.onclick = async () => {
  const text = messageInput.value.trim();
  if (!text || !currentGroup) return;

  const messagesRef = ref(db, `groups/${currentGroup}/messages`);
  const newMsgRef = push(messagesRef);
  await set(newMsgRef, {
    userId: currentUser.id,
    name: currentUser.name,
    avatar: currentUser.avatar,
    text,
    timestamp: Date.now(),
  });

  messageInput.value = "";
};

function listenMessages() {
  const messagesRef = ref(db, `groups/${currentGroup}/messages`);
  onValue(messagesRef, snapshot => {
    chatMessages.innerHTML = "";
    const data = snapshot.val();
    if (!data) return;

    const sortedMessages = Object.entries(data).sort((a, b) => a[1].timestamp - b[1].timestamp);

    for (const [msgId, msg] of sortedMessages) {
      const div = document.createElement("div");
      div.classList.add("message");
      div.classList.add(msg.userId === currentUser.id ? "self" : "other");

      div.innerHTML = `
        <img src="${msg.avatar}" alt="avatar" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:8px;">
        <b>${msg.name}:</b> ${msg.text}
      `;
      chatMessages.appendChild(div);
    }
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function listenUsers() {
  const usersRef = ref(db, `groups/${currentGroup}/users`);
  onValue(usersRef, snapshot => {
    const users = snapshot.val() || {};
    usersUl.innerHTML = "";
    const count = Object.keys(users).length;
    usersCount.textContent = count;

    for (const [userId, user] of Object.entries(users)) {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${user.avatar}" alt="avatar" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px;">
        ${user.name}
      `;

      if (currentUser.id === currentGroupLeader && userId !== currentUser.id) {
        const kickBtn = document.createElement("button");
        kickBtn.textContent = "Вигнати";
        kickBtn.style.marginLeft = "8px";
        kickBtn.onclick = () => kickUser(userId);
        li.appendChild(kickBtn);
      }

      usersUl.appendChild(li);
    }
  });
}

async function kickUser(userId) {
  if (!confirm("Ви впевнені, що хочете вигнати цього користувача?")) return;
  await remove(ref(db, `groups/${currentGroup}/users/${userId}`));
}

leaveGroupBtn.onclick = async () => {
  if (!currentGroup) return;
  await remove(ref(db, `groups/${currentGroup}/users/${currentUser.id}`));
  resetToGroupSelection();
};

deleteGroupBtn.onclick = async () => {
  if (!confirm("Ви впевнені, що хочете видалити групу? Це назавжди.")) return;
  await remove(ref(db, `groups/${currentGroup}`));
  resetToGroupSelection();
};

function resetToGroupSelection() {
  currentGroup = null;
  chatRoom.style.display = "none";
  groupSelection.style.display = "block";
  chatMessages.innerHTML = "";
  usersUl.innerHTML = "";
  usersCount.textContent = "0";
}

renderAvatars();