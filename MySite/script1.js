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
  const avatarList = document.getElementById("avatarList");
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

    img.addEventListener("click", () => {
      selectedAvatarIndex = i;
      updateSelectedAvatar();
      renderAvatars();
    });

    avatarList.appendChild(img);
  });

  updateSelectedAvatar();
}

function updateSelectedAvatar() {
  const selectedAvatar = document.getElementById("selectedAvatar");
  selectedAvatar.src = avatarUrls[selectedAvatarIndex];
}

window.onload = () => {
  renderAvatars();
};
