// EcoVision Client Application Logic - Role-Based Collection Center & User Portal
// State Management
let currentUser = null;
let currentCustomer = null; // Walk-in customer currently at the collection counter
let currentAuthToken = localStorage.getItem("ecovision_token") || null;
let currentImageBlob = null;
let currentImageObject = null;
let cameraStream = null;
let currentDetections = [];
let showBoundingBoxes = true;
let currentActiveView = "home"; // Landing page: Center Guide by default

// High-contrast detection mapping matching trained YOLO classes and UI image
const CLASS_COLORS = {
    "plastic": "#00f5d4",        // Neon Turquoise
    "can": "#a855f7",            // Electric Violet
    "other materials": "#f43f5e", // Bright Coral / Rose
    "other": "#f43f5e"
};

// DOM Elements: Navigation & View Switcher (Previous Structure)
const navBrandLink = document.getElementById("nav-brand-link");
const navBtnDashboard = document.getElementById("nav-btn-dashboard");
const navBtnScan = document.getElementById("nav-btn-scan");
const viewDashboard = document.getElementById("view-dashboard");
const viewScan = document.getElementById("view-scan");

// User Sidebar Drawer Elements (side ba rusr sud bar)
const userSidebarDrawer = document.getElementById("user-sidebar-drawer");
const userSidebarBackdrop = document.getElementById("user-sidebar-backdrop");
const closeUserSidebarBtn = document.getElementById("close-user-sidebar-btn");
const btnOpenSidebar = document.getElementById("btn-open-sidebar");
const navUserInfoBtn = document.getElementById("nav-user-info-btn");

const sidebarUserAvatar = document.getElementById("sidebar-user-avatar");
const sidebarUserName = document.getElementById("sidebar-user-name");
const sidebarUserRole = document.getElementById("sidebar-user-role");
const sidebarPointsVal = document.getElementById("sidebar-points-val");
const sidebarNairaVal = document.getElementById("sidebar-naira-val");
const sidebarProgressBar = document.getElementById("sidebar-progress-bar");
const sidebarProgressPercent = document.getElementById("sidebar-progress-percent");
const sidebarWithdrawBtn = document.getElementById("sidebar-withdraw-btn");
const sidebarHistoryList = document.getElementById("sidebar-history-list");
const sidebarHistoryCount = document.getElementById("sidebar-history-count");
const sidebarLogoutBtn = document.getElementById("sidebar-logout-btn");

// Sidebar Bank Details Form
const sidebarAccountForm = document.getElementById("sidebar-account-form");
const sidebarBankName = document.getElementById("sidebar-bank-name");
const sidebarAccountNumber = document.getElementById("sidebar-account-number");
const sidebarAccountName = document.getElementById("sidebar-account-name");
const sidebarPhoneNumber = document.getElementById("sidebar-phone-number");
const sidebarBtnSaveAccount = document.getElementById("sidebar-btn-save-account");
const sidebarSaveSpinner = document.getElementById("sidebar-save-spinner");
const sidebarAccountAlert = document.getElementById("sidebar-account-alert");
const sidebarAccountStatus = document.getElementById("sidebar-account-status");

// Cross-Screen Navigation Buttons
const btnJumpDashboard = document.getElementById("btn-jump-dashboard");
const btnJumpScan = document.getElementById("btn-jump-scan");
const btnViewInDashboard = document.getElementById("btn-view-in-dashboard");
const btnScanAnother = document.getElementById("btn-scan-another");
const refreshHistoryBtn = document.getElementById("refresh-history-btn");

// Hero & Cross-Screen Navigation Buttons
const heroScanNowBtn = document.getElementById("hero-scan-now-btn");

// Header User & Auth Controls
const navAuthSection = document.getElementById("nav-auth-section");
const navGuestSection = document.getElementById("nav-guest-section");
const openAuthBtn = document.getElementById("open-auth-btn");
const logoutBtn = document.getElementById("logout-btn");
const userDisplayName = document.getElementById("user-display-name");
const userDisplayEmail = document.getElementById("user-display-email");
const navPoints = document.getElementById("nav-points");
const navNaira = document.getElementById("nav-naira");
const openWalletBtn = document.getElementById("open-wallet-btn");
const btnNavQuickCheck = document.getElementById("btn-nav-quick-check");

// Collection Station Customer Intake Elements
const customerSearchInput = document.getElementById("customer-search-input");
const btnClearSearch = document.getElementById("btn-clear-search");
const customerSearchResults = document.getElementById("customer-search-results");
const activeCustomerBox = document.getElementById("active-customer-box");
const activeCustomerAvatar = document.getElementById("active-customer-avatar");
const activeCustomerName = document.getElementById("active-customer-name");
const activeCustomerEmail = document.getElementById("active-customer-email");
const activeCustomerPhone = document.getElementById("active-customer-phone");
const activeCustomerPoints = document.getElementById("active-customer-points");
const activeCustomerBankStatus = document.getElementById("active-customer-bank-status");
const btnSwitchCustomer = document.getElementById("btn-switch-customer");
const btnQuickNewCustomer = document.getElementById("btn-quick-new-customer");

// User Portal: Total Numbers & Metrics
const cardPoints = document.getElementById("card-points");
const cardNaira = document.getElementById("card-naira");
const cardPlasticCount = document.getElementById("card-plastic-count");
const cardPlasticPoints = document.getElementById("card-plastic-points");
const cardCanCount = document.getElementById("card-can-count");
const cardCanPoints = document.getElementById("card-can-points");
const cardSubmissionsCount = document.getElementById("card-submissions-count");
const cardVerifiedCount = document.getElementById("card-verified-count");
const withdrawBtn = document.getElementById("withdraw-btn");

const payoutProgressBar = document.getElementById("payout-progress-bar");
const payoutProgressText = document.getElementById("payout-progress-text");
const payoutProgressPercent = document.getElementById("payout-progress-percent");
const submissionsHistoryList = document.getElementById("submissions-history-list");

// User Portal: Bank Account Details Form Elements
const accountDetailsForm = document.getElementById("account-details-form");
const inputBankName = document.getElementById("input-bank-name");
const inputAccountNumber = document.getElementById("input-account-number");
const inputAccountName = document.getElementById("input-account-name");
const inputPhoneNumber = document.getElementById("input-phone-number");
const btnSaveAccountDetails = document.getElementById("btn-save-account-details");
const saveAccountSpinner = document.getElementById("save-account-spinner");
const saveAccountText = document.getElementById("save-account-text");
const accountAlert = document.getElementById("account-alert");
const accountSavedBadge = document.getElementById("account-saved-badge");
const accountStatusText = document.getElementById("account-status-text");

// Photo Input Workbench: Tabs & Panes
const tabUpload = document.getElementById("tab-upload");
const tabCamera = document.getElementById("tab-camera");
const paneUpload = document.getElementById("pane-upload");
const paneCamera = document.getElementById("pane-camera");

const dropzone = document.getElementById("dropzone");
const browseBtn = document.getElementById("browse-btn");
const fileInput = document.getElementById("file-input");

const cameraVideo = document.getElementById("camera-stream");
const cameraPlaceholder = document.getElementById("camera-placeholder");
const startCameraBtn = document.getElementById("start-camera-btn");
const stopCameraBtn = document.getElementById("stop-camera-btn");
const capturePhotoBtn = document.getElementById("capture-photo-btn");
const switchCameraFacingBtn = document.getElementById("switch-camera-facing-btn");
let currentCameraFacing = "environment";

// Preview Canvas & Bounding Box Controls
const previewContainer = document.getElementById("preview-container");
const canvas = document.getElementById("vision-canvas");
const ctx = canvas.getContext("2d");
const toggleBboxesBtn = document.getElementById("toggle-bboxes-btn");
const bboxToggleLabel = document.getElementById("bbox-toggle-label");
const submitVerifyBtn = document.getElementById("submit-verify-btn");
const resetPreviewBtn = document.getElementById("reset-preview-btn");
const btnUploadNew = document.getElementById("btn-upload-new");
const workbenchTitle = document.getElementById("workbench-title");
const workbenchDesc = document.getElementById("workbench-desc");
const workbenchTabs = document.getElementById("workbench-tabs");
const btnSpinner = document.getElementById("btn-spinner");
const btnText = document.getElementById("btn-text");
const statusMessage = document.getElementById("status-message");

// Results: Paired Detection & Receipt
const resultsEmpty = document.getElementById("results-empty");
const resultsBreakdown = document.getElementById("results-breakdown");
const scoreBanner = document.getElementById("score-banner");
const rewardStatusLabel = document.getElementById("reward-status-label");
const rewardPointsEarned = document.getElementById("reward-points-earned");
const rewardNairaEarned = document.getElementById("reward-naira-earned");
const receiptCustomerBadge = document.getElementById("receipt-customer-badge");
const receiptCustomerName = document.getElementById("receipt-customer-name");
const pairedSummaryHeadline = document.getElementById("paired-summary-headline");
const pairedHeadlineText = document.getElementById("paired-headline-text");
const pairedCardsContainer = document.getElementById("paired-cards-container");
const totalObjectsBadge = document.getElementById("total-objects-badge");
const detectedItemsUl = document.getElementById("detected-items-ul");

// Modals: Quick Points Check (Staff Customer Lookup)
const quickCheckModal = document.getElementById("quick-check-modal");
const quickCheckBackdrop = document.getElementById("quick-check-backdrop");
const closeQuickCheckBtn = document.getElementById("close-quick-check-btn");
const quickCheckInput = document.getElementById("quick-check-input");
const btnRunQuickCheck = document.getElementById("btn-run-quick-check");
const quickCheckError = document.getElementById("quick-check-error");
const quickCheckResult = document.getElementById("quick-check-result");
const qcAvatar = document.getElementById("qc-avatar");
const qcUsername = document.getElementById("qc-username");
const qcEmail = document.getElementById("qc-email");
const qcPoints = document.getElementById("qc-points");
const qcNaira = document.getElementById("qc-naira");
const qcVisits = document.getElementById("qc-visits");
const qcBankBox = document.getElementById("qc-bank-box");
const qcBankText = document.getElementById("qc-bank-text");
const btnQcSelectCustomer = document.getElementById("btn-qc-select-customer");
let lastQuickCheckUser = null;

// Modals: Quick Customer Registration
const quickCustomerModal = document.getElementById("quick-customer-modal");
const quickCustomerBackdrop = document.getElementById("quick-customer-backdrop");
const closeQuickCustomerBtn = document.getElementById("close-quick-customer-btn");
const cancelQuickCustomerBtn = document.getElementById("cancel-quick-customer-btn");
const confirmQuickCustomerBtn = document.getElementById("confirm-quick-customer-btn");
const qcRegUsername = document.getElementById("qc-reg-username");
const qcRegEmail = document.getElementById("qc-reg-email");
const qcRegPhone = document.getElementById("qc-reg-phone");
const quickCustomerError = document.getElementById("quick-customer-error");

// Modals: Withdrawal
const withdrawalModal = document.getElementById("withdrawal-modal");
const withdrawModalBackdrop = document.getElementById("withdrawal-modal-backdrop") || document.getElementById("withdraw-modal-backdrop");
const closeModalBtn = document.getElementById("close-modal-btn");
const cancelWithdrawBtn = document.getElementById("cancel-withdraw-btn");
const confirmWithdrawBtn = document.getElementById("confirm-withdraw-btn");
const withdrawPointsInput = document.getElementById("withdraw-points-input");
const modalNairaPreview = document.getElementById("modal-naira-preview");
const modalAvailablePoints = document.getElementById("modal-available-points");
const modalError = document.getElementById("modal-error-message") || document.getElementById("modal-error");
const withdrawBank = document.getElementById("withdraw-bank");
const withdrawAccountNum = document.getElementById("withdraw-account-num");
const withdrawAccountName = document.getElementById("withdraw-account-name");

