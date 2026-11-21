
import { auth } from "./js/firebase-config.js";

import {
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";

import { addCustomer } from "./js/api.js";

const registerForm = document.getElementById("registerForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const registerMessage = document.getElementById("registerMessage");

// Show or hide password
togglePassword.addEventListener("click", () => {
  const showing = passwordInput.type === "password";

  passwordInput.type = showing ? "text" : "password";
  togglePassword.textContent = showing ? "Hide" : "Show";
});

// Register customer
registerForm.addEventListener("submit", async event => {
  event.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = passwordInput.value;
  const confirmPassword =
    document.getElementById("confirmPassword").value;

  if (password !== confirmPassword) {
    registerMessage.textContent = "Passwords do not match.";
    return;
  }

  try {
    registerMessage.textContent = "Creating your account...";

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: fullName
    });

    await addCustomer({
      uid: user.uid,
      name: fullName,
      email: email,
      role: "customer",
      createdAt: new Date().toISOString()
    });

    registerMessage.textContent =
      "Account created successfully! Redirecting to login...";

    registerForm.reset();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (error) {
    console.error("Registration error:", error);

    registerMessage.textContent =
      error.code === "auth/email-already-in-use"
        ? "This email is already registered."
        : error.code === "auth/weak-password"
        ? "Password must contain at least 6 characters."
        : "Registration failed. Please try again.";
  }
});
