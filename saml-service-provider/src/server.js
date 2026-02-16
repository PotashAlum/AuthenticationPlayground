require("dotenv").config();

const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const passport = require("passport");
const { createSamlStrategy, initializeSamlConfig } = require("./saml-config");

async function initializeServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // Session configuration
  app.use(
    session({
      secret: "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }, // Set to true if using HTTPS
    }),
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  samlConfig = await initializeSamlConfig();
  samlStrategy = await createSamlStrategy(samlConfig);

  passport.use("saml", samlStrategy);

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  // Health check / readiness endpoint
  app.get("/health", (req, res) => {
    res.json({
      status: "ready",
    });
  });

  // Routes
  app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
      res.send(`
      <h1>SAML Service Provider</h1>
      <p>Welcome, ${req.user.nameID || req.user.email || "User"}!</p>
      <h2>User Profile:</h2>
      <pre>${JSON.stringify(req.user, null, 2)}</pre>
      <a href="/logout">Logout</a>
    `);
    } else {
      res.send(`
      <h1>SAML Service Provider</h1>
      <p>You are not logged in.</p>
      <a href="/login">Login with SAML</a>
    `);
    }
  });

  // SAML Login endpoint - initiates SAML authentication
  app.get(
    "/login",
    passport.authenticate("saml", {
      failureRedirect: "/",
      failureFlash: true,
    }),
  );

  // SAML Assertion Consumer Service (ACS) - receives SAML response from IdP
  app.post(
    "/login/callback",
    bodyParser.urlencoded({ extended: false }),
    (req, res, next) => {
      passport.authenticate("saml", (err, user, info) => {
        if (err) {
          console.error("SAML Authentication Error:", err.message);

          // Check for specific error types
          if (err.message && err.message.includes("audience mismatch")) {
            console.error("AUDIENCE MISMATCH ERROR:");
            console.error(
              "The audience in the SAML assertion does not match the expected value.",
            );
            console.error(
              "Expected audience (SP issuer):",
              process.env.SAML_ISSUER || "saml-service-provider",
            );
          }

          return res.status(500).send(`
          <h1>Authentication Failed</h1>
          <p>Error: ${err.message}</p>
          <p><a href="/">Go back</a></p>
        `);
        }

        if (!user) {
          return res.redirect("/");
        }

        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect("/");
        });
      })(req, res, next);
    },
  );

  // Metadata endpoint - provides SP metadata to IdP
  app.get("/metadata", (req, res) => {
    res.type("application/xml");
    res
      .status(200)
      .send(
        samlStrategy.generateServiceProviderMetadata(
          samlConfig.decryptionCert,
          samlConfig.privateCert,
        ),
      );
  });

  // Logout endpoint
  app.get("/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }
      res.redirect("/");
    });
  });

  // Protected route example
  app.get("/protected", ensureAuthenticated, (req, res) => {
    res.json({
      message: "This is a protected resource",
      user: req.user,
    });
  });

  // Middleware to ensure user is authenticated
  function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`SAML Service Provider running on http://localhost:${PORT}`);
    console.log(`Metadata available at: http://localhost:${PORT}/metadata`);
    console.log(`Login URL: http://localhost:${PORT}/login`);
  });
}

initializeServer().catch((err) => {
  console.error("Failed to initialize server:", err.message);
  process.exit(1);
});