// Modals: Authentication
const authModal = document.getElementById("auth-modal");
const authModalBackdrop = document.getElementById("auth-modal-backdrop");
const closeAuthModalBtn = document.getElementById("close-auth-modal-btn");
const authModalTitle = document.getElementById("auth-modal-title");
const authTabBtnLogin = document.getElementById("auth-tab-btn-login");
const authTabBtnRegister = document.getElementById("auth-tab-btn-register");
const authFormLogin = document.getElementById("auth-form-login");
const authFormRegister = document.getElementById("auth-form-register");
const authErrorAlert = document.getElementById("auth-error-alert");
const authSuccessAlert = document.getElementById("auth-success-alert");
const loginIdentifier = document.getElementById("login-identifier");
const loginPassword = document.getElementById("login-password");
const btnLoginSubmit = document.getElementById("btn-login-submit");
const registerRole = document.getElementById("register-role");
const registerUsername = document.getElementById("register-username");
const registerEmail = document.getElementById("register-email");
const registerPassword = document.getElementById("register-password");
const registerConfirmPassword = document.getElementById("register-confirm-password");
const btnRegisterSubmit = document.getElementById("btn-register-submit");


// ==========================================================================
// 1. APPLICATION INITIALIZATION & SESSION MANAGEMENT
// ==========================================================================

function isCollector() {
    if (!currentUser) return false;
    const r = (currentUser.role || "").toLowerCase();
    return r === "collector" || r === "center_operator" || r === "admin";
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventHandlers();

    window.addEventListener("hashchange", () => {
        const h = window.location.hash;
        if (h === "#dashboard" || h === "#totals" || h === "#portal") {
            switchView("dashboard");
        } else if (h === "#scan" || h === "#studio") {
            switchView("scan");
            return;
        } else if (false) {
            switchView(isCollector() ? "scan" : "dashboard");
        } else if (window.location.hash === "#history" || window.location.hash === "#ledger") {
            switchView("history");
        } else {
            switchView("home");
        }
    });

    initSessionAndStation();
});

async function initSessionAndStation() {
    const cachedUser = localStorage.getItem("ecovision_user");
    const token = localStorage.getItem("ecovision_token");
    currentAuthToken = token || null;

    if (cachedUser && token) {
        try {
            currentUser = JSON.parse(cachedUser);
            const res = await fetch(`/api/auth/me?user_id=${currentUser.id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                currentUser = await res.json();
                localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
            } else if (res.status === 401 || res.status === 404) {
                currentUser = null;
                currentAuthToken = null;
                localStorage.removeItem("ecovision_user");
                localStorage.removeItem("ecovision_token");
            }
        } catch (e) {
            console.warn("Notice: Cached user session active:", e);
        }
    } else {
        currentUser = null;
        currentAuthToken = null;
        localStorage.removeItem("ecovision_user");
        localStorage.removeItem("ecovision_token");
    }

    updateUserUI();

    // Route based on URL hash or auth state
    const hash = window.location.hash;
    if (hash === "#dashboard" || hash === "#portal" || hash === "#totals") {
        switchView("dashboard");
    } else if (hash === "#scan" || hash === "#studio") {
        switchView("scan");
    } else if (hash === "#home") {
        switchView("home");
    } else {
        if (currentUser && currentUser.id) {
            switchView(isCollector() ? "scan" : "dashboard");
        } else if (window.location.hash === "#history" || window.location.hash === "#ledger") {
            switchView("history");
        } else {
            switchView("home");
        }
    }

    updateUserUI();

    if (currentUser) {
        if (isCollector()) {
            selectCustomer(null); // Collectors at counter must select walk-in customers
        } else if (!currentCustomer) {
            selectCustomer(currentUser);
        }
        loadWalletAndHistory();
        loadAccountDetails();
    } else {
        selectCustomer(null);
    }
}

function updateUserUI() {
    if (currentUser && currentUser.id) {
        if (navAuthSection) navAuthSection.classList.remove("hidden");
        if (navGuestSection) navGuestSection.classList.add("hidden");
        if (userDisplayName) userDisplayName.textContent = currentUser.username || "User";
        if (userDisplayEmail) {
            const roleLabel = isCollector() ? "[Staff]" : "[Customer]";
            userDisplayEmail.textContent = `${currentUser.email || ''} ${roleLabel}`;
        }

        if (btnNavQuickCheck) {
            if (isCollector()) btnNavQuickCheck.classList.remove("hidden");
            else btnNavQuickCheck.classList.add("hidden");
        }

        const btnHomeLogin = document.getElementById("btn-home-login");
        const btnHomeRegister = document.getElementById("btn-home-register");
        if (btnHomeLogin) {
            btnHomeLogin.textContent = isCollector() ? "Go to Station Dashboard →" : "Go to My Dashboard →";
            btnHomeLogin.className = "btn btn-primary btn-lg";
        }
        if (btnHomeRegister) {
            btnHomeRegister.textContent = "📷 Open Scan Studio →";
        }

        populateUserSidebar();
    } else {
        if (navAuthSection) navAuthSection.classList.add("hidden");
        if (navGuestSection) navGuestSection.classList.remove("hidden");
        if (btnNavQuickCheck) btnNavQuickCheck.classList.add("hidden");
        if (navPoints) navPoints.textContent = "0 Pts";
        if (navNaira) navNaira.textContent = "₦0";
        const btnHomeLogin = document.getElementById("btn-home-login");
        const btnHomeRegister = document.getElementById("btn-home-register");
        if (btnHomeLogin) {
            btnHomeLogin.textContent = "Sign In to Portal";
            btnHomeLogin.className = "btn btn-outline btn-lg";
        }
        if (btnHomeRegister) {
            btnHomeRegister.textContent = "Register Account →";
        }

        closeUserSidebar();
    }
}


// ==========================================================================
// 2. VIEW SEPARATION: CAMERA & SCAN STUDIO vs DASHBOARD & TOTALS
// ==========================================================================

function switchView(viewName) {
    if (viewName !== "dashboard" && viewName !== "scan" && viewName !== "history") {
        viewName = "home";
    }

    currentActiveView = viewName;

    const homeSec = document.getElementById("view-home");
    const scanSec = document.getElementById("view-scan");
    const dashboardSec = document.getElementById("view-dashboard");
    const historySec = document.getElementById("view-history");

    const dashBtn = document.getElementById("nav-btn-dashboard");
    const scanBtn = document.getElementById("nav-btn-scan");

    // Hide all views first
    if (homeSec) {
        homeSec.classList.add("hidden");
        homeSec.classList.remove("active");
        homeSec.style.setProperty("display", "none", "important");
    }
    if (scanSec) {
        scanSec.classList.add("hidden");
        scanSec.classList.remove("active");
        scanSec.style.setProperty("display", "none", "important");
    }
    if (dashboardSec) {
        dashboardSec.classList.add("hidden");
        dashboardSec.classList.remove("active");
        dashboardSec.style.setProperty("display", "none", "important");
    }

    if (historySec) {
        historySec.classList.add("hidden");
        historySec.classList.remove("active");
        historySec.style.setProperty("display", "none", "important");
    }

    if (dashBtn) dashBtn.classList.remove("active");
    if (scanBtn) scanBtn.classList.remove("active");

    if (viewName === "home") {
        if (homeSec) {
            homeSec.classList.remove("hidden");
            homeSec.classList.add("active");
            homeSec.style.setProperty("display", "block", "important");
        }
        try {
            if (window.location.hash !== "#home") history.replaceState(null, "", "#home");
        } catch (e) {}
        stopCamera();
    } else if (viewName === "scan") {
        if (scanSec) {
            scanSec.classList.remove("hidden");
            scanSec.classList.add("active");
            scanSec.style.setProperty("display", "block", "important");
        }
        if (scanBtn) scanBtn.classList.add("active");
        try {
            if (window.location.hash !== "#scan") history.replaceState(null, "", "#scan");
        } catch (e) {}
        if (currentImageObject) {
            renderCanvasWithDetections();
        }
    } else if (viewName === "dashboard") {
        if (dashboardSec) {
            dashboardSec.classList.remove("hidden");
            dashboardSec.classList.add("active");
            dashboardSec.style.setProperty("display", "block", "important");
        }
        if (dashBtn) dashBtn.classList.add("active");
        try {
            if (window.location.hash !== "#dashboard") history.replaceState(null, "", "#dashboard");
        } catch (e) {}
        stopCamera();
        if (currentUser) {
            loadWalletAndHistory();
            loadAccountDetails();
        }
    } else if (viewName === "history") {
        if (historySec) {
            historySec.classList.remove("hidden");
            historySec.classList.add("active");
            historySec.style.setProperty("display", "block", "important");
        }
        try {
            if (window.location.hash !== "#history") history.replaceState(null, "", "#history");
        } catch (e) {}
        stopCamera();
        loadFullHistory();
    }
}
// ==========================================================================
// USER SIDEBAR FUNCTIONS (DRAWER: CHECK POINTS & ENTER BANK DETAILS)

function openUserSidebar() {
    if (!currentUser) {
        openAuthModal("login", "Please sign in to view your user sidebar & points.");
        return;
    }
    if (userSidebarDrawer) {
        userSidebarDrawer.classList.remove("hidden");
        userSidebarDrawer.setAttribute("aria-hidden", "false");
    }
    populateUserSidebar();
}

function closeUserSidebar() {
    if (userSidebarDrawer) {
        userSidebarDrawer.classList.add("hidden");
        userSidebarDrawer.setAttribute("aria-hidden", "true");
    }
}

function populateUserSidebar() {
    if (!currentUser || !currentUser.id) return;
    if (sidebarUserName) sidebarUserName.textContent = currentUser.username || "Customer";
    if (sidebarUserAvatar) {
        sidebarUserAvatar.textContent = (currentUser.username || "U").charAt(0).toUpperCase();
    }
    if (sidebarUserRole) {
        sidebarUserRole.textContent = isCollector() ? "Collection Staff" : "Customer / Recycler";
    }
    if (sidebarWithdrawBtn) {
        if (isCollector()) sidebarWithdrawBtn.classList.add("hidden");
        else sidebarWithdrawBtn.classList.remove("hidden");
    }
    const sidebarProgressBox = document.querySelector(".sidebar-progress-box");
    if (sidebarProgressBox) {
        if (isCollector()) sidebarProgressBox.classList.add("hidden");
        else sidebarProgressBox.classList.remove("hidden");
    }
    const sidebarAccountBox = document.getElementById("sidebar-account-form")?.closest(".sidebar-section-card");
    if (sidebarAccountBox) {
        if (isCollector()) sidebarAccountBox.classList.add("hidden");
        else sidebarAccountBox.classList.remove("hidden");
    }

    loadWalletAndHistory();
    loadAccountDetails();
}

async function saveSidebarAccountDetails(e) {
    if (e) e.preventDefault();
    if (!currentUser || !currentUser.id) return;

    const bank_name = (sidebarBankName ? sidebarBankName.value : "").trim();
    const account_number = (sidebarAccountNumber ? sidebarAccountNumber.value : "").trim();
    const account_name = (sidebarAccountName ? sidebarAccountName.value : "").trim();
    const phone_number = (sidebarPhoneNumber ? sidebarPhoneNumber.value : "").trim();

    if (!bank_name || !account_number || !account_name) {
        if (sidebarAccountAlert) {
            sidebarAccountAlert.textContent = "Please fill in bank name, account number, and holder name.";
            sidebarAccountAlert.className = "alert alert-danger mt-2";
            sidebarAccountAlert.classList.remove("hidden");
        }
        return;
    }

    if (!/^\d{10}$/.test(account_number)) {
        if (sidebarAccountAlert) {
            sidebarAccountAlert.textContent = "Account number must be exactly 10 digits.";
            sidebarAccountAlert.className = "alert alert-danger mt-2";
            sidebarAccountAlert.classList.remove("hidden");
        }
        return;
    }

    try {
        if (sidebarSaveSpinner) sidebarSaveSpinner.classList.remove("hidden");
        const res = await fetch(`/api/users/${currentUser.id}/account-details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bank_name, account_number, account_name, phone_number })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Failed to save bank details" }));
            throw new Error(err.detail || "Failed to save bank details");
        }

        const data = await res.json();
        currentUser.bank_name = data.bank_name;
        currentUser.account_number = data.account_number;
        currentUser.account_name = data.account_name;
        currentUser.phone_number = data.phone_number;
        localStorage.setItem("ecovision_user", JSON.stringify(currentUser));

        if (sidebarAccountAlert) {
            sidebarAccountAlert.textContent = "Bank account details saved successfully!";
            sidebarAccountAlert.className = "alert alert-success mt-2";
            sidebarAccountAlert.classList.remove("hidden");
        }
        if (sidebarAccountStatus) sidebarAccountStatus.textContent = `${data.bank_name} • ${data.account_number}`;

        if (inputBankName) inputBankName.value = data.bank_name || "";
        if (inputAccountNumber) inputAccountNumber.value = data.account_number || "";
        if (inputAccountName) inputAccountName.value = data.account_name || "";
        if (inputPhoneNumber) inputPhoneNumber.value = data.phone_number || "";
        if (accountStatusText) accountStatusText.textContent = `${data.bank_name} • ${data.account_number}`;

    } catch (err) {
        if (sidebarAccountAlert) {
            sidebarAccountAlert.textContent = err.message;
            sidebarAccountAlert.className = "alert alert-danger mt-2";
            sidebarAccountAlert.classList.remove("hidden");
        }
    } finally {
        if (sidebarSaveSpinner) sidebarSaveSpinner.classList.add("hidden");
    }
}



