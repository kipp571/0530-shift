document.addEventListener("DOMContentLoaded", () => {

  // ===== FIREBASE REFERENCE =====
  const auth = firebase.auth();
  const db = firebase.database();

  // ===== DOM ELEMENTS =====
  const clockOutBtn = document.getElementById('clockOut');
  const streakText = document.getElementById('streakText');
  const lockStatus = document.getElementById('lockStatus');
  const logoutBtn = document.getElementById('logoutBtn');
  const greetingEl = document.getElementById('greeting');

  const resetBtn = document.getElementById("resetPasswordBtn");
  const resetMsg = document.getElementById("resetMsg");

  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");

  // ===== HELPER FUNCTION =====
  function displayGreeting(name) {
    if (greetingEl) {
      greetingEl.textContent = `Good morning, ${name} — 05:30 shift active`;
    }
  }

  // ===== AUTH STATE =====
  auth.onAuthStateChanged(user => {
    if (!user) {
      // redirect to login page if not logged in
      if (window.location.pathname.includes("index.html")) {
        window.location.href = "login.html";
      }
    } else {
      const uid = user.uid;
      const userRef = db.ref('users/' + uid);

      // First-time name prompt
      userRef.once('value').then(snapshot => {
        const data = snapshot.val() || {};

        if (!data.name) {
          let name = prompt("Welcome! Please enter your name for your profile:");
          if (name && name.trim() !== "") {
            userRef.update({ name: name.trim() });
            displayGreeting(name.trim());
          } else {
            displayGreeting("Nurse");
          }
        } else {
          displayGreeting(data.name);
        }

        // Load streak and completed days
        if (clockOutBtn && streakText && lockStatus) {
          const streak = data.streak || 0;
          const completedDays = data.completedDays || [];

          streakText.textContent = `Current streak: ${streak} days`;

          const today = new Date().toLocaleDateString();
          if (completedDays.includes(today)) {
            clockOutBtn.disabled = true;
            lockStatus.textContent = "Today's drill already completed!";
          } else {
            clockOutBtn.disabled = false;
            lockStatus.textContent = "Finish the shift to earn your badge!";
          }

          // Clock out logic
          clockOutBtn.addEventListener('click', () => {
            if (!completedDays.includes(today)) {
              completedDays.push(today);
              const newStreak = streak + 1;
              streakText.textContent = `Current streak: ${newStreak} days`;
              clockOutBtn.disabled = true;
              lockStatus.textContent = "Shift completed! Badge earned.";

              if (newStreak % 7 === 0) {
                alert(`🎉 Congratulations! You've earned a Week ${newStreak / 7} Badge! 🎉`);
              }

              userRef.update({ streak: newStreak, completedDays });
              localStorage.setItem('streak', newStreak);
              localStorage.setItem('completedDays', JSON.stringify(completedDays));
            }
          });
        }
      });
    }
  });

  // ===== LOGIN =====
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = document.getElementById("authEmail").value;
      const password = document.getElementById("authPassword").value;

      if (!email || !password) return alert("Enter email and password.");

      auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = "index.html")
        .catch(err => alert(err.message));
    });
  }

  // ===== SIGNUP =====
  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      const email = document.getElementById("authEmail").value;
      const password = document.getElementById("authPassword").value;

      if (!email || !password) return alert("Enter email and password.");

      auth.createUserWithEmailAndPassword(email, password)
        .then(() => alert("Account created! Please login."))
        .catch(err => alert(err.message));
    });
  }

  // ===== PASSWORD RESET =====
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      const emailInput = document.getElementById("authEmail");
      const email = emailInput ? emailInput.value : "";

      if (!email) {
        resetMsg.textContent = "Please enter your email first.";
        return;
      }

      auth.sendPasswordResetEmail(email)
        .then(() => {
          resetMsg.textContent = "Password reset email sent. Check your inbox.";
        })
        .catch(error => {
          resetMsg.textContent = error.message;
        });
    });
  }

  // ===== LOGOUT =====
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      auth.signOut();
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

});
