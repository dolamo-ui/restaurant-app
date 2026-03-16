// FILE: functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const stripe = require("stripe")(functions.config().stripe.secret_key);

admin.initializeApp();

exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
  // 1. Must be logged in
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be signed in to make a payment."
    );
  }

  const { amount, currency = "zar", token } = data;

  // 2. Validate inputs
  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid payment amount.");
  }
  if (!token) {
    throw new functions.https.HttpsError("invalid-argument", "No card token provided.");
  }

  try {
    // 3. Charge the card using the token from the app
    const charge = await stripe.charges.create({
      amount: Math.round(amount * 100), // R50.00 → 5000 cents
      currency,
      source: token,
      description: `FoodHub Order`,
      metadata: {
        uid: context.auth.uid,
        email: context.auth.token.email || "",
      },
    });

    console.log("Charge created:", charge.id, "Status:", charge.status);

    // 4. Return both fields the app needs
    return {
      paymentIntentId: charge.id,   // e.g. ch_xxxxx
      status: charge.status,         // "succeeded" = payment worked
    };

  } catch (error) {
    console.error("Stripe error:", error.message);
    throw new functions.https.HttpsError("internal", error.message);
  }
});