// ==========================================================================
// 3. COLLECTION CENTER CUSTOMER SELECTION & INTAKE (STAFF DESK)
// ==========================================================================

function selectCustomer(customer) {
    currentCustomer = customer;
    const activeBox = document.getElementById("active-customer-box");

    if (!customer) {
        if (activeCustomerName) activeCustomerName.textContent = isCollector() ? "No Customer Selected" : "Select Walk-In Customer";
        if (activeCustomerEmail) activeCustomerEmail.textContent = isCollector() ? "⚠️ Staff Desk: Search customer above by username, email, or phone" : "Search above by name, email, or phone";
        if (activeCustomerPhone) activeCustomerPhone.textContent = isCollector() ? "Customer selection required before scan" : "No customer active";
        if (activeCustomerPoints) activeCustomerPoints.textContent = "0 Pts (₦0)";
        if (activeCustomerAvatar) activeCustomerAvatar.textContent = isCollector() ? "⚠️" : "--";
        if (activeCustomerBankStatus) {
            activeCustomerBankStatus.className = "badge badge-warning";
            activeCustomerBankStatus.textContent = isCollector() ? "Customer Required" : "Awaiting customer";
        }
        if (btnText) {
            btnText.textContent = isCollector() ? "⚠️ Select Walk-In Customer to Verify" : "Verify Recyclables";
        }
        if (activeBox) activeBox.classList.add("awaiting-customer");
        return;
    }

    if (activeBox) activeBox.classList.remove("awaiting-customer");

    // Update Station Active Customer Box
    if (activeCustomerName) activeCustomerName.textContent = customer.username || `Customer #${customer.id}`;
    if (activeCustomerEmail) activeCustomerEmail.textContent = customer.email || "No email";
    if (activeCustomerPhone) activeCustomerPhone.textContent = customer.phone_number || "No phone recorded";

    const pts = customer.wallet_points || 0;
    const naira = (typeof customer.wallet_naira === "number") ? customer.wallet_naira : pts * 10;
    if (activeCustomerPoints) activeCustomerPoints.textContent = `${pts} Pts (₦${naira.toLocaleString()})`;

    // Avatar initials
    if (activeCustomerAvatar) {
        const name = customer.username || "C";
        activeCustomerAvatar.textContent = name.substring(0, 2).toUpperCase();
    }

    // Bank Account Status Badge
    const hasBank = !!(customer.bank_name && customer.account_number && customer.account_name);
    if (activeCustomerBankStatus) {
        if (hasBank) {
            activeCustomerBankStatus.className = "badge badge-primary";
            activeCustomerBankStatus.textContent = `✓ ${customer.bank_name} • ${customer.account_number.slice(-4).padStart(customer.account_number.length, '•')}`;
            activeCustomerBankStatus.title = `Saved Payout Account: ${customer.bank_name} (${customer.account_number})`;
        } else {
            activeCustomerBankStatus.className = "badge badge-warning";
            activeCustomerBankStatus.textContent = "No Bank Details Saved";
            activeCustomerBankStatus.title = "Customer has not entered bank payout details yet.";
        }
    }

    // Update verification button label with customer name
    if (btnText) {
        btnText.textContent = `Verify Recyclables & Credit ${customer.username}`;
    }

    // Hide search dropdown if open
    if (customerSearchResults) customerSearchResults.classList.add("hidden");
    if (customerSearchInput) customerSearchInput.value = "";
    if (btnClearSearch) btnClearSearch.classList.add("hidden");
}

