// server.js (Main Backend Server)
const express = require("express");
const cors = require("cors");
require("dotenv").config(); 
const { connectDB, registerUser, getUserByZkID } = require("./DBService");
const { verifyProofOnChain, registerUserOnChain, checkUserRegistered } = require("./BlockService");

const app = express();
const PORT = 3001;

// Middleware
//app.use(cors()); 
const allowedOrigins = [
  "https://dazzling-meerkat-f7b996.netlify.app",
  "http://localhost:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS blocked for origin: " + origin));
      }
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ✅ Handle preflight
app.options("*", cors());
app.use(express.json()); 

// --- API 1: ZK-ID Registration (The Passport Office) ---
app.post("/api/register-id", async (req, res) => {
    try {
        const { name, email, college, zk_id_hash } = req.body;
        
        if (!name || !email || !zk_id_hash) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // 1. DB: MongoDB mein private data save karo
        const userData = { name, email, college, zk_id: zk_id_hash };
        const savedUser = await registerUser(userData);

        // 2. BLOCKCHAIN: ZK-ID को Sepolia पर permanent register करो (WRITE operation)
        await registerUserOnChain(zk_id_hash);

        console.log(`[API] User ${name} registered with ZK-ID: ${zk_id_hash}`);
        res.json({ 
            success: true, 
            message: "ZK-ID registered successfully on-chain and off-chain.",
            zk_id: savedUser.zk_id 
        });

    } catch (error) {
        console.error(`[API] Registration FAILED: ${error.message}`);
        // Handle MongoDB Duplicate error
        if (error.message.includes("User already registered")) {
             return res.status(409).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: "Server error during registration." });
    }
});

// --- API 2: Event Registration & Verification (The Bouncer) ---
// app.post("/api/register-for-event", async (req, res) => {
//     try {
//         const { proof, publicHash } = req.body;
        
//         // 1. CHECK 1 (Ownership Proof): ZK-Proof verification (Judge) - GASLESS VIEW CALL
//         const proofValid = await verifyProofOnChain(proof, publicHash);

//         if (!proofValid) {
//             console.log(`[API] Verification FAILED for ${publicHash}: Invalid Proof.`);
//             return res.status(401).json({ success: false, message: "Invalid ZK-Proof." });
//         }
        
//         // 2. CHECK 2 (Registration Status): Registry check (Guest List) - GASLESS VIEW CALL
//         const userRegistered = await checkUserRegistered(publicHash);

//         if (!userRegistered) {
//             console.log(`[API] Verification FAILED for ${publicHash}: ID not registered or deleted.`);
//             return res.status(401).json({ success: false, message: "ZK-ID not found in Registry." });
//         }

//         // 3. DATA FETCH: On-chain checks paas, ab trusted data nikalo
//         const userData = await getUserByZkID(publicHash);
        
//         if (!userData) {
//             console.log(`[API] Data MISSING for verified ZK-ID: ${publicHash}`);
//             return res.status(500).json({ success: false, message: "Verified ID, but data missing in DB." });
//         }

//         // 4. FINAL ACTION: Event Organizer ko verified data bhejo
//         console.log(`[API] ✅ User ${userData.name} registered for event successfully.`);
//         res.json({
//             success: true,
//             message: "Successfully registered for the event.",
//             verifiedData: {
//                 name: userData.name,
//                 email: userData.email,
//                 college: userData.college,
//                 zk_id: userData.zk_id
//             }
//         });

//     } catch (error) {
//         console.error("[API] Verification FAILED:", error);
//         res.status(500).json({ success: false, message: "Internal server error." });
//     }
// });
// app.post("/api/register-for-event", async (req, res) => {
//   console.log("🟢 Incoming /api/register-for-event request");
//   console.log("Request body:", JSON.stringify(req.body, null, 2));

//   try {
//     const { proof, publicHash } = req.body;
//     console.log("PublicHash:", publicHash);
//     console.log("Proof keys:", proof ? Object.keys(proof) : "No proof");

//     const proofValid = await verifyProofOnChain(proof, publicHash);
//     console.log("✅ Proof verification result:", proofValid);

//     const userRegistered = await checkUserRegistered(publicHash);
//     console.log("✅ Registry check:", userRegistered);

//     const userData = await getUserByZkID(publicHash);
//     console.log("✅ DB lookup:", userData);

//     if (!userData) {
//       console.log(`[API] Data missing for ${publicHash}`);
//       return res.status(500).json({ success: false, message: "Verified ID, but data missing in DB." });
//     }

//     res.json({
//       success: true,
//       message: "Successfully registered for the event.",
//       verifiedData: userData,
//     });
//   } catch (error) {
//     console.error("❌ [API] Verification FAILED:", error);
//     res.status(500).json({ success: false, message: error.message || "Internal server error." });
//   }
// });


app.post("/api/register-for-event", async (req, res) => {
  console.log("🟢 Incoming request to /api/register-for-event");
  console.log("Body:", JSON.stringify(req.body, null, 2));

  try {
    const { proof, publicHash } = req.body;
    console.log("PublicHash:", publicHash);
    console.log("Proof keys:", proof ? Object.keys(proof) : "No proof received");

    const proofValid = await verifyProofOnChain(proof, publicHash);
    console.log("Proof valid result:", proofValid);

    const userRegistered = await checkUserRegistered(publicHash);
    console.log("User registered:", userRegistered);

    const userData = await getUserByZkID(publicHash);
    console.log("User data:", userData);

    res.json({ success: true, verifiedData: userData });
  } catch (error) {
    console.error("❌ [API] Verification FAILED:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// Server Chalu karo
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🌐 Backend Server running on http://localhost:${PORT}`);
    });
});
