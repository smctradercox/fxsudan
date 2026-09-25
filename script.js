const PAYMENT_CONFIG = {
  TRC20: {
    label: "TRC-20",
    address: "TCTEDNkPBrrdfbbG8iF4HLvEeeYCVYSBsh",
    explorer: "https://tronscan.org/"
  }
};

const paymentModal = document.querySelector("#paymentModal");
const networkTabs = document.querySelectorAll(".network-tab");
const walletAddress = document.querySelector("#walletAddress");
const paymentQr = document.querySelector("#paymentQr");
const networkLabel = document.querySelector("#networkLabel");
const explorerLink = document.querySelector("#explorerLink");
const paymentMessage = document.querySelector("#paymentMessage");
const paymentAmount = document.querySelector("#paymentAmount");
const paymentChoices = document.querySelectorAll("[data-payment-product]");
const unlockLinks = document.querySelector("#unlockLinks");
let selectedProduct = "course";
const PRODUCT_PRICES = { course: 89, signals: 75, chartbot: 30 };
const authModal = document.querySelector("#authModal");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const authModeButtons = document.querySelectorAll("[data-auth-mode]");
let authMode = "register";

function getUsers() {
  return JSON.parse(localStorage.getItem("fxsudanUsers") || "[]");
}

function getSignedInUser() {
  try {
    return JSON.parse(sessionStorage.getItem("fxsudanCurrentUser") || "null");
  } catch {
    return null;
  }
}

function getChartbotStorageKey() {
  const user = getSignedInUser();
  return user?.username ? `fxsudanChartbot:${user.username}` : null;
}

function refreshChartbotAccess() {
  const storageKey = getChartbotStorageKey();
  const request = storageKey ? JSON.parse(localStorage.getItem(storageKey) || "null") : null;
  const subscribeButton = document.querySelector("#chartbotSubscribe");
  const status = document.querySelector("#chartbotStatus");
  if (!subscribeButton || !status) return;
  subscribeButton.hidden = Boolean(request);
  status.hidden = !request;
}

function hasActiveSession() {
  try {
    const user = JSON.parse(sessionStorage.getItem("fxsudanCurrentUser") || "null");
    return Boolean(user && user.username);
  } catch {
    sessionStorage.removeItem("fxsudanCurrentUser");
    return false;
  }
}

function openAuthModal(mode = "register") {
  if (!authModal) return;
  setAuthMode(mode);
  authModal.hidden = false;
  document.body.classList.add("modal-open");
  document.querySelector("[data-close-auth]").hidden = !hasActiveSession();
  document.querySelector("#authUsername").focus();
}

function closeAuthModal() {
  if (!authModal || !hasActiveSession()) return;
  authModal.hidden = true;
  document.body.classList.remove("modal-open");
  document.body.classList.remove("auth-required");
}

function setAuthMode(mode) {
  authMode = mode;
  const isRegistering = mode === "register";
  document.querySelector("#authTitle").textContent = isRegistering ? "Enter your workspace." : "Welcome back, trader.";
  document.querySelector("#authEyebrow").textContent = isRegistering ? "Your learning account" : "Learner sign in";
  document.querySelector("#authSubmit").innerHTML = `${isRegistering ? "Create my account" : "Open my library"} <span aria-hidden="true">&#8594;</span>`;
  document.querySelector("#fullNameGroup").hidden = !isRegistering;
  document.querySelector("#authPassword").autocomplete = isRegistering ? "new-password" : "current-password";
  authModeButtons.forEach((button) => button.classList.toggle("active", button.dataset.authMode === mode));
  if (authMessage) authMessage.textContent = "";
}

document.querySelectorAll("[data-open-auth]").forEach((button) => button.addEventListener("click", () => openAuthModal()));
document.querySelectorAll("[data-close-auth]").forEach((button) => button.addEventListener("click", closeAuthModal));
authModeButtons.forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));
if (authModal) authModal.addEventListener("click", (event) => { if (event.target === authModal) closeAuthModal(); });