let searchDebounceTimer = null;
async function handleCustomerSearch(query) {
    clearTimeout(searchDebounceTimer);
    const q = (query || "").trim();

    if (!q) {
        if (customerSearchResults) customerSearchResults.classList.add("hidden");
        if (btnClearSearch) btnClearSearch.classList.add("hidden");
        return;
    }

    if (btnClearSearch) btnClearSearch.classList.remove("hidden");

    searchDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(q)}&limit=8`);
            if (res.ok) {
                const results = await res.json();
                renderCustomerSearchResults(results);
            }
        } catch (e) {
            console.warn("Notice: Error searching customers:", e);
        }
    }, 200);
}

function renderCustomerSearchResults(results) {
    if (!customerSearchResults) return;

    if (!Array.isArray(results) || results.length === 0) {
        customerSearchResults.innerHTML = `
            <div style="padding: 12px 16px; text-align: center; color: var(--light-muted); font-size: 0.84rem;">
                No customer found matching your search.
                <button type="button" class="btn btn-primary btn-sm mt-2" onclick="openQuickCustomerModal()">+ Register New Customer</button>
            </div>
        `;
        customerSearchResults.classList.remove("hidden");
        return;
    }

    customerSearchResults.innerHTML = results.map(u => {
        const initials = (u.username || "C").substring(0, 2).toUpperCase();
        const hasBank = u.has_account_details;
        return `
            <div class="customer-dropdown-item" data-user='${JSON.stringify(u).replace(/'/g, "&apos;")}'>
                <div class="dropdown-item-left">
                    <div class="dropdown-avatar">${initials}</div>
                    <div>
                        <div class="dropdown-username">${u.username} ${hasBank ? '<span class="badge badge-primary text-xs">Bank On File</span>' : ''}</div>
                        <div class="dropdown-email">${u.email || u.phone_number || "No email"}</div>
                    </div>
                </div>
                <div class="dropdown-pts">
                    ${u.wallet_points || 0} Pts
                </div>
            </div>
        `;
    }).join("");

    customerSearchResults.classList.remove("hidden");

    customerSearchResults.querySelectorAll(".customer-dropdown-item").forEach(item => {
        item.addEventListener("click", () => {
            const userStr = item.getAttribute("data-user");
            try {
                const user = JSON.parse(userStr);
                selectCustomer(user);
            } catch (e) {}
        });
    });
}


// ==========================================================================
// 4. USER PORTAL: BANK ACCOUNT DETAILS & CASHOUT
// ==========================================================================

function populateAccountDetailsForm(user) {
    if (!user) return;
    if (inputBankName) inputBankName.value = user.bank_name || "";
    if (inputAccountNumber) inputAccountNumber.value = user.account_number || "";
    if (inputAccountName) inputAccountName.value = user.account_name || "";
    if (inputPhoneNumber) inputPhoneNumber.value = user.phone_number || "";

    const hasBank = !!(user.bank_name && user.account_number && user.account_name);
    if (accountSavedBadge) {
        if (hasBank) accountSavedBadge.classList.remove("hidden");
        else accountSavedBadge.classList.add("hidden");
    }
    if (accountStatusText) {
        if (hasBank) {
            accountStatusText.innerHTML = `<span class="text-blue font-medium">✓ Active Account:</span> ${user.bank_name} (${user.account_number})`;
        } else {
            accountStatusText.textContent = "Please enter and save your bank details for direct payouts.";
        }
    }
}

async function loadAccountDetails() {
    if (isCollector()) return;
    if (!currentUser || !currentUser.id) return;

    try {
        const res = await fetch(`/api/users/${currentUser.id}/wallet`);
        if (res.ok) {
            const data = await res.json();
            populateAccountDetailsForm(data);
            currentUser.bank_name = data.bank_name;
            currentUser.account_number = data.account_number;
            currentUser.account_name = data.account_name;
            currentUser.phone_number = data.phone_number;
            localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
        }
    } catch (e) {
        console.warn("Notice: Error loading account details:", e);
    }
}

async function saveAccountDetails(e) {
    if (e) e.preventDefault();

    if (!currentUser || !currentUser.id) {
        openAuthModal("login", "Please sign in to save your bank account details.");
        return;
    }

    const bankName = (inputBankName ? inputBankName.value : "").trim();
    const accountNum = (inputAccountNumber ? inputAccountNumber.value : "").trim();
    const accountName = (inputAccountName ? inputAccountName.value : "").trim();
    const phone = (inputPhoneNumber ? inputPhoneNumber.value : "").trim();

    if (!bankName) {
        showAccountAlert("Please select or enter your bank name.", "danger");
        if (inputBankName) inputBankName.focus();
        return;
    }

    if (!accountNum || accountNum.length < 8 || !/^\d+$/.test(accountNum)) {
        showAccountAlert("Please enter a valid 10-digit NUBAN account number.", "danger");
        if (inputAccountNumber) inputAccountNumber.focus();
        return;
    }

    if (!accountName || accountName.length < 2) {
        showAccountAlert("Please enter the matching account holder name.", "danger");
        if (inputAccountName) inputAccountName.focus();
        return;
    }

    if (saveAccountSpinner) saveAccountSpinner.classList.remove("hidden");
    if (saveAccountText) saveAccountText.textContent = "Saving Account Details...";
    if (btnSaveAccountDetails) btnSaveAccountDetails.disabled = true;

    try {
        const res = await fetch(`/api/users/${currentUser.id}/account-details`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bank_name: bankName,
                account_number: accountNum,
                account_name: accountName,
                phone_number: phone
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Failed to save account details" }));
            throw new Error(err.detail || "Failed to update account details");
        }

        const updatedUser = await res.json();
        showAccountAlert("✓ Bank account details saved successfully. Payouts will transfer here.", "success");

        currentUser = { ...currentUser, ...updatedUser };
        localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
        populateAccountDetailsForm(updatedUser);

    } catch (err) {
        showAccountAlert(err.message || "Could not save account details", "danger");
    } finally {
        if (saveAccountSpinner) saveAccountSpinner.classList.add("hidden");
        if (saveAccountText) saveAccountText.textContent = "Save Bank Account Details";
        if (btnSaveAccountDetails) btnSaveAccountDetails.disabled = false;
    }
}

function showAccountAlert(msg, type = "info") {
    if (!accountAlert) return;
    accountAlert.className = `alert alert-${type} mt-3`;
    accountAlert.textContent = msg;
    accountAlert.classList.remove("hidden");
}

async function loadCollectorDashboard() {
    const collectorNotice = document.getElementById("collector-station-notice");
    const payoutCard = document.getElementById("payout-progress-card") || document.querySelector(".payout-progress-card");
    const accountCard = document.getElementById("account-details-card") || document.getElementById("account-details-form")?.closest(".card");
    const dashPortalBadge = document.getElementById("dashboard-portal-badge");
    const dashTitle = document.getElementById("dashboard-title");
    const dashSubtitle = document.getElementById("dashboard-subtitle");
    const metricTitlePoints = document.getElementById("metric-title-points");
    const metricBadgePoints = document.getElementById("metric-badge-points");
    const metricTitlePlastic = document.getElementById("metric-title-plastic");
    const metricBadgePlastic = document.getElementById("metric-badge-plastic");
    const metricTitleCan = document.getElementById("metric-title-can");
    const metricBadgeCan = document.getElementById("metric-badge-can");
    const metricTitleSubs = document.getElementById("metric-title-subs");
    const metricBadgeSubs = document.getElementById("metric-badge-subs");
    const histSectionTitle = document.getElementById("history-section-title");
    const histSectionDesc = document.getElementById("history-section-desc");

    if (collectorNotice) collectorNotice.classList.remove("hidden");
    if (payoutCard) payoutCard.classList.add("hidden");
    if (accountCard) accountCard.classList.add("hidden");

    if (dashPortalBadge) dashPortalBadge.innerHTML = `<span>COLLECTION CENTER &bull; OPERATOR AUDIT STATION</span>`;
    if (dashTitle) dashTitle.textContent = "Collector Intake & Totals Dashboard";
    if (dashSubtitle) dashSubtitle.textContent = "Review total waste scans and reward points credited across all customer recyclers. Withdrawals are disabled for collection staff.";

    if (metricTitlePoints) metricTitlePoints.textContent = "TOTAL POINTS CREDITED";
    if (metricBadgePoints) metricBadgePoints.textContent = "₦10/pt credited";
    if (metricTitlePlastic) metricTitlePlastic.textContent = "PLASTIC BOTTLES INTAKE";
    if (metricBadgePlastic) metricBadgePlastic.textContent = "All Customers";
    if (metricTitleCan) metricTitleCan.textContent = "ALUMINUM CANS INTAKE";
    if (metricBadgeCan) metricBadgeCan.textContent = "All Customers";
    if (metricTitleSubs) metricTitleSubs.textContent = "TOTAL SCANS AUDITED";
    if (metricBadgeSubs) metricBadgeSubs.textContent = "Station Ledger";

    if (histSectionTitle) histSectionTitle.textContent = "All Customer Submissions & Intake Ledger";
    if (histSectionDesc) histSectionDesc.textContent = "Real-time audit log of all waste scans processed for customers across collection counters.";

    // Fetch aggregate stats for collector
    const statsRes = await fetch("/api/collector/stats");
    if (statsRes.ok) {
        const stats = await statsRes.json();
        const totalPoints = stats.total_points_awarded || 0;
        const totalNaira = stats.total_naira_awarded || (totalPoints * 10);
        const totalPlastics = stats.total_plastics || 0;
        const totalCans = stats.total_cans || 0;
        const totalScans = stats.total_scans || 0;
        const verifiedScans = stats.verified_scans || 0;

        if (navPoints) navPoints.textContent = `${totalPoints.toLocaleString()} Pts`;
        if (navNaira) navNaira.textContent = `₦${totalNaira.toLocaleString()}`;

        if (sidebarPointsVal) sidebarPointsVal.innerHTML = `${totalPoints.toLocaleString()} <span class="unit">Pts</span>`;
        if (sidebarNairaVal) sidebarNairaVal.textContent = `₦${totalNaira.toLocaleString()} Credited`;

        if (cardPoints) cardPoints.innerHTML = `${totalPoints.toLocaleString()} <span class="unit">Points</span>`;
        if (cardNaira) cardNaira.textContent = `₦${totalNaira.toLocaleString()} Total User Rewards Credited`;
        if (cardPlasticCount) cardPlasticCount.textContent = totalPlastics.toLocaleString();
        if (cardPlasticPoints) cardPlasticPoints.textContent = `${(totalPlastics * 2).toLocaleString()} Points Credited`;
        if (cardCanCount) cardCanCount.textContent = totalCans.toLocaleString();
        if (cardCanPoints) cardCanPoints.textContent = `${(totalCans * 2).toLocaleString()} Points Credited`;
        if (cardSubmissionsCount) cardSubmissionsCount.textContent = totalScans.toLocaleString();
        if (cardVerifiedCount) cardVerifiedCount.textContent = `${verifiedScans} verified submissions across users`;
    }

    // Collector sees all submissions for all users
    const historyRes = await fetch("/api/submissions/center/recent?limit=500");
    if (historyRes.ok) {
        const history = await historyRes.json();
        renderHistoryList(history);
    }
}

async function loadWalletAndHistory() {
    if (!currentUser || !currentUser.id) return;

    if (isCollector()) {
        await loadCollectorDashboard();
        return;
    }

    const collectorNotice = document.getElementById("collector-station-notice");
    const payoutCard = document.getElementById("payout-progress-card") || document.querySelector(".payout-progress-card");
    const accountCard = document.getElementById("account-details-card") || document.getElementById("account-details-form")?.closest(".card");
    const dashPortalBadge = document.getElementById("dashboard-portal-badge");
    const dashTitle = document.getElementById("dashboard-title");
    const dashSubtitle = document.getElementById("dashboard-subtitle");
    const metricTitlePoints = document.getElementById("metric-title-points");
    const metricBadgePoints = document.getElementById("metric-badge-points");
    const metricTitlePlastic = document.getElementById("metric-title-plastic");
    const metricBadgePlastic = document.getElementById("metric-badge-plastic");
    const metricTitleCan = document.getElementById("metric-title-can");
    const metricBadgeCan = document.getElementById("metric-badge-can");
    const metricTitleSubs = document.getElementById("metric-title-subs");
    const metricBadgeSubs = document.getElementById("metric-badge-subs");
    const histSectionTitle = document.getElementById("history-section-title");
    const histSectionDesc = document.getElementById("history-section-desc");

    if (collectorNotice) collectorNotice.classList.add("hidden");
    if (payoutCard) payoutCard.classList.remove("hidden");
    if (accountCard) accountCard.classList.remove("hidden");

    if (dashPortalBadge) dashPortalBadge.innerHTML = `<span>RECYCLING METRICS &amp; REWARD WALLET</span>`;
    if (dashTitle) dashTitle.textContent = "Dashboard & Totals";
    if (dashSubtitle) dashSubtitle.textContent = "Track your verified recyclable waste items, wallet point balance, and request bank payouts.";

    if (metricTitlePoints) metricTitlePoints.textContent = "TOTAL REWARD WALLET";
    if (metricBadgePoints) metricBadgePoints.textContent = "Rate: ₦10/pt";
    if (metricTitlePlastic) metricTitlePlastic.textContent = "PLASTIC BOTTLES";
    if (metricBadgePlastic) metricBadgePlastic.textContent = "+2 Pts ea";
    if (metricTitleCan) metricTitleCan.textContent = "ALUMINUM CANS";
    if (metricBadgeCan) metricBadgeCan.textContent = "+2 Pts ea";
    if (metricTitleSubs) metricTitleSubs.textContent = "SUBMISSIONS AUDIT";
    if (metricBadgeSubs) metricBadgeSubs.textContent = "Ledger";

    if (histSectionTitle) histSectionTitle.textContent = "Submissions & Reward Audit History";
    if (histSectionDesc) histSectionDesc.textContent = "Itemized audit record of all past recyclable waste image scans and points credited.";
    if (!currentUser || !currentUser.id) return;

    try {
        const walletRes = await fetch(`/api/users/${currentUser.id}/wallet`);
        if (walletRes.ok) {
            const data = await walletRes.json();
            const points = data.wallet_points || 0;
            const naira = (typeof data.wallet_naira === "number") ? data.wallet_naira : points * 10;
            const plasticTotal = data.plastic_total || 0;
            const canTotal = data.can_total || 0;
            const totalSubs = data.total_submissions || 0;
            const verifiedSubs = data.verified_submissions || 0;

            const minPoints = 100;
            const progress = Math.min(100, Math.round((points / minPoints) * 100));

            if (navPoints) navPoints.textContent = `${points} Pts`;
            if (navNaira) navNaira.textContent = `₦${naira.toLocaleString()}`;

            if (sidebarPointsVal) sidebarPointsVal.innerHTML = `${points} <span class="unit">Pts</span>`;
            if (sidebarNairaVal) sidebarNairaVal.textContent = `₦${naira.toLocaleString()} Cash`;
            if (sidebarProgressBar) sidebarProgressBar.style.width = `${progress}%`;
            if (sidebarProgressPercent) sidebarProgressPercent.textContent = `${progress}%`;

            if (cardPoints) cardPoints.innerHTML = `${points} <span class="unit">Points</span>`;
            if (cardNaira) cardNaira.textContent = `₦${naira.toLocaleString()} Available Cash`;
            if (cardPlasticCount) cardPlasticCount.textContent = plasticTotal;
            if (cardPlasticPoints) cardPlasticPoints.textContent = `${plasticTotal * 2} Points Earned`;
            if (cardCanCount) cardCanCount.textContent = canTotal;
            if (cardCanPoints) cardCanPoints.textContent = `${canTotal * 2} Points Earned`;
            if (cardSubmissionsCount) cardSubmissionsCount.textContent = totalSubs;
            if (cardVerifiedCount) cardVerifiedCount.textContent = `${verifiedSubs} verified with rewards`;

            if (modalAvailablePoints) modalAvailablePoints.textContent = points;
            if (payoutProgressBar) payoutProgressBar.style.width = `${progress}%`;
            if (payoutProgressPercent) payoutProgressPercent.textContent = `${progress}%`;
            if (payoutProgressText) {
                if (points >= minPoints) {
                    payoutProgressText.textContent = `Threshold reached! You have accumulated enough points to withdraw ₦${(points * 10).toLocaleString()} to your bank.`;
                } else {
                    const remaining = minPoints - points;
                    payoutProgressText.textContent = `${points} / 100 points (${remaining} more points needed to unlock ₦1,000 cash transfer).`;
                }
            }
        }

        const historyRes = await fetch(`/api/submissions/user/${currentUser.id}`);
        if (historyRes.ok) {
            const history = await historyRes.json();
            renderHistoryList(history);
        }
    } catch (e) {
        console.warn("Notice: Error refreshing wallet/history:", e);
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function renderHistoryList(history) {
    if (!submissionsHistoryList) return;
    if (!Array.isArray(history) || history.length === 0) {
        submissionsHistoryList.innerHTML = `
            <div class="empty-state py-4 text-center">
                <p class="text-muted">${isCollector() ? 'No customer waste intakes recorded yet across counters.' : 'No drop-offs recorded yet. Bring recyclable plastics and cans to a collection center to earn cash rewards!'}</p>
            </div>
        `;
        return;
    }

    const previewItems = history.slice(0, 3);
    const itemsHtml = previewItems.map(item => {
        const date = new Date(item.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const isVerified = (item.points_awarded || 0) > 0;

        const parts = [];
        if (item.plastic_count > 0) parts.push(`${item.plastic_count} Plastic${item.plastic_count > 1 ? 's' : ''}`);
        if (item.can_count > 0) parts.push(`${item.can_count} Can${item.can_count > 1 ? 's' : ''}`);
        if (item.other_count > 0) parts.push(`${item.other_count} Other`);
        const itemsSummary = parts.length > 0 ? parts.join(", ") : "No recyclables detected";
        const nairaVal = (typeof item.naira_awarded === "number") ? item.naira_awarded : (item.points_awarded || 0) * 10;
        const station = item.collection_center || "Central Collection Station";

        return `
            <div class="history-item">
                <div class="history-info">
                    <strong>Receipt #${item.id} &bull; ${(isCollector() && item.customer_username) ? `<span class="badge badge-teal" style="font-size: 0.72rem; margin-right: 4px;">@${escapeHtml(item.customer_username)}</span> &bull; ` : ''}${itemsSummary}</strong>
                    <span class="history-time">${date} &bull; <span class="badge ${isVerified ? 'badge-primary' : 'badge-outline'}">${item.status}</span> &bull; <span class="text-muted text-xs">${escapeHtml(station)}</span></span>
                </div>
                <div class="history-reward">
                    <span class="history-points">+${item.points_awarded || 0} Pts</span>
                    <span class="history-naira">₦${nairaVal.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join("");

    const viewAllBtnHtml = history.length > 3 ? `
        <button id="btn-preview-view-all" class="btn btn-outline btn-block mt-3" type="button">
            View All ${history.length} Records in Dedicated History &rarr;
        </button>
    ` : '';

    submissionsHistoryList.innerHTML = itemsHtml + viewAllBtnHtml;

    const btnPreviewViewAll = document.getElementById("btn-preview-view-all");
    if (btnPreviewViewAll) {
        btnPreviewViewAll.addEventListener("click", () => switchView("history"));
    }
}

// ==========================================================================
// DEDICATED PAGINATED HISTORY AUDIT TRAIL
// ==========================================================================

let fullHistoryRecords = [];
let filteredHistoryRecords = [];
let currentHistoryPage = 1;
let historyPageSize = 10;

