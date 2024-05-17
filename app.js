require("dotenv").config();
const express = require("express");
const { Connection, Transaction, LAMPORTS_PER_SOL, SystemProgram, Keypair, sendAndConfirmTransaction, PublicKey } = require("@solana/web3.js");
const bs58 = require("bs58");
const app = express();
app.use(express.json());

// Add web3 connection
const connection = new Connection(process.env.RPC);
const keyPair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY));

// Check wallet balance
app.get("/balances", async (_, res) => {
  const balance = await connection.getBalance(keyPair.publicKey);

  res.json({ balance: balance / LAMPORTS_PER_SOL }).status(200);
});

// transfer balance
app.post("/balances", async (req, res) => {
  const {
    body: { amount },
  } = req;
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: keyPair.publicKey,
      toPubkey: process.env.TO_PUBLIC_KEY,
      lamports: amount * LAMPORTS_PER_SOL,
    })
  )

  try {
    const signature = await sendAndConfirmTransaction(
      connection, 
      transaction, 
      [keyPair]);
    const receiverBalance = await connection.getBalance(
      new PublicKey(process.env.TO_PUBLIC_KEY)
    );
    const myBalance = await connection.getBalance(keyPair.publicKey);
    res.json({
      signature,
      receiverBalance: receiverBalance / LAMPORTS_PER_SOL,
      myBalance: myBalance / LAMPORTS_PER_SOL
    })
    .status(200);
  } catch (error) {
    console.error(error);
    res.json({error: "trade error"}).status(400);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});