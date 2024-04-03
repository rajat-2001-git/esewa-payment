const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());

app.use(express.json());

app.post("/esewa-api", async (req, res) => {
  try {
    const { amount, products } = req.body;
    const { uid } = products[0];

    const signature = createSignature(
      `total_amount=${amount},transaction_uuid=${uid},product_code=EPAYTEST`
    );

    const formData = {
      amount: amount,
      failure_url: "https://google.com",
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: "EPAYTEST",
      signature: signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: process.env.SUCCESS_URL,
      tax_amount: "0",
      total_amount: amount,
      transaction_uuid: uid
    };
    res.json({ message: "Order Created Successfully", formData });

  } catch (error) {
    return res.status(400).json({ error: error?.message || "Order failed" });
  }
});

app.get('/success', async (req, res) => {
  try {
    const { data } = req.query;
    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8")
    );
    console.log(decodedData);

    if (decodedData.status !== "COMPLETE") {
      return res.status(400).json({ message: 'Transaction Failed' });
    }

    //Integrity test
    const message = decodedData.signed_field_names
      .split(",")
      .map((field) => `${field}=${decodedData[field]}`)
      .join(",");
    const signature = createSignature(message);

    if (signature !== decodedData.signature) {
      res.json({ message: "Integrity violation. Your data has been compromised" });
    } 
    res.json({ status: "COMPLETE",transaction_code: decodedData.transaction_code,transaction_uuid: decodedData.transaction_uuid  });
  } catch (error) {
    return res.status(400).json({ error: error?.message || "Transaction Failed" })
  }
})

const createSignature = (message) => {
  const secret = process.env.SECRET;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(message);

  const hashInBase64 = hmac.digest('base64');
  return hashInBase64;
}

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
