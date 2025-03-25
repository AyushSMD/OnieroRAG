document.querySelector(".send-button").addEventListener("click", () => {
    document.querySelector(".mainTitle").classList.add("loading");
});

document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.getElementById("dream");
  
    if (textarea) {
        textarea.style.overflow = "hidden"; // Prevent scrollbar
        textarea.style.height = "auto"; // Reset height initially
        textarea.style.height = textarea.scrollHeight + "px"; // Set height dynamically
  
        textarea.addEventListener("input", function () {
            this.style.height = "auto"; // Reset height
            this.style.height = this.scrollHeight + "px"; // Set new height
        });
    }
  });
  
  
  document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("dreamForm").addEventListener("submit", async function(event) {
        event.preventDefault(); 
  
        let dreamInput = document.getElementById("dream");
        let responseDiv = document.getElementById("response");
  
        if (!dreamInput) {
            console.error("Error: Input field with id 'dream' not found.");
            responseDiv.innerText = "Error: Input field missing.";
            return;
        }
  
        let formData = new FormData();
        formData.append("dream", dreamInput.value);
  
        try {
            let response = await fetch("http://localhost:8000/llm", {
                method: "POST",
                body: formData
            });
            console.log("data sent")
  
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
  
            let jsonResponse = await response.json(); // Parse JSON response
            
            // Save JSON response in localStorage
            localStorage.setItem("dreamResult", JSON.stringify(jsonResponse));
  
            console.log("Response saved:", jsonResponse);
            
            // Redirect to results page
            window.location.href = "../templates/results.html";
        } catch (error) {
            responseDiv.innerText = "Error: " + error.message;
            console.error("Fetch error:", error);
        }
    });
  });
  
  