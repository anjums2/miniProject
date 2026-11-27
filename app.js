const guideData = {
  phishing: {
    icon: "✉",
    kicker: "PHISHING GUIDE",
    title: "Pause before you click",
    text: "Phishing messages are designed to create urgency and pressure you into acting before checking.",
    steps: [
      "Check the sender’s full email address or phone number.",
      "Never share OTPs, passwords, or card PINs.",
      "Open the official app or website yourself instead of using the link.",
      "Report suspicious messages and delete them."
    ]
  },
  arrest: {
    icon: "!",
    kicker: "DIGITAL ARREST GUIDE",
    title: "No agency conducts arrest by video call",
    text: "Police and government agencies do not demand money, secrecy, or account transfers over a call.",
    steps: [
      "Disconnect immediately and do not continue the call.",
      "Do not share an OTP, Aadhaar, PAN, or bank details.",
      "Do not transfer money or install remote-control apps.",
      "Verify through the official agency website and call 1930."
    ]
  },
  apps: {
    icon: "▣",
    kicker: "APP SAFETY GUIDE",
    title: "Review before you install",
    text: "A convincing icon or a few positive reviews does not prove that an app is safe.",
    steps: [
      "Download only from official app stores.",
      "Check the developer, download count, reviews, and permissions.",
      "Reject accessibility, notification, or SMS access unless truly required.",
      "Uninstall unknown apps and run a trusted security scan."
    ]
  },
  emergency: {
    icon: "☎",
    kicker: "IF YOU ARE AT RISK",
    title: "Take action now",
    text: "If money or data may be compromised, speed matters. Follow these steps and keep evidence.",
    steps: [
      "Call 1930 immediately for cyber-fraud assistance.",
      "Call 112 for urgent physical safety concerns.",
      "Contact your bank to freeze the affected account or card.",
      "Report the incident at cybercrime.gov.in."
    ]
  }
};

const guideModal = document.getElementById("guideModal");
const assessmentModal = document.getElementById("assessmentModal");
const learningStorageKey = "cybershield-learning-progress-v1";
const learningTopics = [
  { id: "phishing", label: "Phishing attacks" },
  { id: "apps", label: "Malicious applications" },
  { id: "arrest", label: "Digital arrest scams" }
];
const themeStorageKey = "cybershield-theme-v1";
const themeToggle = document.getElementById("themeToggle");
const themeStatus = document.getElementById("themeStatus");

function applyTheme(theme, savePreference) {
  document.documentElement.dataset.theme = theme;
  const action = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  themeToggle.setAttribute("aria-label", action);
  themeToggle.setAttribute("title", action);
  themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#081421" : "#07111f");

  if (!savePreference) return;
  try {
    localStorage.setItem(themeStorageKey, theme);
    themeStatus.textContent = `Switched to ${theme} mode.`;
  } catch (error) {
    themeStatus.textContent = "Theme changed for this session, but the preference could not be saved in this browser.";
  }
}

let initialTheme = "light";
try {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme === "light" || savedTheme === "dark") initialTheme = savedTheme;
} catch (error) {
  themeStatus.textContent = "Theme preference could not be read; using light mode.";
}
applyTheme(initialTheme, false);
themeToggle.addEventListener("click", () => {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(nextTheme, true);
});

function createEmptyProgress() {
  return {
    version: 1,
    completedQuizzes: 0,
    highestQuizScore: null,
    exploredTopics: [],
    completedQuizTopics: []
  };
}

function setProgressStatus(message, isError) {
  const status = document.getElementById("progressStatus");
  status.textContent = message;
  status.classList.toggle("storage-error", Boolean(isError));
}

function loadLearningProgress() {
  try {
    const saved = localStorage.getItem(learningStorageKey);
    if (!saved) return createEmptyProgress();

    const parsed = JSON.parse(saved);
    const validTopicIds = learningTopics.map(topic => topic.id);
    const validScore = parsed.highestQuizScore === null
      || (Number.isInteger(parsed.highestQuizScore) && parsed.highestQuizScore >= 0 && parsed.highestQuizScore <= 100);
    if (
      parsed.version !== 1
      || !Number.isInteger(parsed.completedQuizzes)
      || parsed.completedQuizzes < 0
      || !validScore
      || !Array.isArray(parsed.exploredTopics)
      || !Array.isArray(parsed.completedQuizTopics)
    ) {
      throw new Error("Saved learning progress has an unsupported format.");
    }

    return {
      version: 1,
      completedQuizzes: parsed.completedQuizzes,
      highestQuizScore: parsed.highestQuizScore,
      exploredTopics: [...new Set(parsed.exploredTopics.filter(topic => validTopicIds.includes(topic)))],
      completedQuizTopics: [...new Set(parsed.completedQuizTopics.filter(topic => validTopicIds.includes(topic)))]
    };
  } catch (error) {
    setProgressStatus("Progress could not be read from this browser. You can continue, but saved progress may be unavailable.", true);
    return createEmptyProgress();
  }
}