if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.querySelector("#authUsername").value.trim().toLowerCase();
    const password = document.querySelector("#authPassword").value;
    const users = getUsers();

    if (username.length < 3 || !/^[a-z0-9_.-]+$/.test(username)) {
      authMessage.textContent = "Username must be 3+ characters using letters, numbers, dot, dash, or underscore.";
      return;
    }
    if (password.length < 6) {
      authMessage.textContent = "Password must contain at least 6 characters.";
      return;
    }

    if (authMode === "register") {
      if (users.some((user) => user.username === username)) {
        authMessage.textContent = "This username is already taken. Choose another one.";
        return;
      }
      const learner = { id: `FXS-${Math.floor(1000 + Math.random() * 9000)}`, name: document.querySelector("#fullName").value.trim() || username, username, password };
      users.push(learner);
      localStorage.setItem("fxsudanUsers", JSON.stringify(users));
      sessionStorage.setItem("fxsudanCurrentUser", JSON.stringify(learner));
    } else {
      const learner = users.find((user) => user.username === username && user.password === password);
      if (!learner) {
        authMessage.textContent = "Username or password is incorrect.";
        return;
      }
      sessionStorage.setItem("fxsudanCurrentUser", JSON.stringify(learner));
    }
    closeAuthModal();
  });
}

if (hasActiveSession()) {
  document.body.classList.remove("auth-required");
  refreshChartbotAccess();
} else {
  openAuthModal(getUsers().length ? "login" : "register");
}

const currentUser = JSON.parse(sessionStorage.getItem("fxsudanCurrentUser") || "null");
if (document.querySelector(".course-library-page")) {
  if (!currentUser) {
    window.location.href = "index.html";
  } else {
    document.querySelector("#accountId").textContent = currentUser.id;
    document.querySelector("#accountName").textContent = currentUser.name;
  }
}

if (document.querySelector("#logoutAccount")) {
  document.querySelector("#logoutAccount").addEventListener("click", () => sessionStorage.removeItem("fxsudanCurrentUser"));
}

function openPaymentModal(product = "course") {
  if (!paymentModal) return;
  if (!hasActiveSession()) {
    openAuthModal(getUsers().length ? "login" : "register");
    return;
  }
  paymentModal.hidden = false;
  document.body.classList.add("modal-open");
  selectPaymentProduct(product);
  updatePaymentNetwork("TRC20");
}

function selectPaymentProduct(product) {
  selectedProduct = product;
  const price = PRODUCT_PRICES[product];
  if (!price) return;
  if (paymentAmount) paymentAmount.value = "";
  paymentChoices.forEach((choice) => choice.classList.toggle("active", choice.dataset.paymentProduct === product));
  if (paymentMessage) paymentMessage.textContent = `Send exactly ${price} USDT on the selected network.`;
  if (unlockLinks) unlockLinks.hidden = true;
}

paymentChoices.forEach((choice) => choice.addEventListener("click", () => selectPaymentProduct(choice.dataset.paymentProduct)));

function closePaymentModal() {
  if (!paymentModal) return;
  paymentModal.hidden = true;
  document.body.classList.remove("modal-open");
}

