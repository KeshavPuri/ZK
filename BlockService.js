// // BlockService.js
// const { ethers } = require("ethers");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// // Addresses .env file se uthayenge
// const VERIFIER_CONTRACT_ADDRESS = process.env.VERIFIER_ADDRESS;
// const REGISTRY_CONTRACT_ADDRESS = process.env.REGISTRY_ADDRESS;

// // ABI files (artifacts folder se)
// const VERIFIER_ABI = JSON.parse(fs.readFileSync(
//     path.join(__dirname, "artifacts/contracts/Verifier.sol/Groth16Verifier.json"), "utf8"
// )).abi;

// const REGISTRY_ABI = JSON.parse(fs.readFileSync(
//     path.join(__dirname, "artifacts/contracts/UserRegistry.sol/UserRegistry.json"), "utf8"
// )).abi;

// // Provider and Signer setup (for READ and WRITE operations)
// const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// // Contracts: Verifier (READ Only) aur Registry (READ/WRITE)
// const VerifierContract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI, provider);
// const RegistryContract = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, wallet); // Wallet (Signer) lagaya kyunki yeh WRITE karega

// // --- ZK-PROOF VERIFICATION (GASLESS READ) ---
// async function verifyProofOnChain(proof, publicHash) {
//     // publicHash ko array format mein lana hoga
//     const publicSignals = [publicHash]; 
    
//     // contract.callStatic se FREE (VIEW) call karte hain
//     const result = await VerifierContract.callStatic.verifyProof(
//         proof.pi_a, proof.pi_b, proof.pi_c, publicSignals
//     );
//     return result; 
// }

// // --- REGISTRY READ (GASLESS READ) ---
// async function checkUserRegistered(publicHash) {
//     const result = await RegistryContract.callStatic.checkUser(publicHash);
//     return result; 
// }

// // --- REGISTRY WRITE (GAS WRITE - Only for Admin/Registration) ---
// async function registerUserOnChain(publicHash) {
//     console.log(`[BLOCK] Registering ZK-ID ${publicHash} on Sepolia...`);
//     // WRITE transaction (gas lagegi)
//     const tx = await RegistryContract.registerUser(publicHash);
//     await tx.wait(); // Transaction confirm hone ka wait karo
//     return true;
// }

// module.exports = {
//     verifyProofOnChain,
//     checkUserRegistered,
//     registerUserOnChain,
// };
// BlockService.js (Final Version: ABIs read from ABIs/ folder)
// const { JsonRpcProvider } = require("ethers");
// const fs = require("fs");
// const path = require("path");
// require("dotenv").config();

// // --- ZAROORI FIX: ABIs ko ABIs/ folder se load karna ---
// // Ab yeh artifacts folder par depend nahi karega.
// const VERIFIER_ABI = JSON.parse(fs.readFileSync(
//     path.join(__dirname, "ABIs/Verifier.sol/VerifierABI.json"), "utf8"
// ));

// const REGISTRY_ABI = JSON.parse(fs.readFileSync(
//     path.join(__dirname, "ABIs/Verifier.sol/RegistryABI.json"), "utf8"
// ));
// // ----------------------------------------------------

// // Addresses .env file se uthayenge
// const VERIFIER_CONTRACT_ADDRESS = process.env.VERIFIER_ADDRESS;
// const REGISTRY_CONTRACT_ADDRESS = process.env.REGISTRY_ADDRESS;

// // Provider and Signer setup (for READ and WRITE operations)
// const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
// // Private key ko connect karke Signer banao
// const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider); 

// // Contracts: Verifier (READ Only) aur Registry (READ/WRITE)
// // Note: Verifier contract ko sirf Provider (read-only) ki zaroorat hai
// const VerifierContract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI, provider); 

// // Note: Registry contract ko Signer (wallet) ki zaroorat hai kyunki yeh 'registerUser' (write) karega
// const RegistryContract = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, wallet); 

// // --- ZK-PROOF VERIFICATION (GASLESS READ) ---
// async function verifyProofOnChain(proof, publicHash) {
//     // publicHash ko array format mein lana hoga
//     const publicSignals = [publicHash]; 
    
//     // contract.callStatic se FREE (VIEW) call karte hain
//     const result = await VerifierContract.callStatic.verifyProof(
//         proof.pi_a, proof.pi_b, proof.pi_c, publicSignals
//     );
//     return result; 
// }

// // --- REGISTRY READ (GASLESS READ) ---
// async function checkUserRegistered(publicHash) {
//     // contract.callStatic se FREE (VIEW) call karte hain
//     const result = await RegistryContract.callStatic.checkUser(publicHash);
//     return result; 
// }

// // --- REGISTRY WRITE (GAS WRITE - Only for Admin/Registration) ---
// async function registerUserOnChain(publicHash) {
//     console.log(`[BLOCK] Registering ZK-ID ${publicHash} on Sepolia...`);
//     // WRITE transaction (gas lagegi)
//     const tx = await RegistryContract.registerUser(publicHash);
//     await tx.wait(); // Transaction confirm hone ka wait karo
//     return true;
// }

// module.exports = {
//     verifyProofOnChain,
//     checkUserRegistered,
//     registerUserOnChain,
// };

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// --- Load ABIs ---
const VERIFIER_ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ABIs/Verifier.sol/VerifierABI.json"), "utf8")
);
const REGISTRY_ABI = JSON.parse(
  fs.readFileSync(path.join(__dirname, "ABIs/Verifier.sol/RegistryABI.json"), "utf8")
);

// --- Addresses ---
const VERIFIER_CONTRACT_ADDRESS = process.env.VERIFIER_ADDRESS;
const REGISTRY_CONTRACT_ADDRESS = process.env.REGISTRY_ADDRESS;

// --- Provider & Wallet ---
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// --- Contracts ---
const VerifierContract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, VERIFIER_ABI, provider);
const RegistryContract = new ethers.Contract(REGISTRY_CONTRACT_ADDRESS, REGISTRY_ABI, wallet);

// --- ZK Proof Verification ---
async function verifyProofOnChain(proof, publicHash) {
  const publicSignals = [publicHash];
  return await VerifierContract.callStatic.verifyProof(
    proof.pi_a,
    proof.pi_b,
    proof.pi_c,
    publicSignals
  );
}

// --- Check User Registered ---
async function checkUserRegistered(publicHash) {
  return await RegistryContract.callStatic.checkUser(publicHash);
}

// --- Register User (write) ---
async function registerUserOnChain(publicHash) {
  console.log(`[BLOCK] Registering ZK-ID ${publicHash} on Sepolia...`);
  const tx = await RegistryContract.registerUser(publicHash);
  await tx.wait();
  return true;
}

module.exports = {
  verifyProofOnChain,
  checkUserRegistered,
  registerUserOnChain,
};