let learningProgress = loadLearningProgress();

function renderLearningDashboard() {
  const exploredTopics = new Set(learningProgress.exploredTopics);
  const completedTopics = new Set(learningProgress.completedQuizTopics);
  document.getElementById("completedQuizCount").textContent = learningProgress.completedQuizzes;
  document.getElementById("highestQuizScore").textContent = learningProgress.highestQuizScore === null
    ? "—"
    : `${learningProgress.highestQuizScore}%`;
  document.getElementById("exploredTopicCount").textContent = `${exploredTopics.size} / ${learningTopics.length}`;
  document.getElementById("dashboardWelcome").hidden = exploredTopics.size > 0 || learningProgress.completedQuizzes > 0;

  let totalProgress = 0;
  learningTopics.forEach(topic => {
    const percent = completedTopics.has(topic.id) ? 100 : exploredTopics.has(topic.id) ? 50 : 0;
    totalProgress += percent;
    document.getElementById(`${topic.id}ProgressBar`).style.width = `${percent}%`;
    document.getElementById(`${topic.id}ProgressLabel`).textContent = percent === 100
      ? "Quiz complete"
      : percent === 50
        ? "Guide explored"
        : "Not started";
  });

  const overallProgress = Math.round(totalProgress / learningTopics.length);
  document.getElementById("overallProgressBar").style.width = `${overallProgress}%`;
  document.getElementById("overallProgressLabel").textContent = `${overallProgress}%`;
  document.querySelector(".overall-progress").setAttribute("aria-valuenow", overallProgress);

  const achievements = [
    ["badgeFirstTopic", exploredTopics.size > 0],
    ["badgeFirstQuiz", learningProgress.completedQuizzes > 0],
    ["badgeAllTopics", exploredTopics.size === learningTopics.length],
    ["badgeAllQuizzes", completedTopics.size === learningTopics.length]
  ];
  achievements.forEach(([id, earned]) => {
    const badge = document.getElementById(id);
    badge.classList.toggle("earned", earned);
    badge.querySelector(".badge-state").textContent = earned ? "Earned" : "Locked";
  });
}

function saveLearningProgress() {
  try {
    localStorage.setItem(learningStorageKey, JSON.stringify(learningProgress));
    setProgressStatus("Learning progress is saved on this device only.", false);
  } catch (error) {
    setProgressStatus("Progress could not be saved in this browser. Check its storage settings.", true);
  }
}

function recordTopicExplored(topicId) {
  if (!learningTopics.some(topic => topic.id === topicId) || learningProgress.exploredTopics.includes(topicId)) return;
  learningProgress.exploredTopics.push(topicId);
  saveLearningProgress();
  renderLearningDashboard();
}

function recordQuizCompletion(topicId, score) {
  learningProgress.completedQuizzes += 1;
  learningProgress.highestQuizScore = learningProgress.highestQuizScore === null
    ? score
    : Math.max(learningProgress.highestQuizScore, score);
  if (!learningProgress.completedQuizTopics.includes(topicId)) {
    learningProgress.completedQuizTopics.push(topicId);
  }
  if (!learningProgress.exploredTopics.includes(topicId)) learningProgress.exploredTopics.push(topicId);
  saveLearningProgress();
  renderLearningDashboard();
}

renderLearningDashboard();

function openGuide(topic) {
  const guide = guideData[topic] || guideData.phishing;
  recordTopicExplored(topic);
  document.getElementById("modalIcon").textContent = guide.icon;
  document.getElementById("modalKicker").textContent = guide.kicker;
  document.getElementById("modalTitle").textContent = guide.title;
  document.getElementById("modalText").textContent = guide.text;
  document.getElementById("modalSteps").innerHTML = guide.steps.map(step => `<li>${step}</li>`).join("");
  guideModal.showModal();
}

