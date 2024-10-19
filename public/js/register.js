document
  .getElementById("registrationForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get form values
    const businessName = document.getElementById("businessName").value.trim();
    const ssmNumber = document.getElementById("ssmNumber").value.trim();
    const taxNumber = document.getElementById("taxNumber").value.trim();
    const contactName = document.getElementById("contactName").value.trim();
    const contactEmail = document.getElementById("contactEmail").value.trim();
    const contactPhone = document.getElementById("contactPhone").value.trim();
    const password = document.getElementById("password").value.trim();
    const address = document.getElementById("address").value.trim();

    // Basic Validation
    if (
      !businessName ||
      !ssmNumber ||
      !taxNumber ||
      !contactName ||
      !contactEmail ||
      !contactPhone ||
      !password ||
      !address
    ) {
      alert("All fields are required. Please fill in all the details.");
      return;
    }

    // Email Validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(contactEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Phone Number Validation (Malaysia phone numbers typically 10-12 digits)
    const phonePattern = /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/;
    if (!phonePattern.test(contactPhone)) {
      alert("Please enter a valid Malaysian phone number (e.g., 012-3456789).");
      return;
    }

    // If all validations pass, show loading spinner
    const submitButton = document.querySelector(".submit-btn");
    const spinner = submitButton.querySelector(".spinner-border");
    submitButton.disabled = true;
    spinner.style.display = "inline-block";

    // Submit the form data to the backend
    try {
      const response = await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          ssmNumber,
          taxNumber,
          contactName,
          contactEmail,
          contactPhone,
          password,
          address,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Show success message
        document.getElementById("registrationForm").style.display = "none";
        document.getElementById("successMessage").style.display = "block";
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Registration failed. Please try again.");
      console.error(error);
    } finally {
      submitButton.disabled = false;
      spinner.style.display = "none";
    }
  });
