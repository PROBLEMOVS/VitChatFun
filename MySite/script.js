 // Конфіг Firebase (твій)
    const firebaseConfig = {
      apiKey: "AIzaSyA2OlOHug5WwibrhxqrQJ4YbDa5rsL6Jfw",
      authDomain: "vitchatfun.firebaseapp.com",
      databaseURL: "https://vitchatfun-default-rtdb.firebaseio.com",
      projectId: "vitchatfun",
      storageBucket: "vitchatfun.firebasestorage.app",
      messagingSenderId: "534399167962",
      appId: "1:534399167962:web:b204667198d1ba858d64e3",
      measurementId: "G-3F1ZF40D3N"
    };

    // Ініціалізація Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    let currentUser = "";
    let currentGroup = "";

    // Вхід з іменем
    function enterSite() {
      const name = document.getElementById('username').value.trim();
      if (!name) {
        alert("Введіть ім’я!");
        return;
      }
      currentUser = name;
      document.getElementById('login-screen').classList.add('hidden');
      document.getElementById('group-selection').classList.remove('hidden');
    }

    // Створення групи
    function createGroup() {
      const groupName = document.getElementById('new-group-name').value.trim();
      if (!groupName) {
        alert("Введіть назву групи");
        return;
      }
      currentGroup = groupName;
      showMainMenu();
      showChat();
    }

    // Вхід в групу
    function joinGroup() {
      const groupName = document.getElementById('join-group-name').value.trim();
      if (!groupName) {
        alert("Введіть назву групи");
        return;
      }
      currentGroup = groupName;
      showMainMenu();
      showChat();
    }

    // Показати головне меню
    function showMainMenu() {
      document.getElementById('group-selection').classList.add('hidden');
      document.getElementById('main-menu').classList.remove('hidden');
    }

    // Показати потрібну секцію
    function showSection(section) {
      if (section === "chat") {
        document.getElementById('chat-section').style.display = "flex";
        alert("Поки працює тільки чат.");
      } else {
        alert("Функція в розробці.");
      }
    }

    // Показати чат
    function showChat() {
      document.getElementById('chat-section').style.display = 'flex';
      document.getElementById('chat-header').innerText = `Група: ${currentGroup}`;
      listenMessages();
    }

    // Відправка повідомлення
    function sendMessage() {
      const msgInput = document.getElementById('message-input');
      const text = msgInput.value.trim();
      if (!text) return;
      const messagesRef = db.ref(`groups/${currentGroup}/messages`);
      messagesRef.push({
        user: currentUser,
        text: text,
        timestamp: Date.now()
      });
      msgInput.value = "";
    }

    // Прослуховування повідомлень
    function listenMessages() {
      const messagesRef = db.ref(`groups/${currentGroup}/messages`);
      const chatMessages = document.getElementById('chat-messages');
      chatMessages.innerHTML = "";

      messagesRef.off(); // Відписатися від попередніх прослуховувачів
      messagesRef.on('value', snapshot => {
        chatMessages.innerHTML = "";
        const data = snapshot.val();
        if (data) {
          Object.values(data).forEach(msg => {
            const div = document.createElement('div');
            div.className = 'message';
            div.textContent = `${msg.user}: ${msg.text}`;
            chatMessages.appendChild(div);
          });
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      });
    }