document.querySelectorAll("[data-topic]").forEach(element => {
  element.addEventListener("click", event => {
    event.stopPropagation();
    openGuide(element.dataset.topic);
  });
});

document.querySelectorAll(".modal-close").forEach(button => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.getElementByAll = document.querySelectorAll;
document.getElementById("emergencyButton").addEventListener("click", () => openGuide("emergency"));
document.getElementById("reportLink").addEventListener("click", () => openGuide("emergency"));
document.getElementById("watchGuide").addEventListener("click", () => openGuide("phishing"));
document.getElementById("modalAction").addEventListener("click", () => {
  guideModal.close();
  startAssessment();
});

const assessmentTopics = {
  phishing: {
    label: "PHISHING ATTACKS",
    highThreshold: 7,
    mediumThreshold: 3,
    highGuidance: "Stop responding. Do not click links or share passwords or OTPs. Verify through the organization’s official app or website. If you lost money, contact your bank and call 1930.",
    mediumGuidance: "Do not click, reply, or pay yet. Verify the sender through an official contact method and never share an OTP or password.",
    lowGuidance: "No common phishing indicators were reported. This does not prove a message is genuine; stay cautious with links and requests for information.",
    questions: [
      {
        title: "Did the message pressure you to click a link or act immediately?",
        answers: [
          ["Yes — it urged me to click or act now", 3],
          ["It gave me a deadline or limited time", 2],
          ["No — it was not pressuring me", 0]
        ]
      },
      {
        title: "Did the message ask for money, an OTP, password, or account details?",
        answers: [
          ["Yes — it requested payment or bank details", 3],
          ["Yes — it requested an OTP, PIN, or password", 3],
          ["No — it did not ask for sensitive information", 0]
        ]
      },
      {
        title: "Was the message unexpected or from an address/number you could not verify?",
        answers: [
          ["Yes — I do not recognize or cannot verify the sender", 3],
          ["I’m not sure who sent it", 1],
          ["No — I verified the sender independently", 0]
        ]
      },
      {
        title: "Have you clicked its link or shared information in response?",
        answers: [
          ["Yes — I shared information or made a payment", 3],
          ["I clicked, but did not share information", 1],
          ["No — I have not interacted", 0]
        ]
      }
    ]
  },
  apps: {
    label: "MALICIOUS APPLICATIONS",
    highThreshold: 5,
    mediumThreshold: 2,
    highGuidance: "Stop using the app and revoke permissions you do not trust. Uninstall it and run a trusted security scan. If you entered bank details, contact your bank promptly.",
    mediumGuidance: "Check the app’s developer and permissions. Do not grant access it does not need; uninstall it if you cannot verify it.",
    lowGuidance: "No common app warning signs were reported. This does not prove the app is safe; continue reviewing its source, developer, and permissions.",
    questions: [
      {
        title: "Where did you get the app you’re concerned about?",
        answers: [
          ["A direct message, ad, or unofficial website", 3],
          ["I’m not sure, or I installed it from outside an official app store", 2],
          ["An official app store, after checking the developer", 0]
        ]
      },
      {
        title: "Does the app request access that seems unrelated to what it does?",
        answers: [
          ["Yes — for example, SMS, Accessibility, or screen-control access", 3],
          ["I haven’t reviewed its permissions", 1],
          ["No — the permissions seem necessary for its features", 0]
        ]
      },
      {
        title: "Has the app shown unexpected behavior, such as pop-ups, redirects, or unknown charges?",
        answers: [
          ["Yes — I noticed unexpected behavior", 3],
          ["I’m not sure", 1],
          ["No — I have not noticed unusual behavior", 0]
        ]
      }
    ]
  },
  arrest: {
    label: "DIGITAL ARREST SCAMS",
    highThreshold: 5,
    mediumThreshold: 2,
    highGuidance: "End the call. Do not transfer money or share an OTP. A ‘digital arrest’ demand is a scam tactic. If you lost money, contact your bank and call 1930.",
    mediumGuidance: "End the call and verify any claim using an official phone number you find independently. Do not share personal or financial information.",
    lowGuidance: "No common digital-arrest scam signs were reported. If an unexpected caller threatens you or demands secrecy or payment, end the call and verify independently.",
    questions: [
      {
        title: "Has someone claiming to be police or a government agency threatened you with arrest on a call?",
        answers: [
          ["Yes — including a video call or threat of arrest", 3],
          ["I’m not sure who the caller really was", 1],
          ["No", 0]
        ]
      },
      {
        title: "Did the caller demand secrecy, money, or an OTP?",
        answers: [
          ["Yes — they demanded one or more of these", 3],
          ["I’m not sure, or they pressured me to act quickly", 1],
          ["No", 0]
        ]
      }
    ]
  }
};

let questionIndex = 0;
let riskScore = 0;
let activeAssessment = null;
let activeAssessmentId = null;

function startAssessment(topicKey) {
  questionIndex = 0;
  riskScore = 0;
  activeAssessmentId = topicKey || null;
  activeAssessment = topicKey ? assessmentTopics[topicKey] : null;
  if (activeAssessment) {
    showQuestion();
  } else {
    showTopicPicker();
  }
  if (!assessmentModal.open) assessmentModal.showModal();
}

function showTopicPicker() {
  document.getElementById("questionNumber").textContent = "SELECT A TOPIC";
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("questionTitle").textContent = "Choose a separate safety check";
  const answerGrid = document.getElementById("answerGrid");
  answerGrid.replaceChildren();

  Object.entries(assessmentTopics).forEach(([topicKey, topic]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button topic-choice";
    button.textContent = topic.label;
    button.addEventListener("click", () => startAssessment(topicKey));
    answerGrid.appendChild(button);
  });
}

function showQuestion() {
  if (questionIndex >= activeAssessment.questions.length) {
    showResult();
    return;
  }
  const question = activeAssessment.questions[questionIndex];
  document.getElementById("questionNumber").textContent = `${activeAssessment.label} · QUESTION ${questionIndex + 1} OF ${activeAssessment.questions.length}`;
  document.getElementById("progressBar").style.width = `${((questionIndex + 1) / activeAssessment.questions.length) * 100}%`;
  document.getElementById("questionTitle").textContent = question.title;
  const answerGrid = document.getElementById("answerGrid");
  answerGrid.replaceChildren();
  question.answers.forEach(([label, score]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = label;
    button.addEventListener("click", () => {
      riskScore += score;
      questionIndex++;
      showQuestion();
    });
    answerGrid.appendChild(button);
  });
}

function showResult() {
  const maxPossibleScore = activeAssessment.questions.reduce(
    (total, question) => total + Math.max(...question.answers.map(([, score]) => score)),
    0
  );
  const scorePercent = maxPossibleScore
    ? Math.round((riskScore / maxPossibleScore) * 100)
    : 0;
  recordQuizCompletion(activeAssessmentId, scorePercent);

  document.getElementById("questionNumber").textContent = `${activeAssessment.label} · RESULT`;
  document.getElementById("progressBar").style.width = "100%";
  const highRisk = riskScore >= activeAssessment.highThreshold;
  const mediumRisk = riskScore >= activeAssessment.mediumThreshold;
  document.getElementById("questionTitle").textContent = highRisk
    ? "High risk — act now"
    : mediumRisk
      ? "Possible scam — verify carefully"
      : "Low immediate risk";
  const answerGrid = document.getElementById("answerGrid");
  answerGrid.replaceChildren();
  const score = document.createElement("div");
  score.className = "result-score";
  score.textContent = highRisk ? "HIGH" : mediumRisk ? "MEDIUM" : "LOW";
  const guidance = document.createElement("p");
  guidance.textContent = highRisk
    ? activeAssessment.highGuidance
    : mediumRisk
      ? activeAssessment.mediumGuidance
      : activeAssessment.lowGuidance;
  const restart = document.createElement("button");
  restart.type = "button";
  restart.className = "primary-button";
  restart.id = "restartCheck";
  restart.textContent = "Choose another topic";
  answerGrid.append(score, guidance, restart);
  document.getElementById("restartCheck").addEventListener("click", () => startAssessment());
}

document.getElementById("startAssessment").addEventListener("click", startAssessment);
document.getElementById("assessmentCard").addEventListener("click", startAssessment);
document.getElementById("resetProgress").addEventListener("click", () => {
  if (!window.confirm("Reset all CyberShield learning progress saved on this device? This cannot be undone.")) return;
  try {
    localStorage.removeItem(learningStorageKey);
    learningProgress = createEmptyProgress();
    renderLearningDashboard();
    setProgressStatus("Learning progress was reset on this device.", false);
  } catch (error) {
    setProgressStatus("Progress could not be reset in this browser. Check its storage settings.", true);
  }
});

const phishingRules = [
  {
    id: "urgency",
    label: "Creates urgency or pressures you to act quickly",
    pattern: /\b(urgent(?:ly)?|immediately|act now|right now|within\s+\d+\s*(?:minutes?|hours?)|expires? today|final warning|last chance|asap|limited time)\b/i,
    score: 2
  },
  {
    id: "links",
    label: "Contains a link whose destination should be verified",
    pattern: /(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|co|in|io|app|site|online|xyz)(?:\/[^\s<>"']*)?/i,
    score: 1
  },
  {
    id: "otp",
    label: "Asks for an OTP, verification code, PIN, or one-time code",
    pattern: /\b(?:otp|one[- ]time (?:password|passcode|code)|verification code|security code|confirm(?:ation)? code|pin)\b/i,
    score: 3
  },
  {
    id: "password",
    label: "Asks for a password or login credentials",
    pattern: /\b(?:password|passcode|login credentials|sign[- ]in details|account credentials)\b/i,
    score: 3
  },
  {
    id: "financial",
    label: "Requests money, payment, bank details, or a transfer",
    pattern: /\b(?:pay(?:ment)?|transfer|send money|wire funds|processing fee|claim fee|bank details|card details|upi id|account number|refund fee|deposit)\b/i,
    score: 3
  },
  {
    id: "prize",
    label: "Uses a prize, lottery, or giveaway claim",
    pattern: /\b(?:you(?:'|’)ve)?\s*(?:won|winner|selected)\b|\b(?:prize|lottery|giveaway|reward)\b/i,
    score: 3
  },
  {
    id: "threat",
    label: "Uses threatening language or threatens account/legal action",
    pattern: /\b(?:arrest(?:ed)?|warrant|police case|legal action|criminal case|account (?:will be )?(?:blocked|suspended|closed)|sim (?:will be )?blocked|fine|penalty|deport(?:ed|ation)?|prosecut(?:e|ion))\b/i,
    score: 3
  }
];

const sampleMessages = {
  bank: "URGENT: Your bank account will be blocked today. Verify KYC now at http://bit.ly/secure-bank and share your OTP to avoid suspension.",
  prize: "Congratulations! You won a prize of ₹10,00,000. Claim it now by paying a ₹499 processing fee and sending your bank details.",
  normal: "Hi, are we still meeting for lunch at 1 pm? Let me know."
};

const messageInput = document.getElementById("messageInput");
const analysisResult = document.getElementById("analysisResult");
const analyzerError = document.getElementById("analyzerError");

messageInput.addEventListener("input", () => {
  document.getElementById("characterCount").textContent = `${messageInput.value.length} / 5000`;
  analyzerError.hidden = true;
  analysisResult.hidden = true;
});

document.querySelectorAll("[data-sample]").forEach(button => {
  button.addEventListener("click", () => {
    messageInput.value = sampleMessages[button.dataset.sample];
    messageInput.dispatchEvent(new Event("input"));
    messageInput.focus();
  });
});

function addListItems(list, items, className) {
  list.replaceChildren();
  items.forEach(item => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    if (className) listItem.className = className;
    list.appendChild(listItem);
  });
}

function analyzeMessage() {
  const message = messageInput.value.trim();
  analyzerError.hidden = message.length > 0;
  if (!message) {
    analysisResult.hidden = true;
    messageInput.focus();
    return;
  }

  const detected = phishingRules
    .filter(rule => rule.pattern.test(message))
    .map(rule => {
      if (rule.id !== "links") return rule;
      const links = message.match(/(?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|net|org|info|biz|co|in|io|app|site|online|xyz)(?:\/[^\s<>"']*)?/gi) || [];
      const suspiciousLink = links.some(link => {
        const normalizedLink = link.replace(/[),.!?]+$/, "");
        return /(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd|cutt\.ly|rb\.gy|ow\.ly|shorturl\.at)|(?:verify|login|secure|account|update|kyc|bank|claim|gift|prize|wallet)|xn--|@|^http:|https?:\/\/\d{1,3}(?:\.\d{1,3}){3}/i.test(normalizedLink);
      });
      return suspiciousLink
        ? { ...rule, label: "Contains a suspicious, shortened, or deceptive-looking link", score: 3 }
        : rule;
    });
  const riskScore = detected.reduce((total, rule) => total + rule.score, 0);
  const risk = riskScore >= 5
    ? { title: "High Risk", badge: "HIGH RISK", className: "risk-high" }
    : riskScore >= 2
      ? { title: "Suspicious", badge: "SUSPICIOUS", className: "risk-suspicious" }
      : { title: "Low Risk", badge: "LOW RISK", className: "risk-low" };

  document.getElementById("riskTitle").textContent = risk.title;
  const riskBadge = document.getElementById("riskBadge");
  riskBadge.textContent = risk.badge;
  riskBadge.className = `risk-badge ${risk.className}`;

  const warningList = document.getElementById("warningList");
  if (detected.length) {
    addListItems(warningList, detected.map(rule => rule.label));
  } else {
    addListItems(warningList, ["No common warning signs were detected. This does not guarantee the message is safe."], "no-signals");
  }

  const tips = [
    "Do not reply, click links, call numbers in the message, or share personal information until you verify it."
  ];
  if (detected.some(rule => rule.id === "links")) {
    tips.push("Do not open the link. Visit the organization’s official website or app by typing its address yourself.");
  }
  if (detected.some(rule => rule.id === "otp" || rule.id === "password")) {
    tips.push("Never share an OTP, PIN, password, or verification code—even with someone claiming to be support or law enforcement.");
  }
  if (detected.some(rule => rule.id === "financial" || rule.id === "prize")) {
    tips.push("Do not pay a fee or transfer money to claim a prize, refund, or avoid a threatened consequence.");
  }
  if (detected.some(rule => rule.id === "threat")) {
    tips.push("End threatening calls and verify claims independently through the official agency or service.");
  }
  tips.push("If you already shared money or account details in India, contact your bank and call cyber-fraud helpline 1930 promptly.");
  addListItems(document.getElementById("safetyTips"), tips);

  analysisResult.hidden = false;
}

document.getElementById("analyzeMessage").addEventListener("click", analyzeMessage);
document.getElementById("clearMessage").addEventListener("click", () => {
  messageInput.value = "";
  document.getElementById("characterCount").textContent = "0 / 5000";
  analyzerError.hidden = true;
  analysisResult.hidden = true;
  messageInput.focus();
});

const urlInput = document.getElementById("urlInput");
const urlResult = document.getElementById("urlResult");
const urlError = document.getElementById("urlError");

function parseWebsiteAddress(value) {
  const input = value.trim();
  if (!input || /\s/.test(input)) return null;

  const explicitScheme = input.match(/^([a-z][a-z\d+.-]*):\/\//i);
  if (explicitScheme && !/^https?$/i.test(explicitScheme[1])) return null;
  if (!explicitScheme && /^(?:javascript|data|file|ftp|mailto|blob|about):/i.test(input)) return null;

  try {
    const parsedUrl = new URL(explicitScheme ? input : `https://${input}`);
    if (!parsedUrl.hostname) return null;
    return { input, parsedUrl };
  } catch {
    return null;
  }
}

function inspectWebsiteAddress(input, parsedUrl) {
  const host = parsedUrl.hostname.toLowerCase();
  const findings = [];
  const addFinding = (title, explanation, score) => findings.push({ title, explanation, score });
  const ipAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || /^\[[\da-f:]+\]$/i.test(host);

  if (ipAddress) {
    addFinding(
      "Uses an IP address instead of a domain name",
      "An IP address is harder to associate with a real organization and can be changed or disguised. Verify the destination independently.",
      3
    );
  }

  const shorteners = ["bit.ly", "t.co", "tinyurl.com", "goo.gl", "is.gd", "cutt.ly", "rb.gy", "ow.ly", "shorturl.at"];
  if (shorteners.some(shortener => host === shortener || host.endsWith(`.${shortener}`))) {
    addFinding(
      "Uses a URL-shortening service",
      "Short links hide their final destination. Do not follow one unless you can independently verify where it leads.",
      2
    );
  }

  if (parsedUrl.protocol !== "https:") {
    addFinding(
      "Does not use HTTPS",
      "The connection may not be encrypted in transit. HTTPS alone also does not prove a site is legitimate.",
      2
    );
  }

  const labels = host.replace(/^\[|\]$/g, "").split(".");
  if (!ipAddress && labels.length >= 4) {
    addFinding(
      "Has an unusually long subdomain chain",
      "Extra labels can make the actual registered domain difficult to notice. Read the hostname from right to left before trusting it.",
      2
    );
  }
  const subdomainLabels = !ipAddress ? labels.slice(0, -2) : [];
  if (subdomainLabels.some(label => /(?:login|secure|account|verify|bank|paypal|google|microsoft|apple|amazon|whatsapp|support|update)/i.test(label))) {
    addFinding(
      "Uses trust-inspiring words in a subdomain",
      "Words such as “secure” or a familiar brand in a subdomain do not show who controls the main domain. Check the actual domain carefully.",
      2
    );
  }

  const authority = input.match(/^[a-z][a-z\d+.-]*:\/\/([^/?#]*)/i);
  const rawAuthority = authority ? authority[1] : input.split(/[/?#]/, 1)[0];
  if (parsedUrl.username || parsedUrl.password || rawAuthority.includes("@")) {
    addFinding(
      "Contains an @ sign or embedded login details",
      "Text before @ can look like a trusted website, but the browser treats the part after @ as the destination host.",
      3
    );
  }

  const domainInPath = /(?:https?:\/\/)?(?:[a-z\d-]+\.)+(?:com|net|org|gov|edu|co|in)\b/i.test(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`);
  if (domainInPath) {
    addFinding(
      "Contains a domain-like string in the path or query",
      "A familiar-looking domain elsewhere in the address is not the hostname you are visiting; check the hostname shown by the browser.",
      2
    );
  }

  const unicodeOrControl = /[^\x21-\x7e]|[\u0000-\u001f\u007f\\]/.test(input);
  const encodedAuthority = /%[\da-f]{2}/i.test(rawAuthority);
  if (unicodeOrControl || encodedAuthority || host.includes("xn--")) {
    addFinding(
      "Contains unusual, encoded, or non-ASCII characters",
      "Look-alike letters, invisible characters, or encoded host text can make an address appear different from its real destination.",
      2
    );
  }

  return findings;
}

function renderUrlFindings(findings) {
  const list = document.getElementById("urlWarningList");
  list.replaceChildren();

  if (!findings.length) {
    const item = document.createElement("li");
    item.className = "no-url-warnings";
    item.textContent = "No warning patterns from this checker were found. This is not a safety certification; the URL has not been opened or reputation-checked.";
    list.appendChild(item);
    return;
  }

  findings.forEach(finding => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const explanation = document.createElement("p");
    title.textContent = finding.title;
    explanation.textContent = finding.explanation;
    item.append(title, explanation);
    list.appendChild(item);
  });
}

function checkWebsiteAddress() {
  const result = parseWebsiteAddress(urlInput.value);
  urlResult.hidden = true;
  urlError.hidden = Boolean(result);
  if (!result) {
    urlInput.focus();
    return;
  }

  const findings = inspectWebsiteAddress(result.input, result.parsedUrl);
  const score = findings.reduce((total, finding) => total + finding.score, 0);
  const risk = score >= 5
    ? { title: "High Warning Indicators", badge: "HIGH", className: "risk-high" }
    : score >= 2
      ? { title: "Caution", badge: "CAUTION", className: "risk-suspicious" }
      : { title: "Low Warning Indicators", badge: "LOW", className: "risk-low" };

  document.getElementById("urlRiskTitle").textContent = risk.title;
  const badge = document.getElementById("urlRiskBadge");
  badge.textContent = risk.badge;
  badge.className = `risk-badge ${risk.className}`;
  renderUrlFindings(findings);
  urlResult.hidden = false;
}

urlInput.addEventListener("input", () => {
  urlError.hidden = true;
  urlResult.hidden = true;
});

document.querySelectorAll("[data-url-sample]").forEach(button => {
  button.addEventListener("click", () => {
    urlInput.value = button.dataset.urlSample;
    urlInput.dispatchEvent(new Event("input"));
    urlInput.focus();
  });
});

document.getElementById("checkUrl").addEventListener("click", checkWebsiteAddress);
urlInput.addEventListener("keydown", event => {
  if (event.key === "Enter") checkWebsiteAddress();
});
document.getElementById("resetUrl").addEventListener("click", () => {
  urlInput.value = "";
  urlError.hidden = true;
  urlResult.hidden = true;
  urlInput.focus();
});
