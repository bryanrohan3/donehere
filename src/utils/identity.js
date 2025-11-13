const ADJECTIVES = [
  "Windy",
  "Cheeky",
  "Silent",
  "Smelly",
  "Explosive",
  "Thunderous",
  "Tiny",
  "Bubbly",
  "Wet",
  "Stealthy",
];

const NOUNS = [
  "Farter",
  "Tooter",
  "GasMaster",
  "WindWizard",
  "CheekChampion",
  "CloudMaker",
  "ButtBard",
  "StinkMage",
  "BlastBeast",
  "BumBard",
];

export function getIdentity() {
  let deviceId = localStorage.getItem("deviceId");
  let username = localStorage.getItem("username");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  if (!username) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = Math.floor(Math.random() * 100);
    username = `${adj}${noun}${num}`;
    localStorage.setItem("username", username);
  }

  return { deviceId, username };
}

export function setUsername(newName) {
  if (!newName || newName.length < 3) return false;
  localStorage.setItem("username", newName);
  return true;
}
