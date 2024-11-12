document
  .getElementById("loginForm")
  .addEventListener("submit", async function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get form values
    const contactEmail = document.getElementById("contactEmail").value.trim();
    const password = document.getElementById("password").value.trim();

    // Basic Validation
    if (!contactEmail || !password) {
      alert("Both fields are required. Please fill in all the details.");
      return;
    }

    // Debugging: Log the values before sending
    console.log("Contact Email:", contactEmail);
    console.log("Password:", password);

    // Submit the form data to the backend
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail,
          password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        console.error("Error:", result);
        document.getElementById("errorMessage").style.display = "block";
      }
    } catch (error) {
      console.error(error);
      alert("Login failed. Please try again.");
    }
  });