async function loadFullHistory() {
    const tbody = document.getElementById("paginated-history-tbody");
    if (!currentUser || !currentUser.id) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Please <button class="btn btn-primary btn-sm mx-1" type="button" onclick="openAuthModal('login')">Sign In</button> to view recycling audit history.</td></tr>`;
        }
        return;
    }
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Loading audit records...</td></tr>`;
    }

    try {
        const histPortalBadge = document.getElementById("history-portal-badge");
        const histPageTitle = document.getElementById("history-page-title");
        const histPageSubtitle = document.getElementById("history-page-subtitle");
        if (isCollector()) {
            if (histPortalBadge) histPortalBadge.innerHTML = `<span>COLLECTION CENTER &bull; FULL AUDIT LEDGER</span>`;
            if (histPageTitle) histPageTitle.textContent = "All Customers Audit Ledger";
            if (histPageSubtitle) histPageSubtitle.textContent = "Itemized audit record of all recyclable waste image scans and points credited across customers.";
        } else {
            if (histPortalBadge) histPortalBadge.innerHTML = `<span>AUDIT RECORD &bull; FULL LEDGER</span>`;
            if (histPageTitle) histPageTitle.textContent = "Recycling Audit Ledger";
            if (histPageSubtitle) histPageSubtitle.textContent = "Itemized audit record of all your past recyclable waste image scans and points credited.";
        }

        let endpoint = `/api/submissions/user/${currentUser.id}`;
        if (isCollector()) {
            endpoint = `/api/submissions/center/recent?limit=500`;
        }

        const res = await fetch(endpoint);
        if (!res.ok) throw new Error("Could not retrieve audit history.");
        fullHistoryRecords = await res.json();
        if (!Array.isArray(fullHistoryRecords)) fullHistoryRecords = [];

        updateHistoryMetrics(fullHistoryRecords);
        applyHistoryFilter();

    } catch (err) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-danger">${escapeHtml(err.message)}</td></tr>`;
        }
    }
}

function updateHistoryMetrics(records) {
    const totalCountEl = document.getElementById("hist-total-count");
    const plasticCountEl = document.getElementById("hist-plastic-count");
    const canCountEl = document.getElementById("hist-can-count");
    const pointsCountEl = document.getElementById("hist-points-count");

    let totalPlastics = 0;
    let totalCans = 0;
    let totalPts = 0;

    records.forEach(r => {
        totalPlastics += (r.plastic_count || 0);
        totalCans += (r.can_count || 0);
        totalPts += (r.points_awarded || 0);
    });

    if (totalCountEl) totalCountEl.textContent = records.length.toLocaleString();
    if (plasticCountEl) plasticCountEl.textContent = totalPlastics.toLocaleString();
    if (canCountEl) canCountEl.textContent = totalCans.toLocaleString();
    if (pointsCountEl) pointsCountEl.textContent = `${totalPts.toLocaleString()} Pts`;
}

function applyHistoryFilter() {
    const searchInput = document.getElementById("hist-search-input");
    const query = (searchInput ? searchInput.value : "").toLowerCase().trim();

    if (!query) {
        filteredHistoryRecords = [...fullHistoryRecords];
    } else {
        filteredHistoryRecords = fullHistoryRecords.filter(r => {
            const idStr = String(r.id);
            const userStr = (r.customer_username || "").toLowerCase();
            const centerStr = (r.collection_center || "").toLowerCase();
            const statusStr = (r.status || "").toLowerCase();
            return idStr.includes(query) || userStr.includes(query) || centerStr.includes(query) || statusStr.includes(query);
        });
    }

    currentHistoryPage = 1;
    renderPaginatedHistory();
}

function renderPaginatedHistory() {
    const tbody = document.getElementById("paginated-history-tbody");
    const infoEl = document.getElementById("pagination-info");
    const prevBtn = document.getElementById("btn-hist-prev");
    const nextBtn = document.getElementById("btn-hist-next");
    const pageNumsEl = document.getElementById("pagination-page-nums");

    if (!tbody) return;

    const total = filteredHistoryRecords.length;
    const totalPages = Math.ceil(total / historyPageSize) || 1;

    if (currentHistoryPage > totalPages) currentHistoryPage = totalPages;
    if (currentHistoryPage < 1) currentHistoryPage = 1;

    const startIdx = (currentHistoryPage - 1) * historyPageSize;
    const endIdx = Math.min(startIdx + historyPageSize, total);
    const pageRecords = filteredHistoryRecords.slice(startIdx, endIdx);

    if (total === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No matching submissions found.</td></tr>`;
        if (infoEl) infoEl.textContent = `Showing 0 of 0 records`;
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        if (pageNumsEl) pageNumsEl.innerHTML = "";
        return;
    }

    if (infoEl) {
        infoEl.textContent = `Showing ${startIdx + 1}–${endIdx} of ${total} records (Page ${currentHistoryPage} of ${totalPages})`;
    }

    if (prevBtn) prevBtn.disabled = (currentHistoryPage <= 1);
    if (nextBtn) nextBtn.disabled = (currentHistoryPage >= totalPages);

    tbody.innerHTML = pageRecords.map(item => {
        const date = new Date(item.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const isVerified = (item.points_awarded || 0) > 0;
        const customer = item.customer_username || `Customer #${item.user_id}`;
        const center = item.collection_center || "Central Hub";

        const itemsList = [];
        if (item.plastic_count > 0) itemsList.push(`${item.plastic_count} Plastic${item.plastic_count > 1 ? 's' : ''}`);
        if (item.can_count > 0) itemsList.push(`${item.can_count} Can${item.can_count > 1 ? 's' : ''}`);
        if (item.other_count > 0) itemsList.push(`${item.other_count} Other`);
        const itemsStr = itemsList.length > 0 ? itemsList.join(", ") : "0 Items";
        const nairaVal = (typeof item.naira_awarded === "number") ? item.naira_awarded : (item.points_awarded || 0) * 10;

        return `
            <tr>
                <td><strong>#${item.id}</strong></td>
                <td class="text-xs text-muted">${date}</td>
                <td>
                    <div class="table-user-cell">
                        <strong>${escapeHtml(customer)}</strong>
                        <span class="text-xs text-muted block">${escapeHtml(center)}</span>
                    </div>
                </td>
                <td><span class="text-secondary font-medium">${itemsStr}</span></td>
                <td><strong class="${isVerified ? 'text-green' : 'text-muted'}">+${item.points_awarded || 0} Pts</strong></td>
                <td><span class="text-secondary font-medium">₦${nairaVal.toLocaleString()}</span></td>
                <td>
                    <span class="badge ${isVerified ? 'badge-primary' : 'badge-outline'}">${item.status}</span>
                </td>
            </tr>
        `;
    }).join("");

    if (pageNumsEl) {
        let pagesHtml = "";
        const maxButtons = 5;
        let startPage = Math.max(1, currentHistoryPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage < maxButtons - 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
            pagesHtml += `<button class="page-num-btn ${p === currentHistoryPage ? 'active' : ''}" data-page="${p}" type="button">${p}</button>`;
        }
        pageNumsEl.innerHTML = pagesHtml;

        pageNumsEl.querySelectorAll(".page-num-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                currentHistoryPage = parseInt(btn.dataset.page, 10);
                renderPaginatedHistory();
            });
        });
    }
}

function resetDashboardToZero() {
    if (cardPoints) cardPoints.innerHTML = `0 <span class="unit">Points</span>`;
    if (cardNaira) cardNaira.textContent = "₦0 Available Cash";
    if (cardPlasticCount) cardPlasticCount.textContent = 0;
    if (cardPlasticPoints) cardPlasticPoints.textContent = "0 Points Earned";
    if (cardCanCount) cardCanCount.textContent = 0;
    if (cardCanPoints) cardCanPoints.textContent = "0 Points Earned";
    if (cardSubmissionsCount) cardSubmissionsCount.textContent = 0;
    if (cardVerifiedCount) cardVerifiedCount.textContent = "0 verified drop-offs";
    if (payoutProgressBar) payoutProgressBar.style.width = "0%";
    if (payoutProgressPercent) payoutProgressPercent.textContent = "0%";
    if (payoutProgressText) payoutProgressText.textContent = "0 / 100 points accumulated to unlock direct bank transfer.";
    if (submissionsHistoryList) {
        submissionsHistoryList.innerHTML = `<p class="text-muted text-center py-4">Sign in to view your recycling history.</p>`;
    }
}


// ==========================================================================
// 5. BOUNDING BOX RENDERING & CANVAS FEED
// ==========================================================================

function hexToRgba(hex, alpha) {
    const cleanHex = hex.replace("#", "");
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderCanvasWithDetections() {
    if (!currentImageObject || !canvas) return;

    canvas.width = currentImageObject.naturalWidth || currentImageObject.width || 800;
    canvas.height = currentImageObject.naturalHeight || currentImageObject.height || 600;

    ctx.drawImage(currentImageObject, 0, 0, canvas.width, canvas.height);

    if (!showBoundingBoxes || !currentDetections || currentDetections.length === 0) {
        return;
    }

    const w = canvas.width;
    const h = canvas.height;

    const strokeWidth = Math.max(2, Math.round(w / 220));
    const fontSize = Math.max(13, Math.round(w / 42));
    const tagHeight = fontSize + 8;

    currentDetections.forEach(item => {
        const cls = (item.class_name || "other materials").toLowerCase();
        const color = CLASS_COLORS[cls] || "#94a3b8";
        const bbox = item.bbox || { ymin: 0, xmin: 0, ymax: 1, xmax: 1 };

        const ymin = (typeof bbox.ymin === "number" ? bbox.ymin : bbox[0]) * h;
        const xmin = (typeof bbox.xmin === "number" ? bbox.xmin : bbox[1]) * w;
        const ymax = (typeof bbox.ymax === "number" ? bbox.ymax : bbox[2]) * h;
        const xmax = (typeof bbox.xmax === "number" ? bbox.xmax : bbox[3]) * w;
        const boxWidth = Math.max(4, xmax - xmin);
        const boxHeight = Math.max(4, ymax - ymin);

        ctx.save();

        // Subtle box fill
        ctx.fillStyle = hexToRgba(color, 0.12);
        ctx.fillRect(xmin, ymin, boxWidth, boxHeight);

        // Crisp border
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.strokeRect(xmin, ymin, boxWidth, boxHeight);

        // Label tag
        const confPercent = Math.round((item.confidence || 0) * 100);
        const labelText = `${cls.toUpperCase()} ${confPercent}% ${item.is_verified ? '[PASS]' : '[EXCLUDE]'}`;

        ctx.font = `600 ${fontSize}px sans-serif`;
        const textMetrics = ctx.measureText(labelText);
        const tagWidth = textMetrics.width + 14;
        const tagY = Math.max(0, ymin - tagHeight - 2);

        ctx.fillStyle = "#090a0f";
        ctx.fillRect(xmin, tagY, tagWidth, tagHeight);

        ctx.fillStyle = color;
        ctx.fillRect(xmin, tagY, 3, tagHeight);

        ctx.fillStyle = "#ffffff";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, xmin + 8, tagY + (tagHeight / 2));

        ctx.restore();
    });
}

function toggleBoundingBoxes() {
    showBoundingBoxes = !showBoundingBoxes;
    if (showBoundingBoxes) {
        toggleBboxesBtn.className = "bbox-status-badge active";
        bboxToggleLabel.textContent = "Bounding Boxes: Visible";
    } else {
        toggleBboxesBtn.className = "bbox-status-badge off";
        bboxToggleLabel.textContent = "Bounding Boxes: Hidden";
    }
    renderCanvasWithDetections();
}

