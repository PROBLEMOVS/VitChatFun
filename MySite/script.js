   // Твої налаштування Firebase
    const firebaseConfig = {
      apiKey: "AIzaSyA2OlOHug5WwibrhxqrQJ4YbDa5rsL6Jfw",
      authDomain: "vitchatfun.firebaseapp.com",
      databaseURL: "https://vitchatfun-default-rtdb.europe-west1.firebasedatabase.app/",
      projectId: "vitchatfun",
      storageBucket: "vitchatfun.appspot.com",
      messagingSenderId: "534399167962",
      appId: "1:534399167962:web:b204667198d64e3",
    };

    // Ініціалізація Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // --- DOM ---
    const registration = document.getElementById("registration");
    const usernameInput = document.getElementById("usernameInput");
    const guestLoginBtn = document.getElementById("guestLoginBtn");
    const avatarList = document.getElementById("avatarList");
    const selectedAvatarImg = document.getElementById("selectedAvatar");

    const mainApp = document.getElementById("mainApp");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    const groupSelection = document.getElementById("groupSelection");
    const createGroupBtn = document.getElementById("createGroupBtn");
    const joinGroupBtn = document.getElementById("joinGroupBtn");

    const createGroupForm = document.getElementById("createGroupForm");
    const createGroupName = document.getElementById("createGroupName");
    const createGroupPass = document.getElementById("createGroupPass");
    const confirmCreateGroupBtn = document.getElementById("confirmCreateGroupBtn");
    const cancelCreateGroupBtn = document.getElementById("cancelCreateGroupBtn");

    const joinGroupForm = document.getElementById("joinGroupForm");
    const joinGroupName = document.getElementById("joinGroupName");
    const joinGroupPass = document.getElementById("joinGroupPass");
    const confirmJoinGroupBtn = document.getElementById("confirmJoinGroupBtn");
    const cancelJoinGroupBtn = document.getElementById("cancelJoinGroupBtn");

    const chatRoom = document.getElementById("chatTab");
    const currentGroupNameSpan = document.getElementById("currentGroupName");
    const chatMessages = document.getElementById("chatMessages");

    const usersUl = document.getElementById("usersUl");
    const usersCount = document.getElementById("usersCount");

    const messageInput = document.getElementById("messageInput");
    const sendMessageBtn = document.getElementById("sendMessageBtn");

    const leaveGroupBtn = document.getElementById("leaveGroupBtn");
    const deleteGroupBtn = document.getElementById("deleteGroupBtn");

    // --- Аватарки ---
    const avatarUrls = [
      "https://i.pravatar.cc/48?img=1",
      "https://i.pravatar.cc/48?img=2",
      "https://i.pravatar.cc/48?img=3",
      "https://i.pravatar.cc/48?img=4",
      "https://i.pravatar.cc/48?img=5",
      "https://i.pravatar.cc/48?img=6",
      "https://i.pravatar.cc/48?img=7",
      "https://i.pravatar.cc/48?img=8",
      "https://i.pravatar.cc/48?img=9",
      "https://i.pravatar.cc/48?img=10",
    ];

    let selectedAvatarIndex = 0;
    let currentUser = null;
    let currentGroup = null;
    let currentGroupLeader = null;

    // Відобразити аватарки та вибрати
    function renderAvatars() {
      avatarList.innerHTML = "";
      avatarUrls.forEach((url, i) => {
        const img = document.createElement("img");
        img.src = url;
        img.alt = "avatar";
        if (i === selectedAvatarIndex) img.classList.add("selected");
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          selectedAvatarIndex = i;
          selectedAvatarImg.src = avatarUrls[selectedAvatarIndex];
          document.querySelectorAll("#avatarList img").forEach(img => img.classList.remove("selected"));
          img.classList.add("selected");
        });
        avatarList.appendChild(img);
      });
      selectedAvatarImg.src = avatarUrls[selectedAvatarIndex];
    }

    // --- Вхід ---
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

    // --- Вкладки ---
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const target = btn.getAttribute("data-tab");
        tabContents.forEach(tc => (tc.style.display = tc.id === target ? "block" : "none"));
      });
    });

    // --- Управління групами ---
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

    // --- Створення групи ---
    confirmCreateGroupBtn.onclick = async () => {
      const groupName = createGroupName.value.trim();
      if (!groupName) {
        alert("Введіть назву групи");
        return;
      }
      const password = createGroupPass.value;

      const groupRef = db.ref(`groups/${groupName}`);
      const snapshot = await groupRef.once('value');

      if (snapshot.exists()) {
        alert("Група з такою назвою вже існує");
        return;
      }

      await groupRef.set({
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

    // --- Приєднання до групи ---
    confirmJoinGroupBtn.onclick = async () => {
      const groupName = joinGroupName.value.trim();
      if (!groupName) {
        alert("Введіть назву групи");
        return;
      }
      const password = joinGroupPass.value;

      const groupRef = db.ref(`groups/${groupName}`);
      const snapshot = await groupRef.once('value');

      if (!snapshot.exists()) {
        alert("Такої групи не існує");
        return;
      }

      const groupData = snapshot.val();
      if (groupData.password !== password) {
        alert("Неправильний пароль");
        return;
      }

      // Додаємо користувача в групу
      const userRef = db.ref(`groups/${groupName}/users/${currentUser.id}`);
      await userRef.set({
        name: currentUser.name,
        avatar: currentUser.avatar
      });

      enterGroup(groupName);
    };

    // --- Вхід у групу ---
    function enterGroup(groupName) {
      currentGroup = groupName;
      currentGroupNameSpan.textContent = groupName;
      groupSelection.style.display = "none";
      createGroupForm.style.display = "none";
      joinGroupForm.style.display = "none";
      chatRoom.style.display = "block";

      // Перевірка лідера
      const groupLeaderRef = db.ref(`groups/${currentGroup}/leaderId`);
      groupLeaderRef.on('value', snap => {
        currentGroupLeader = snap.val();
        if (currentUser.id === currentGroupLeader) {
          deleteGroupBtn.style.display = "inline-block";
        } else {
          deleteGroupBtn.style.display = "none";
        }
      });

      listenMessages();
      listenUsers();
      // Перемикаємось на вкладку чат
      tabButtons.forEach(b => b.classList.remove("active"));
      tabContents.forEach(tc => (tc.style.display = "none"));
      document.querySelector(`.tab-btn[data-tab="chatTab"]`).classList.add("active");
      chatRoom.style.display = "block";
    }

    // --- Відправка повідомлення ---
    sendMessageBtn.onclick = async () => {
      const text = messageInput.value.trim();
      if (!text) return;
      if (!currentGroup) return;

      const messagesRef = db.ref(`groups/${currentGroup}/messages`);
      const newMsgRef = messagesRef.push();
      await newMsgRef.set({
        userId: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        text,
        timestamp: Date.now(),
      });

      messageInput.value = "";
    };

    // --- Слухаємо повідомлення ---
    function listenMessages() {
      const messagesRef = db.ref(`groups/${currentGroup}/messages`);
      messagesRef.on('value', snapshot => {
        chatMessages.innerHTML = "";
        const msgs = [];
        snapshot.forEach(childSnap => {
          msgs.push(childSnap.val());
        });
        msgs.sort((a,b) => a.timestamp - b.timestamp);
        msgs.forEach(msg => {
          const div = document.createElement("div");
          div.classList.add("message");
          if (msg.userId === currentUser.id) div.classList.add("self");
          else div.classList.add("other");

          div.innerHTML = `
            <img src="${msg.avatar}" alt="avatar" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:8px;">
            <strong>${msg.name}:</strong> ${msg.text}
          `;
          chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }

    // --- Слухаємо користувачів ---
    function listenUsers() {
      const usersRef = db.ref(`groups/${currentGroup}/users`);
      usersRef.on('value', snapshot => {
        usersUl.innerHTML = "";
        let count = 0;
        snapshot.forEach(childSnap => {
          const user = childSnap.val();
          const li = document.createElement("li");
          li.innerHTML = `<img src="${user.avatar}" alt="avatar" style="width:24px; height:24px; border-radius:50%; vertical-align:middle; margin-right:8px;"> ${user.name}`;
          usersUl.appendChild(li);
          count++;
        });
        usersCount.textContent = count;
      });
    }

    // --- Вихід з групи ---
    leaveGroupBtn.onclick = async () => {
      if (!currentGroup) return;

      const userRef = db.ref(`groups/${currentGroup}/users/${currentUser.id}`);
      await userRef.remove();

      chatRoom.style.display = "none";
      groupSelection.style.display = "block";
      currentGroup = null;
      chatMessages.innerHTML = "";
      usersUl.innerHTML = "";
    };

    // --- Видалити групу ---
    deleteGroupBtn.onclick = async () => {
      if (!currentGroup || currentUser.id !== currentGroupLeader) return;

      if (!confirm("Ви дійсно хочете видалити цю групу? Це не можна скасувати.")) return;

      const groupRef = db.ref(`groups/${currentGroup}`);
      await groupRef.remove();

      alert("Групу видалено");

      chatRoom.style.display = "none";
      groupSelection.style.display = "block";
      currentGroup = null;
      chatMessages.innerHTML = "";
      usersUl.innerHTML = "";
    };

    // --- Ініціалізація ---
    renderAvatars();