function updatePaymentNetwork(network) {
  const details = PAYMENT_CONFIG[network];
  if (!details || !walletAddress) return;
  walletAddress.textContent = details.address;
  networkLabel.textContent = details.label;
  explorerLink.href = details.explorer;
  paymentQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(details.address)}`;
  networkTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.network === network));
}

document.querySelectorAll("[data-open-payment]").forEach((button) => button.addEventListener("click", () => openPaymentModal(button.dataset.paymentProduct || "course")));
document.querySelectorAll("[data-close-payment]").forEach((button) => button.addEventListener("click", closePaymentModal));
networkTabs.forEach((tab) => tab.addEventListener("click", () => updatePaymentNetwork(tab.dataset.network)));

if (paymentModal) {
  paymentModal.addEventListener("click", (event) => {
    if (event.target === paymentModal) closePaymentModal();
  });
}

if (document.querySelector("#copyAddress")) {
  document.querySelector("#copyAddress").addEventListener("click", async () => {
    await navigator.clipboard.writeText(walletAddress.textContent);
    document.querySelector("#copyAddress").textContent = "Copied";
    setTimeout(() => { document.querySelector("#copyAddress").textContent = "Copy"; }, 1600);
  });
}

if (document.querySelector("#submitPayment")) {
  document.querySelector("#submitPayment").addEventListener("click", () => {
    const sentAmount = Number(paymentAmount.value);
    const transactionHash = document.querySelector("#transactionHash").value.trim();
    const requiredAmount = PRODUCT_PRICES[selectedProduct];
    if (sentAmount !== requiredAmount) {
      paymentMessage.textContent = `Payment rejected. Enter exactly ${requiredAmount} USDT; lower or different amounts are not accepted.`;
      unlockLinks.hidden = true;
      return;
    }
    if (!transactionHash) {
      paymentMessage.textContent = "Paste your transaction hash first.";
      unlockLinks.hidden = true;
      return;
    }
    paymentMessage.textContent = "Payment details submitted. Message our Telegram account for manual payment confirmation.";
    if (selectedProduct === "chartbot") {
      const storageKey = getChartbotStorageKey();
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify({ status: "pending", amount: requiredAmount, transactionHash, submittedAt: new Date().toISOString() }));
        refreshChartbotAccess();
      }
      unlockLinks.hidden = true;
      paymentMessage.textContent = "Payment details submitted. Your subscription is pending manual confirmation.";
    } else {
      unlockLinks.hidden = false;
    }
  });
}

const chartImage = document.querySelector("#chartImage");
const chartPreview = document.querySelector("#chartPreview");
const chartPreviewWrap = document.querySelector("#chartPreviewWrap");
const analyzeChart = document.querySelector("#analyzeChart");
const analysisMessage = document.querySelector("#analysisMessage");
let chartPreviewUrl = null;

function clearChartPreview() {
  if (chartPreviewUrl) URL.revokeObjectURL(chartPreviewUrl);
  chartPreviewUrl = null;
  if (chartImage) chartImage.value = "";
  if (chartPreview) chartPreview.removeAttribute("src");
  if (chartPreviewWrap) chartPreviewWrap.hidden = true;
  if (analyzeChart) analyzeChart.disabled = true;
}

if (chartImage) {
  chartImage.addEventListener("change", () => {
    const file = chartImage.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
      clearChartPreview();
      analysisMessage.textContent = "Choose an image file smaller than 10 MB.";
      return;
    }
    if (chartPreviewUrl) URL.revokeObjectURL(chartPreviewUrl);
    chartPreviewUrl = URL.createObjectURL(file);
    chartPreview.src = chartPreviewUrl;
    chartPreviewWrap.hidden = false;
    analyzeChart.disabled = false;
    analysisMessage.textContent = "Screenshot ready. The automated analysis service is not connected yet.";
  });
}

document.querySelector("#removeChart")?.addEventListener("click", clearChartPreview);
analyzeChart?.addEventListener("click", () => {
  const storageKey = getChartbotStorageKey();
  const subscription = storageKey ? JSON.parse(localStorage.getItem(storageKey) || "null") : null;
  if (!subscription) {
    analysisMessage.textContent = "Subscribe for 30 USDT to request your first analysis. Your screenshot will stay selected.";
    openPaymentModal("chartbot");
    return;
  }
  if (subscription.status === "pending") {
    analysisMessage.textContent = "Your payment is awaiting manual confirmation. Automated chart analysis also requires the analysis service to be connected.";
    return;
  }
  analysisMessage.textContent = "Your screenshot is ready, but no analysis was sent. Connect a secure analysis service to enable chart results.";
});

if (document.querySelector("#playLesson")) {
  document.querySelector("#playLesson").addEventListener("click", () => {
    document.querySelector("#lessonMessage").textContent = "Demo player ready. Connect your video files or private video URLs here.";
  });
}

if (document.querySelector("#completeLesson")) {
  document.querySelector("#completeLesson").addEventListener("click", () => {
    document.querySelector("#completeLesson").textContent = "Completed ✓";
    document.querySelector("#lessonMessage").textContent = "Lesson marked as complete.";
    document.querySelector(".progress-ring strong").textContent = "8%";
  });
}

if (document.querySelector("#downloadChecklist")) {
  document.querySelector("#downloadChecklist").addEventListener("click", () => {
    const checklist = "FXSUDAN SMC CHECKLIST\n\n1. Mark external liquidity\n2. Identify current structure\n3. Wait for displacement\n4. Define entry, invalidation, and target\n5. Record the trade plan";
    const file = new Blob([checklist], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fxsudan-smc-checklist.txt";
    link.click();
    URL.revokeObjectURL(url);
  });
}
