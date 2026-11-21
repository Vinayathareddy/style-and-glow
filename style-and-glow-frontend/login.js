
import { auth } from "./js/firebase-config.js";

import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

const roleButtons = document.querySelectorAll(".role-button");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

let selectedRole = "customer";

const invalidCredentialsMessage =
  "Invalid email or password. Please check your credentials and try again.";

// Select Customer or Admin
roleButtons.forEach(button => {
  button.addEventListener("click", () => {
    roleButtons.forEach(item => item.classList.remove("active"));

    button.classList.add("active");
    selectedRole = button.dataset.role;
    loginMessage.textContent = "";
  });
});

// Show or hide password
togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "password";

  passwordInput.type = showing ? "text" : "password";
  togglePassword.textContent = showing ? "Hide" : "Show";
});

// Login using Firebase Authentication
loginForm.addEventListener("submit", async event => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value;
  const rememberMe = document.getElementById("rememberMe").checked;

  try {
    loginMessage.textContent = "Signing in...";

    await setPersistence(
      auth,
      rememberMe ? browserLocalPersistence : browserSessionPersistence
    );

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // Check Firebase Admin permission
    const idTokenResult = await user.getIdTokenResult(true);
    const isAdmin = idTokenResult.claims.admin === true;

    if (selectedRole === "admin") {

      if (isAdmin) {
        loginMessage.textContent = "Login successful!";
        window.location.href = "admin.html";
      } else {
        await signOut(auth);
        loginMessage.textContent = invalidCredentialsMessage;
      }

    } else {

      if (isAdmin) {
        await signOut(auth);
        loginMessage.textContent = invalidCredentialsMessage;
        return;
      }

      loginMessage.textContent = "Login successful!";
      window.location.href = "index.html";
    }

  } catch (error) {
    console.error("Login error:", error);

    loginMessage.textContent =
      error.code === "auth/invalid-credential" ||
      error.code === "auth/user-disabled"
        ? invalidCredentialsMessage
        : error.code === "auth/invalid-email"
        ? "Please enter a valid email address."
        : "Login failed. Please try again.";
  }
});

// Forgot password
document.getElementById("forgotPassword").addEventListener("click", async event => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    loginMessage.textContent = "Enter your email address first.";
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    loginMessage.textContent = "Password reset email sent. Check your inbox.";
  } catch (error) {
    console.error(error);
    loginMessage.textContent =
      "Could not send reset email. Check your email.";
  }
});

