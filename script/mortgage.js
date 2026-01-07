document.getElementById('mortgageForm').addEventListener('submit', function(e){
  e.preventDefault();

  const price = parseFloat(document.getElementById('price').value);
  const down = parseFloat(document.getElementById('downPayment').value);
  const years = parseInt(document.getElementById('years').value);
  const rate = parseFloat(document.getElementById('rate').value) / 100 / 12;
  const freq = parseInt(document.getElementById('frequency').value);
  const loanAmount = price - down;
  const payments = years * freq;

  const payment = (loanAmount * rate) / (1 - Math.pow(1 + rate, -payments));
  const total = payment * payments;

  document.getElementById('result').classList.remove("hidden");
  document.getElementById('monthly').textContent = `Payment: $${payment.toFixed(2)} (${freq === 12 ? "Monthly" : freq === 26 ? "Bi-Weekly" : "Weekly"})`;
  document.getElementById('total').textContent = `Total Payment: $${total.toFixed(2)}`;
  document.getElementById('loan').textContent = `Loan Amount: $${loanAmount.toFixed(2)}`;

  // Store latest result
  window.calcData = { payment, total, loanAmount, freq };
});

// PDF Download
// document.getElementById('downloadPDF').addEventListener('click', () => {
//   if (!window.calcData) return alert("Please calculate first.");
//   const { payment, total, loanAmount, freq } = window.calcData;
//   const doc = new jsPDF();
//   doc.text("Mortgage Calculation", 10, 10);
//   doc.text(`Payment: $${payment.toFixed(2)} (${freq === 12 ? "Monthly" : freq === 26 ? "Bi-Weekly" : "Weekly"})`, 10, 20);
//   doc.text(`Total Payment: $${total.toFixed(2)}`, 10, 30);
//   doc.text(`Loan Amount: $${loanAmount.toFixed(2)}`, 10, 40);
//   doc.save("mortgage-calculation.pdf");
// });

document.getElementById('downloadPDF').addEventListener('click', () => {
  if (!window.calcData) return alert("Please calculate first.");
  const { payment, total, loanAmount, freq } = window.calcData;

  const { jsPDF } = window.jspdf; // << important for UMD
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Mortgage Calculation", 10, 15);
  doc.setFontSize(12);
  doc.text(`Payment: $${payment.toFixed(2)} (${freq === 12 ? "Monthly" : freq === 26 ? "Bi-Weekly" : "Weekly"})`, 10, 30);
  doc.text(`Total Payment: $${total.toFixed(2)}`, 10, 40);
  doc.text(`Loan Amount: $${loanAmount.toFixed(2)}`, 10, 50);

  doc.save("mortgage-calculation.pdf");
});

// Email + Save to Google Sheets
document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('clientEmail').value;
  if (!window.calcData) return alert("Please calculate first.");

  try {
    await fetch("https://script.google.com/macros/s/AKfycbxYwkEg_siBq4BM49VXhW2TT1yUxFg2-28kwTx3BEq87udCanFBPPWl0j6Po71QhPZ4Rg/exec", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        data: window.calcData
      })
    });
    alert("Results sent and saved successfully.");
    document.getElementById('emailForm').reset();
  } catch (err) {
    alert("Error sending email. Please try again.");
  }
});
