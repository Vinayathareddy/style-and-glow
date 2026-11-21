
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({
  credential: applicationDefault(),
  projectId: "style-and-glow"
});

async function main() {
  const auth = getAuth();

  const user = await auth.getUserByEmail(
    "vinayathareddy05@gmail.com"
  );

  await auth.setCustomUserClaims(user.uid, {
    admin: true
  });

  console.log("Admin permission assigned successfully!");
  console.log("Admin email:", user.email);
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