function handleSelectedImage(fileOrBlob) {
    if (!fileOrBlob) return;
    currentImageBlob = fileOrBlob;
    currentDetections = [];
    resultsBreakdown.classList.add("hidden");
    resultsEmpty.classList.remove("hidden");

    stopCamera();

    if (paneUpload) {
        paneUpload.classList.remove("active");
        paneUpload.classList.add("hidden");
        paneUpload.style.display = "none";
    }
    if (paneCamera) {
        paneCamera.classList.remove("active");
        paneCamera.classList.add("hidden");
        paneCamera.style.display = "none";
    }

    if (workbenchTabs) {
        workbenchTabs.classList.add("hidden");
        workbenchTabs.style.display = "none";
    }
    if (workbenchTitle) workbenchTitle.textContent = "📷 Uploaded Picture";
    if (workbenchDesc) workbenchDesc.textContent = "Image loaded directly in workspace. Ready for YOLO11 verification.";

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImageObject = img;
            renderCanvasWithDetections();
            previewContainer.classList.remove("hidden");
            statusMessage.classList.add("hidden");
            if (isCollector() && (!currentCustomer || !currentCustomer.id)) {
                statusMessage.className = "alert alert-warning mt-3";
                statusMessage.innerHTML = `<strong>⚠️ Counter Staff Notice:</strong> Photo loaded. Please search or register the walk-in customer above before clicking verify.`;
                statusMessage.classList.remove("hidden");
            }
            if (window.innerWidth <= 960) {
                previewContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(fileOrBlob);
}

function resetImageInput() {
    currentImageBlob = null;
    currentImageObject = null;
    currentDetections = [];
    previewContainer.classList.add("hidden");
    fileInput.value = "";
    statusMessage.classList.add("hidden");
    resultsBreakdown.classList.add("hidden");
    resultsEmpty.classList.remove("hidden");

    stopCamera();

    if (workbenchTitle) workbenchTitle.textContent = "📷 Uploaded Picture";
    if (workbenchDesc) workbenchDesc.textContent = "Snap a frame with the live camera or upload a photo of recyclable waste.";
    if (workbenchTabs) {
        workbenchTabs.classList.remove("hidden");
        workbenchTabs.style.display = "flex";
    }

    switchInputTab("upload");
}


// ==========================================================================
// 6. VERIFICATION INFERENCE & REWARD CREDIT (STAFF WORKFLOW)
// ==========================================================================

async function submitImageForVerification() {
    if (!currentImageBlob) {
        statusMessage.className = "alert alert-warning mt-3";
        statusMessage.textContent = "Please capture or select a photo of the recyclable waste first.";
        statusMessage.classList.remove("hidden");
        return;
    }

    // Target customer: explicitly selected walk-in customer, or currently logged-in user, or default
    if (isCollector() && (!currentCustomer || !currentCustomer.id)) {
        statusMessage.className = "alert alert-danger mt-3";
        statusMessage.innerHTML = `<strong>⚠️ Customer Selection Required:</strong> As collection staff, you must select or register the walk-in customer at the counter before verifying recyclable waste. Points cannot be credited without an active customer account.`;
        statusMessage.classList.remove("hidden");
        const intakeCard = document.querySelector(".customer-intake-card");
        if (intakeCard) {
            intakeCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        if (customerSearchInput) {
            customerSearchInput.focus();
        }
        return;
    }

    const targetUser = isCollector() ? currentCustomer : (currentCustomer || currentUser);
    if (!targetUser || !targetUser.id) {
        statusMessage.className = "alert alert-warning mt-3";
        statusMessage.innerHTML = `<strong>Customer Required:</strong> Please sign in or select a customer to credit points.`;
        statusMessage.classList.remove("hidden");
        return;
    }
    const targetUserId = targetUser.id;

    btnSpinner.classList.remove("hidden");
    btnText.textContent = "Verifying Batch...";
    submitVerifyBtn.disabled = true;
    statusMessage.classList.add("hidden");

    const formData = new FormData();
    formData.append("user_id", targetUserId);
    formData.append("collection_center", "Collection Station #1");
    formData.append("image", currentImageBlob, "collection_intake.jpg");

    try {
        const res = await fetch("/api/submissions", {
            method: "POST",
            body: formData
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Verification failed" }));
            throw new Error(err.detail || `Server returned error (${res.status})`);
        }

        const data = await res.json();

        currentDetections = data.detections || [];
        renderCanvasWithDetections();
        displayVerificationResults(data);

        // Update active customer / logged-in user card with new points
        if (data.points_awarded > 0) {
            if (currentCustomer) {
                currentCustomer.wallet_points = (currentCustomer.wallet_points || 0) + data.points_awarded;
                currentCustomer.wallet_naira = currentCustomer.wallet_points * 10;
                selectCustomer(currentCustomer);
            }
            if (currentUser && (!currentCustomer || currentCustomer.id === currentUser.id)) {
                currentUser.wallet_points = (currentUser.wallet_points || 0) + data.points_awarded;
                currentUser.wallet_naira = currentUser.wallet_points * 10;
                localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
                updateUserUI();
            }
        }

        if (data.status === "duplicate_blocked") {
            statusMessage.className = "alert alert-warning mt-3";
            statusMessage.innerHTML = `<strong>Anti-Fraud Warning:</strong> This exact waste photo was previously submitted. Points were blocked from double-awarding.`;
            statusMessage.classList.remove("hidden");
        }

    } catch (err) {
        statusMessage.className = "alert alert-danger mt-3";
        statusMessage.textContent = err.message || "Failed to process verification";
        statusMessage.classList.remove("hidden");
    } finally {
        btnSpinner.classList.add("hidden");
        btnText.textContent = `Verify Recyclables & Credit ${currentCustomer ? currentCustomer.username : 'Customer'}`;
        submitVerifyBtn.disabled = false;
    }
}

function displayVerificationResults(data) {
    resultsEmpty.classList.add("hidden");
    resultsBreakdown.classList.remove("hidden");

    if (window.innerWidth <= 960) {
        resultsBreakdown.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const isVerified = (data.points_awarded || 0) > 0;
    const isDuplicate = data.status === "duplicate_blocked";

    if (isDuplicate) {
        scoreBanner.className = "score-banner rejected";
        rewardStatusLabel.textContent = "Duplicate Batch Prevented";
        rewardPointsEarned.textContent = "+0 Points";
        rewardNairaEarned.textContent = "0 New Points (Already Claimed)";
    } else if (isVerified) {
        scoreBanner.className = "score-banner";
        rewardStatusLabel.textContent = "Batch Verified & Credited";
        rewardPointsEarned.textContent = `+${data.points_awarded} Points`;
        rewardNairaEarned.textContent = `₦${(data.naira_awarded || (data.points_awarded * 10)).toLocaleString()} Credited to Customer`;
    } else {
        scoreBanner.className = "score-banner rejected";
        rewardStatusLabel.textContent = "No Qualifying Recyclables";
        rewardPointsEarned.textContent = "0 Points";
        rewardNairaEarned.textContent = "₦0 (Did not meet ≥55% threshold)";
    }

    if (receiptCustomerName) {
        receiptCustomerName.textContent = data.customer_username || (currentCustomer ? currentCustomer.username : "Customer");
    }

    const detections = data.detections || [];
    const plastics = detections.filter(d => (d.class_name || "").toLowerCase() === "plastic");
    const cans = detections.filter(d => (d.class_name || "").toLowerCase() === "can");
    const others = detections.filter(d => !["plastic", "can"].includes((d.class_name || "").toLowerCase()));

    const summaryParts = [];
    if (plastics.length > 0) summaryParts.push(`${plastics.length} Plastic${plastics.length > 1 ? 's' : ''}`);
    if (cans.length > 0) summaryParts.push(`${cans.length} Can${cans.length > 1 ? 's' : ''}`);
    if (others.length > 0) summaryParts.push(`${others.length} Other`);

    const ptsAwarded = data.points_awarded || 0;
    const nairaAwarded = data.naira_awarded || (ptsAwarded * 10);

    if (summaryParts.length > 0) {
        pairedHeadlineText.textContent = `Items: ${summaryParts.join(", ")} (+${ptsAwarded} Pts • ₦${nairaAwarded.toLocaleString()})`;
    } else {
        pairedHeadlineText.textContent = `No items recognized in camera frame`;
    }

    const verifiedPlastics = plastics.filter(p => p.is_verified).length;
    const verifiedCans = cans.filter(c => c.is_verified).length;
    const plasticPoints = verifiedPlastics * 2;
    const canPoints = verifiedCans * 2;

    let pairedCardsHtml = "";

    if (plastics.length > 0) {
        pairedCardsHtml += `
            <div class="pair-card plastic">
                <div class="pair-header">
                    <div>
                        <span class="pair-title">${plastics.length} PET Bottle${plastics.length > 1 ? 's' : ''}</span>
                        <span class="pair-sub">${verifiedPlastics} of ${plastics.length} verified (≥55% conf)</span>
                    </div>
                    <div>
                        <div class="pair-points ${plasticPoints > 0 ? '' : 'zero'}">+${plasticPoints} Pts</div>
                        <span class="pair-naira">₦${(plasticPoints * 10).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (cans.length > 0) {
        pairedCardsHtml += `
            <div class="pair-card can">
                <div class="pair-header">
                    <div>
                        <span class="pair-title">${cans.length} Aluminum Can${cans.length > 1 ? 's' : ''}</span>
                        <span class="pair-sub">${verifiedCans} of ${cans.length} verified (≥55% conf)</span>
                    </div>
                    <div>
                        <div class="pair-points ${canPoints > 0 ? '' : 'zero'}">+${canPoints} Pts</div>
                        <span class="pair-naira">₦${(canPoints * 10).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (others.length > 0) {
        pairedCardsHtml += `
            <div class="pair-card other">
                <div class="pair-header">
                    <div>
                        <span class="pair-title">${others.length} Excluded Item${others.length > 1 ? 's' : ''}</span>
                        <span class="pair-sub">Debris / non-recyclable materials</span>
                    </div>
                    <div>
                        <div class="pair-points zero">+0 Pts</div>
                        <span class="pair-naira">₦0</span>
                    </div>
                </div>
            </div>
        `;
    }

    if (pairedCardsContainer) pairedCardsContainer.innerHTML = pairedCardsHtml;

    if (totalObjectsBadge) totalObjectsBadge.textContent = detections.length;
    if (detectedItemsUl) {
        detectedItemsUl.innerHTML = detections.map(item => {
            const conf = Math.round((item.confidence || 0) * 100);
            return `
                <li class="item-row">
                    <span class="badge ${item.is_verified ? 'badge-primary' : 'badge-outline'}">${item.class_name} (${conf}%)</span>
                    <span class="text-xs text-muted">[${(item.bbox.ymin || 0).toFixed(2)}, ${(item.bbox.xmin || 0).toFixed(2)}, ${(item.bbox.ymax || 0).toFixed(2)}, ${(item.bbox.xmax || 0).toFixed(2)}]</span>
                </li>
            `;
        }).join("");
    }
}


// ==========================================================================
// 7. QUICK CUSTOMER LOOKUP (STAFF TOOL)
// ==========================================================================

function openQuickCheckModal(prefill = "") {
    if (!quickCheckModal) return;
    quickCheckModal.classList.remove("hidden");
    if (quickCheckError) quickCheckError.classList.add("hidden");
    if (quickCheckResult) quickCheckResult.classList.add("hidden");
    if (quickCheckInput) {
        quickCheckInput.value = prefill;
        quickCheckInput.focus();
        if (prefill) runQuickCheck();
    }
}

function closeQuickCheckModal() {
    if (quickCheckModal) quickCheckModal.classList.add("hidden");
}

async function runQuickCheck() {
    const ident = (quickCheckInput ? quickCheckInput.value : "").trim();
    if (!ident) {
        if (quickCheckError) {
            quickCheckError.textContent = "Please enter a customer username or email.";
            quickCheckError.classList.remove("hidden");
        }
        return;
    }

    if (quickCheckError) quickCheckError.classList.add("hidden");
    if (btnRunQuickCheck) btnRunQuickCheck.disabled = true;

    try {
        const res = await fetch(`/api/users/quick-check/${encodeURIComponent(ident)}`);
        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "User not found" }));
            throw new Error(err.detail || `No customer found matching "${ident}"`);
        }

        const data = await res.json();
        lastQuickCheckUser = data;

        if (qcUsername) qcUsername.textContent = data.username;
        if (qcEmail) qcEmail.textContent = data.email || "";
        if (qcAvatar) qcAvatar.textContent = (data.username || "U").substring(0, 2).toUpperCase();
        if (qcPoints) qcPoints.textContent = `${data.wallet_points || 0} Pts`;
        if (qcNaira) qcNaira.textContent = `₦${(data.wallet_naira || (data.wallet_points * 10)).toLocaleString()}`;
        if (qcVisits) qcVisits.textContent = data.total_submissions || 0;

        if (qcBankText) {
            if (data.has_account_details) {
                qcBankText.innerHTML = `<strong>✓ Bank on file:</strong> ${data.bank_name} &bull; ${data.account_number}`;
            } else {
                qcBankText.innerHTML = `<span class="text-muted">No bank details registered yet.</span>`;
            }
        }

        if (quickCheckResult) quickCheckResult.classList.remove("hidden");

    } catch (err) {
        if (quickCheckError) {
            quickCheckError.textContent = err.message;
            quickCheckError.classList.remove("hidden");
        }
        if (quickCheckResult) quickCheckResult.classList.add("hidden");
    } finally {
        if (btnRunQuickCheck) btnRunQuickCheck.disabled = false;
    }
}


// ==========================================================================
// 8. QUICK CUSTOMER REGISTRATION AT COLLECTION COUNTER
// ==========================================================================

function openQuickCustomerModal() {
    if (!quickCustomerModal) return;
    quickCustomerModal.classList.remove("hidden");
    if (quickCustomerError) quickCustomerError.classList.add("hidden");
    if (qcRegUsername) {
        qcRegUsername.value = "";
        qcRegUsername.focus();
    }
    if (qcRegEmail) qcRegEmail.value = "";
    if (qcRegPhone) qcRegPhone.value = "";
}

function closeQuickCustomerModal() {
    if (quickCustomerModal) quickCustomerModal.classList.add("hidden");
}

async function handleQuickCustomerSubmit() {
    const username = (qcRegUsername ? qcRegUsername.value : "").trim();
    const email = (qcRegEmail ? qcRegEmail.value : "").trim();
    const phone = (qcRegPhone ? qcRegPhone.value : "").trim();

    if (!username || username.length < 3) {
        if (quickCustomerError) {
            quickCustomerError.textContent = "Customer username must be at least 3 characters.";
            quickCustomerError.classList.remove("hidden");
        }
        return;
    }

    try {
        const res = await fetch("/api/users/quick-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: username,
                email: email,
                phone_number: phone
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Registration failed" }));
            throw new Error(err.detail || "Registration failed");
        }

        const newUser = await res.json();
        closeQuickCustomerModal();
        selectCustomer(newUser);

    } catch (err) {
        if (quickCustomerError) {
            quickCustomerError.textContent = err.message;
            quickCustomerError.classList.remove("hidden");
        }
    }
}


// ==========================================================================
// 9. WITHDRAWAL CASHOUT MODAL
// ==========================================================================

function openWithdrawalModal() {
    if (!currentUser || !currentUser.id) {
        openAuthModal("login", "Please sign in to cash out your points.");
        return;
    }

    if (isCollector()) {
        alert("Notice: Withdrawals are reserved for customer recycler accounts. Collection center staff cannot redeem points.");
        return;
    }

    if (!withdrawalModal) return;
    withdrawalModal.classList.remove("hidden");
    if (modalError) modalError.classList.add("hidden");

    const pts = currentUser.wallet_points || 0;
    if (modalAvailablePoints) modalAvailablePoints.textContent = pts;

    if (withdrawBank) withdrawBank.value = currentUser.bank_name || "";
    if (withdrawAccountNum) withdrawAccountNum.value = currentUser.account_number || "";
    if (withdrawAccountName) withdrawAccountName.value = currentUser.account_name || "";

    if (withdrawPointsInput) {
        withdrawPointsInput.value = pts >= 100 ? pts : 100;
        const nairaPreview = (parseInt(withdrawPointsInput.value) || 0) * 10;
        if (modalNairaPreview) modalNairaPreview.textContent = `= ₦${nairaPreview.toLocaleString()} Cash`;
    }
}

function closeWithdrawalModal() {
    if (withdrawalModal) withdrawalModal.classList.add("hidden");
}

async function handleWithdrawalSubmit() {
    if (!currentUser || !currentUser.id) return;

    const points = parseInt(withdrawPointsInput ? withdrawPointsInput.value : 0) || 0;
    const bankName = ((withdrawBank ? withdrawBank.value : "") || (currentUser.bank_name || "")).trim();
    const accountNum = ((withdrawAccountNum ? withdrawAccountNum.value : "") || (currentUser.account_number || "")).trim();
    const accountName = ((withdrawAccountName ? withdrawAccountName.value : "") || (currentUser.account_name || "")).trim();

    if (points < 100) {
        modalError.textContent = "Minimum withdrawal is 100 points (₦1,000).";
        modalError.classList.remove("hidden");
        return;
    }

    if ((currentUser.wallet_points || 0) < points) {
        modalError.textContent = `Insufficient points. Current balance is ${currentUser.wallet_points || 0} points.`;
        modalError.classList.remove("hidden");
        return;
    }

    if (!bankName || !accountNum || !accountName) {
        modalError.textContent = "Please provide your bank name, 10-digit account number, and account name.";
        modalError.classList.remove("hidden");
        return;
    }

    try {
        confirmWithdrawBtn.disabled = true;
        confirmWithdrawBtn.textContent = "Processing Transfer...";

        const res = await fetch(`/api/withdrawals?user_id=${currentUser.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                points: points,
                bank_name: bankName,
                account_number: accountNum,
                account_name: accountName
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Withdrawal failed" }));
            throw new Error(err.detail || "Withdrawal failed");
        }

        const data = await res.json();
        alert(`Bank Payout Approved!\nRedeemed: ${data.points_redeemed} Points\nAmount: ₦${(data.naira_amount || (data.points_redeemed * 10)).toLocaleString()}\nBank: ${data.bank_name}\nAccount: ${data.account_number}`);
        closeWithdrawalModal();
        loadWalletAndHistory();
        loadAccountDetails();

    } catch (err) {
        modalError.textContent = err.message;
        modalError.classList.remove("hidden");
    } finally {
        confirmWithdrawBtn.disabled = false;
        confirmWithdrawBtn.textContent = "Confirm Bank Payout";
    }
}


// ==========================================================================
// 10. CAMERA CONTROLS
// ==========================================================================

function switchInputTab(tab) {
    if (tab === "camera") {
        if (tabCamera) tabCamera.classList.add("active");
        if (tabUpload) tabUpload.classList.remove("active");
        if (paneCamera) {
            paneCamera.classList.remove("hidden");
            paneCamera.classList.add("active");
            paneCamera.style.display = "block";
        }
        if (paneUpload) {
            paneUpload.classList.add("hidden");
            paneUpload.classList.remove("active");
            paneUpload.style.display = "none";
        }
        startCamera();
    } else {
        if (tabUpload) tabUpload.classList.add("active");
        if (tabCamera) tabCamera.classList.remove("active");
        if (paneUpload) {
            paneUpload.classList.remove("hidden");
            paneUpload.classList.add("active");
            paneUpload.style.display = "block";
        }
        if (paneCamera) {
            paneCamera.classList.add("hidden");
            paneCamera.classList.remove("active");
            paneCamera.style.display = "none";
        }
        stopCamera();
    }
}

async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported on this browser or requires a secure HTTPS/localhost connection.");
        return;
    }

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: currentCameraFacing },
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
    } catch (primaryErr) {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
        } catch (err) {
            console.warn("Camera access failed:", err);
            let msg = "Could not activate camera.";
            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                msg = "Camera permission was denied. Please allow camera permissions in your browser.";
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                msg = "No camera hardware detected.";
            }
            if (cameraPlaceholder) {
                cameraPlaceholder.innerHTML = `
                    <span class="placeholder-icon">⚠️</span>
                    <h3>Camera Permission Needed</h3>
                    <p class="text-sm text-muted mt-1">${msg}</p>
                    <button class="btn btn-primary btn-sm mt-3" type="button" onclick="startCamera()">Retry Camera</button>
                    <button class="btn btn-secondary btn-sm mt-3 ml-2" type="button" onclick="switchInputTab('upload')">Switch to Upload</button>
                `;
            }
            return;
        }
    }

    if (cameraVideo && cameraStream) {
        cameraVideo.srcObject = cameraStream;
        try {
            await cameraVideo.play();
        } catch (e) {}

        if (cameraPlaceholder) cameraPlaceholder.classList.add("hidden");
        const guide = document.getElementById("camera-overlay-guide");
        if (guide) guide.classList.remove("hidden");

        if (startCameraBtn) startCameraBtn.disabled = true;
        if (stopCameraBtn) stopCameraBtn.disabled = false;
        if (capturePhotoBtn) capturePhotoBtn.disabled = false;
    }
}

function flipCamera() {
    currentCameraFacing = (currentCameraFacing === "environment") ? "user" : "environment";
    startCamera();
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (cameraVideo) {
        cameraVideo.srcObject = null;
    }
    const guide = document.getElementById("camera-overlay-guide");
    if (guide) guide.classList.add("hidden");

    if (cameraPlaceholder) cameraPlaceholder.classList.remove("hidden");
    if (startCameraBtn) startCameraBtn.disabled = false;
    if (stopCameraBtn) stopCameraBtn.disabled = true;
    if (capturePhotoBtn) capturePhotoBtn.disabled = true;
}

function capturePhotoFromCamera() {
    if (!cameraStream || !cameraVideo) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = cameraVideo.videoWidth || 1280;
    offscreen.height = cameraVideo.videoHeight || 720;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(cameraVideo, 0, 0, offscreen.width, offscreen.height);

    offscreen.toBlob(blob => {
        if (blob) {
            handleSelectedImage(blob);
        }
    }, "image/jpeg", 0.95);
}


// ==========================================================================
// 11. AUTHENTICATION & SIGN OUT
// ==========================================================================

function openAuthModal(tab = "login", alertMessage = null) {
    if (currentUser && currentUser.id) {
        switchView(isCollector() ? "scan" : "dashboard");
        return;
    }
    if (!authModal) return;
    authModal.classList.remove("hidden");
    switchAuthTab(tab);

    if (alertMessage) {
        if (authErrorAlert) {
            authErrorAlert.textContent = alertMessage;
            authErrorAlert.classList.remove("hidden");
        }
    } else {
        if (authErrorAlert) authErrorAlert.classList.add("hidden");
        if (authSuccessAlert) authSuccessAlert.classList.add("hidden");
    }
}

function closeAuthModal() {
    if (authModal) authModal.classList.add("hidden");
}

function switchAuthTab(tab) {
    if (tab === "login") {
        authTabBtnLogin.classList.add("active");
        authTabBtnRegister.classList.remove("active");
        authFormLogin.classList.remove("hidden");
        authFormRegister.classList.add("hidden");
    } else {
        authTabBtnRegister.classList.add("active");
        authTabBtnLogin.classList.remove("active");
        authFormRegister.classList.remove("hidden");
        authFormLogin.classList.add("hidden");
    }
    if (authErrorAlert) authErrorAlert.classList.add("hidden");
    if (authSuccessAlert) authSuccessAlert.classList.add("hidden");
}

async function handleLoginSubmit() {
    const ident = (loginIdentifier ? loginIdentifier.value : "").trim();
    const pwd = loginPassword ? loginPassword.value : "";

    if (!ident || !pwd) {
        authErrorAlert.textContent = "Please enter your username and password.";
        authErrorAlert.classList.remove("hidden");
        return;
    }

    try {
        btnLoginSubmit.disabled = true;
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username_or_email: ident, password: pwd })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Login failed" }));
            throw new Error(err.detail || "Invalid credentials");
        }

        const data = await res.json();
        currentUser = data.user;
        currentAuthToken = data.access_token;
        localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
        localStorage.setItem("ecovision_token", currentAuthToken);

        closeAuthModal();
        updateUserUI();

        // Navigate based on role: collector goes to station, user goes to portal
        if (isCollector()) {
            selectCustomer(null);
            switchView(isCollector() ? "scan" : "dashboard");
        } else if (window.location.hash === "#history" || window.location.hash === "#ledger") {
            switchView("history");
        } else {
            loadWalletAndHistory();
            loadAccountDetails();
            switchView("dashboard");
        }

    } catch (err) {
        authErrorAlert.textContent = err.message;
        authErrorAlert.classList.remove("hidden");
    } finally {
        btnLoginSubmit.disabled = false;
    }
}

async function handleRegisterSubmit() {
    const roleSelect = document.getElementById("register-role");
    const role = roleSelect ? roleSelect.value : "user";
    const username = (registerUsername ? registerUsername.value : "").trim();
    const email = (registerEmail ? registerEmail.value : "").trim();
    const pwd = registerPassword ? registerPassword.value : "";
    const confirmPwd = registerConfirmPassword ? registerConfirmPassword.value : "";

    if (pwd !== confirmPwd) {
        authErrorAlert.textContent = "Passwords do not match.";
        authErrorAlert.classList.remove("hidden");
        return;
    }

    try {
        btnRegisterSubmit.disabled = true;
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username,
                email,
                password: pwd,
                role: role
            })
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({ detail: "Registration failed" }));
            throw new Error(err.detail || "Registration failed");
        }

        const data = await res.json();
        currentUser = data.user;
        currentAuthToken = data.access_token;
        localStorage.setItem("ecovision_user", JSON.stringify(currentUser));
        localStorage.setItem("ecovision_token", currentAuthToken);

        closeAuthModal();
        updateUserUI();

        if (isCollector()) {
            selectCustomer(null);
            switchView(isCollector() ? "scan" : "dashboard");
        } else if (window.location.hash === "#history" || window.location.hash === "#ledger") {
            switchView("history");
        } else {
            loadWalletAndHistory();
            loadAccountDetails();
            switchView("dashboard");
        }

    } catch (err) {
        authErrorAlert.textContent = err.message;
        authErrorAlert.classList.remove("hidden");
    } finally {
        btnRegisterSubmit.disabled = false;
    }
}

// Fixed Sign Out: Cleans all state, does NOT resurrect user, and returns to Center Guide
function handleLogout() {
    currentUser = null;
    currentCustomer = null;
    currentAuthToken = null;
    localStorage.removeItem("ecovision_user");
    localStorage.removeItem("ecovision_token");

    try {
        history.replaceState(null, "", "#home");
    } catch (e) {}

    resetDashboardToZero();
    updateUserUI();
    switchView("home");
}


// ==========================================================================
// 12. MASTER EVENT HANDLERS SETUP
// ==========================================================================

function setupEventHandlers() {
    // Logo Brand Link (Direct link to Landing Page)
    if (navBrandLink) {
        navBrandLink.addEventListener("click", (e) => {
            e.preventDefault();
            switchView("home");
        });
    }

    // Home Landing Page CTA Buttons
    const btnHomeRegister = document.getElementById("btn-home-register");
    const btnHomeLogin = document.getElementById("btn-home-login");
    const btnHomeScan = document.getElementById("btn-home-scan");

    if (btnHomeRegister) {
        btnHomeRegister.addEventListener("click", () => openAuthModal("register"));
    }
    if (btnHomeLogin) {
        btnHomeLogin.addEventListener("click", () => openAuthModal("login"));
    }
    if (btnHomeScan) {
        btnHomeScan.addEventListener("click", () => switchView("scan"));
    }

    // Previous Structure Navigation
    if (navBtnDashboard) navBtnDashboard.addEventListener("click", () => switchView("dashboard"));
    if (navBtnScan) navBtnScan.addEventListener("click", () => switchView("scan"));

    // Quick customer lookup (Staff counter)
    if (btnNavQuickCheck) {
        btnNavQuickCheck.addEventListener("click", () => openQuickCheckModal());
    }

    // User Sidebar Drawer Triggers (side ba rusr sud bar)
    if (btnOpenSidebar) btnOpenSidebar.addEventListener("click", openUserSidebar);
    if (navUserInfoBtn) navUserInfoBtn.addEventListener("click", openUserSidebar);
    if (openWalletBtn) openWalletBtn.addEventListener("click", openUserSidebar);
    if (closeUserSidebarBtn) closeUserSidebarBtn.addEventListener("click", closeUserSidebar);
    if (userSidebarBackdrop) userSidebarBackdrop.addEventListener("click", closeUserSidebar);
    if (sidebarWithdrawBtn) sidebarWithdrawBtn.addEventListener("click", () => {
        closeUserSidebar();
        openWithdrawalModal();
        return;
    });
if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener("click", () => {
        closeUserSidebar();
        handleLogout();
        return;
    });
if (sidebarAccountForm) {
        sidebarAccountForm.addEventListener("submit", saveSidebarAccountDetails);
    }
    if (sidebarBtnSaveAccount) {
        sidebarBtnSaveAccount.addEventListener("click", saveSidebarAccountDetails);
    }
    const sidebarBtnViewLedger = document.getElementById("sidebar-btn-view-ledger");
    if (sidebarBtnViewLedger) {
        sidebarBtnViewLedger.addEventListener("click", () => {
            closeUserSidebar();
            switchView("history");
            return;
        });
}

    // Cross-screen navigation
    if (btnJumpDashboard) btnJumpDashboard.addEventListener("click", () => switchView("dashboard"));
    if (btnViewInDashboard) btnViewInDashboard.addEventListener("click", () => switchView("dashboard"));
    if (btnJumpScan) btnJumpScan.addEventListener("click", () => switchView("scan"));
    if (btnScanAnother) btnScanAnother.addEventListener("click", resetImageInput);
    if (refreshHistoryBtn) refreshHistoryBtn.addEventListener("click", loadWalletAndHistory);

    // Dedicated History Page Filters & Pagination
    const histSearchInput = document.getElementById("hist-search-input");
    const histPageSize = document.getElementById("hist-page-size");
    const btnHistPrev = document.getElementById("btn-hist-prev");
    const btnHistNext = document.getElementById("btn-hist-next");
    const btnRefreshHistoryPage = document.getElementById("btn-refresh-history-page");

    if (histSearchInput) histSearchInput.addEventListener("input", applyHistoryFilter);
    if (histPageSize) {
        histPageSize.addEventListener("change", (e) => {
            historyPageSize = parseInt(e.target.value, 10) || 10;
            currentHistoryPage = 1;
            renderPaginatedHistory();
        });
    }
    if (btnHistPrev) {
        btnHistPrev.addEventListener("click", () => {
            if (currentHistoryPage > 1) {
                currentHistoryPage--;
                renderPaginatedHistory();
            }
        });
    }
    if (btnHistNext) {
        btnHistNext.addEventListener("click", () => {
            const totalPages = Math.ceil(filteredHistoryRecords.length / historyPageSize) || 1;
            if (currentHistoryPage < totalPages) {
                currentHistoryPage++;
                renderPaginatedHistory();
            }
        });
    }
    const btnHistBackDashboard = document.getElementById("btn-hist-back-dashboard");
    const btnHistScan = document.getElementById("btn-hist-scan");
    if (btnHistBackDashboard) btnHistBackDashboard.addEventListener("click", () => switchView("dashboard"));
    if (btnHistScan) btnHistScan.addEventListener("click", () => switchView("scan"));

    if (btnRefreshHistoryPage) {
        btnRefreshHistoryPage.addEventListener("click", loadFullHistory);
    }

    // Customer Intake at Station
    if (customerSearchInput) {
        customerSearchInput.addEventListener("input", (e) => handleCustomerSearch(e.target.value));
        customerSearchInput.addEventListener("focus", (e) => handleCustomerSearch(e.target.value));
    }
    if (btnClearSearch) {
        btnClearSearch.addEventListener("click", () => {
            if (customerSearchInput) customerSearchInput.value = "";
            if (customerSearchResults) customerSearchResults.classList.add("hidden");
            btnClearSearch.classList.add("hidden");
        });
    }
    if (btnQuickNewCustomer) {
        btnQuickNewCustomer.addEventListener("click", openQuickCustomerModal);
    }
    if (btnSwitchCustomer) {
        btnSwitchCustomer.addEventListener("click", () => {
            if (customerSearchInput) customerSearchInput.focus();
        });
    }

    // Close search dropdown on click outside
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".customer-search-wrapper")) {
            if (customerSearchResults) customerSearchResults.classList.add("hidden");
        }
    });

    // Bank Account Form in User Portal
    if (accountDetailsForm) {
        accountDetailsForm.addEventListener("submit", saveAccountDetails);
    }
    if (btnSaveAccountDetails) {
        btnSaveAccountDetails.addEventListener("click", saveAccountDetails);
    }

    // Photo input tabs
    if (tabUpload) tabUpload.addEventListener("click", () => switchInputTab("upload"));
    if (tabCamera) tabCamera.addEventListener("click", () => switchInputTab("camera"));

    // File input & drag-and-drop
    if (browseBtn) {
        browseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (fileInput) fileInput.click();
        });
    }
    if (fileInput) {
        fileInput.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                handleSelectedImage(e.target.files[0]);
            }
        });
    }
    if (dropzone) {
        dropzone.addEventListener("click", (e) => {
            if (e.target !== browseBtn && !e.target.closest("#browse-btn")) {
                if (fileInput) fileInput.click();
            }
        });
        dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
        dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) handleSelectedImage(e.dataTransfer.files[0]);
        });
    }

    // Camera actions
    if (startCameraBtn) startCameraBtn.addEventListener("click", startCamera);
    if (stopCameraBtn) stopCameraBtn.addEventListener("click", stopCamera);
    if (capturePhotoBtn) capturePhotoBtn.addEventListener("click", capturePhotoFromCamera);
    if (switchCameraFacingBtn) switchCameraFacingBtn.addEventListener("click", flipCamera);

    // Canvas actions
    if (toggleBboxesBtn) toggleBboxesBtn.addEventListener("click", toggleBoundingBoxes);
    if (submitVerifyBtn) submitVerifyBtn.addEventListener("click", submitImageForVerification);
    if (resetPreviewBtn) resetPreviewBtn.addEventListener("click", resetImageInput);
    if (btnUploadNew) {
        btnUploadNew.addEventListener("click", () => {
            resetImageInput();
            setTimeout(() => {
                if (fileInput) fileInput.click();
            }, 60);
        });
    }

    // Quick Customer lookup modal
    if (closeQuickCheckBtn) closeQuickCheckBtn.addEventListener("click", closeQuickCheckModal);
    if (quickCheckBackdrop) quickCheckBackdrop.addEventListener("click", closeQuickCheckModal);
    if (btnRunQuickCheck) btnRunQuickCheck.addEventListener("click", runQuickCheck);
    if (quickCheckInput) {
        quickCheckInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") runQuickCheck();
        });
    }
    if (btnQcSelectCustomer) {
        btnQcSelectCustomer.addEventListener("click", () => {
            if (lastQuickCheckUser) {
                selectCustomer(lastQuickCheckUser);
                closeQuickCheckModal();
                switchView(isCollector() ? "scan" : "dashboard");
        } else if (window.location.hash === "#history" || window.location.hash === "#ledger") {
            switchView("history");
            }
        });
    }

    // Quick Customer modal
    if (closeQuickCustomerBtn) closeQuickCustomerBtn.addEventListener("click", closeQuickCustomerModal);
    if (cancelQuickCustomerBtn) cancelQuickCustomerBtn.addEventListener("click", closeQuickCustomerModal);
    if (quickCustomerBackdrop) quickCustomerBackdrop.addEventListener("click", closeQuickCustomerModal);
    if (confirmQuickCustomerBtn) confirmQuickCustomerBtn.addEventListener("click", handleQuickCustomerSubmit);

    // Withdrawal modal
    if (withdrawBtn) withdrawBtn.addEventListener("click", openWithdrawalModal);
    if (closeModalBtn) closeModalBtn.addEventListener("click", closeWithdrawalModal);
    if (cancelWithdrawBtn) cancelWithdrawBtn.addEventListener("click", closeWithdrawalModal);
    if (withdrawModalBackdrop) withdrawModalBackdrop.addEventListener("click", closeWithdrawalModal);
    if (confirmWithdrawBtn) confirmWithdrawBtn.addEventListener("click", handleWithdrawalSubmit);
    if (withdrawPointsInput) {
        withdrawPointsInput.addEventListener("input", () => {
            const pts = parseInt(withdrawPointsInput.value) || 0;
            if (modalNairaPreview) modalNairaPreview.textContent = `= ₦${(pts * 10).toLocaleString()} Cash`;
        });
    }

    // Authentication modal & Sign Out
    if (openAuthBtn) openAuthBtn.addEventListener("click", () => openAuthModal("login"));
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener("click", closeAuthModal);
    if (authModalBackdrop) authModalBackdrop.addEventListener("click", closeAuthModal);
    if (authTabBtnLogin) authTabBtnLogin.addEventListener("click", () => switchAuthTab("login"));
    if (authTabBtnRegister) authTabBtnRegister.addEventListener("click", () => switchAuthTab("register"));
    if (btnLoginSubmit) btnLoginSubmit.addEventListener("click", handleLoginSubmit);
    if (btnRegisterSubmit) btnRegisterSubmit.addEventListener("click", handleRegisterSubmit);

    document.querySelectorAll(".btn-toggle-pwd").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (input) {
                const isPassword = input.type === "password";
                input.type = isPassword ? "text" : "password";
                btn.textContent = isPassword ? "Hide" : "Show";
            }
        });
    });

    const switchToRegister = document.getElementById("switch-to-register-link");
    const switchToLogin = document.getElementById("switch-to-login-link");
    if (switchToRegister) switchToRegister.addEventListener("click", () => switchAuthTab("register"));
    if (switchToLogin) switchToLogin.addEventListener("click", () => switchAuthTab("login"));
}
