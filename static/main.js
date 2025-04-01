document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.getElementById("dream");
    const form = document.getElementById("dreamForm");
    const responseDiv = document.getElementById("response");
    const container = document.getElementById("contentContainer");
    const submitButton = document.getElementById("submitButton");
    const historyList = document.getElementById("history-list");
    const historyDateHeader = document.getElementById("history-date");
    
    // Keep track of selected date
    let selectedDate = null;

    textarea.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            if (event.shiftKey) {
                event.preventDefault();
                const cursorPos = textarea.selectionStart;
                textarea.value = textarea.value.substring(0, cursorPos) + "\n" + textarea.value.substring(cursorPos);
                textarea.selectionStart = textarea.selectionEnd = cursorPos + 1;
            } else {
                event.preventDefault();
                form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
            }
        }
    });

    textarea.style.overflow = "hidden";
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
    
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        let dreamInput = document.getElementById("dream");
        if (!dreamInput || !dreamInput.value.trim()) {  // Check for empty input
            responseDiv.innerText = "Please enter a dream to analyze.";
            return;
        }
        
        // Show generating indicator
        const genLoad = document.getElementById("genLoad");
        genLoad.style.display = "block";
        
        let formData = new FormData();
        formData.append("dream", dreamInput.value);

        try {
            let baseURL = window.location.hostname === "127.0.0.1"
                ? "http://localhost:8000"
                : window.location.origin;

            let response = await fetch(`${baseURL}/llm`, {
                method: "POST",
                body: formData,
                redirect: "manual", //  Prevents browser from following redirects
                credentials: "same-origin" //  Ensures proper session handling
            });

            if (response.redirected) {
                console.warn("Server tried to redirect, blocking it.");
                return;
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            let jsonResponse = await response.json();
            localStorage.setItem("dreamResult", JSON.stringify(jsonResponse));

            try {
                displayResults(jsonResponse); //  Safe execution
                submitButton.blur();
                dreamInput.value = ""; // Clear input after submission
                
                // If today is selected in the calendar, refresh history
                const today = new Date().toDateString();
                if (selectedDate === today) {
                    fetchHistoryForDate(selectedDate);
                }
            } catch (error) {
                console.error("Error displaying results:", error);
            }
        } catch (error) {
            responseDiv.innerText = "Error: " + error.message;
            console.error("Fetch error:", error);
        } finally {
            // Hide generating indicator
            genLoad.style.display = "none";
        }
    });

    // Calendar logic
    let display = document.querySelector(".display");
    let days = document.querySelector(".days");
    let previous = document.querySelector(".left");
    let next = document.querySelector(".right");

    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth();

    function displayCalendar() {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const firstDayIndex = firstDay.getDay();
        const numberOfDays = lastDay.getDate();

        let formattedDate = date.toLocaleString("en-US", {
            month: "long",
            year: "numeric"
        });

        display.innerHTML = `${formattedDate}`;
        days.innerHTML = ""; // Clear previous days

        for (let x = 1; x <= firstDayIndex; x++) {
            const div = document.createElement("div");
            days.appendChild(div);
        }

        for (let i = 1; i <= numberOfDays; i++) {
            let div = document.createElement("div");
            div.classList.add("date-box");
            let currentDate = new Date(year, month, i);
            div.dataset.date = currentDate.toDateString();
            div.innerHTML = i;

            if (
                currentDate.getFullYear() === new Date().getFullYear() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getDate() === new Date().getDate()
            ) {
                div.classList.add("current-date");
                div.id = "current-date";
            }

            days.appendChild(div);
        }
    }

    // Call the function to display the calendar
    displayCalendar();

    previous.addEventListener("click", () => {
        if (month === 0) {
            month = 11;
            year -= 1;
        } else {
            month -= 1;
        }

        date.setMonth(month);
        displayCalendar();
        addDateClickListeners();
    });

    next.addEventListener("click", () => {
        if (month === 11) {
            month = 0;
            year += 1;
        } else {
            month += 1;
        }

        date.setMonth(month);
        displayCalendar();
        addDateClickListeners();
    });

    // Function to add click listeners to date elements
    function addDateClickListeners() {
        const dayElements = document.querySelectorAll(".days .date-box");
        dayElements.forEach((day) => {
            day.addEventListener("click", (e) => {
                // Clear previous selected date
                const prevSelected = document.querySelector(".current-date");
                if (prevSelected) {
                    prevSelected.classList.remove("current-date");
                    prevSelected.removeAttribute("id");
                }

                // Set new selected date
                const selectedDateElement = e.target;
                selectedDateElement.classList.add("current-date");
                selectedDateElement.id = "current-date";
                
                // Store selected date and fetch history
                selectedDate = selectedDateElement.dataset.date;
                fetchHistoryForDate(selectedDate);
            });
        });
    }

    // Add click listeners initially
    addDateClickListeners();

    // Function to fetch history for a selected date
    async function fetchHistoryForDate(dateString) {
        try {
            // Make sure we display the date correctly regardless of format issues
            const displayDate = new Date(dateString);
            if (isNaN(displayDate.getTime())) {
                historyDateHeader.textContent = "Invalid Date";
                historyList.innerHTML = "<li class='history-error'>Invalid date format</li>";
                return;
            }
            
            historyDateHeader.textContent = displayDate.toLocaleDateString();
            
            // Add loading state
            historyList.innerHTML = "<li class='loading'>Loading history...</li>";
            
            let baseURL = window.location.hostname === "127.0.0.1"
                ? "http://localhost:8000"
                : window.location.origin;
                
            // Make sure we encode the date properly for the URL
            const encodedDate = encodeURIComponent(dateString);
            const response = await fetch(`${baseURL}/history/${encodedDate}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const historyItems = await response.json();
            
            if (response.headers.get('content-type').includes('application/json')) {
                displayHistoryItems(historyItems);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error("Error fetching history:", error);
            historyList.innerHTML = `<li class="history-error">Error loading history: ${error.message}</li>`;
        }
    }

    // Function to display history items in the sidebar
    function displayHistoryItems(items) {
        historyList.innerHTML = "";
        
        if (items.length === 0) {
            historyList.innerHTML = "<li class='no-history'>No chat history for this date</li>";
            return;
        }
        
        items.forEach(item => {
            const listItem = document.createElement("li");
            listItem.className = "history-item";
            listItem.dataset.id = item.id;
            listItem.innerHTML = `
                <span class="history-time">${item.timestamp}</span>
                <span class="history-preview">${item.preview}</span>
            `;
            
            listItem.addEventListener("click", () => fetchQueryById(item.id));
            historyList.appendChild(listItem);
        });
    }

    // Function to fetch a specific query by ID
    async function fetchQueryById(queryId) {
        try {
            let baseURL = window.location.hostname === "127.0.0.1"
                ? "http://localhost:8000"
                : window.location.origin;
                
            const response = await fetch(`${baseURL}/query/${queryId}`);
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const queryData = await response.json();
            
            // Fill the textarea with the dream text
            textarea.value = queryData.dream_text;
            textarea.style.height = "auto";
            textarea.style.height = textarea.scrollHeight + "px";
            
            // Display the response data
            displayResults(queryData.response_data);
            
            // Highlight the selected history item
            const historyItems = document.querySelectorAll(".history-item");
            historyItems.forEach(item => {
                item.classList.remove("selected");
                if (parseInt(item.dataset.id) === queryId) {
                    item.classList.add("selected");
                }
            });
        } catch (error) {
            console.error("Error fetching query:", error);
        }
    }

    function displayResults(parsedData) {
        container.innerHTML = "";
        let archetype = null;
        let t = 1;

        function createElementFromKeyValue(key, value, level = 2) {
            let section = document.createElement("div");
            section.classList.add("section");

            let heading = document.createElement(`h${level}`);
            heading.innerText = key.replace(/_/g, ' ');
            section.appendChild(heading);

            if (typeof value === "string" || typeof value === "number") {
                let paragraph = document.createElement("p");
                paragraph.innerText = value;
                section.appendChild(paragraph);

                if (t === 1 && key.toLowerCase() === "archetype") {
                    paragraph.classList.add('archtype-heading');
                    t = 0; // Ensure only the first "archetype" gets styled
                }    

            } else if (Array.isArray(value)) {
                let list = document.createElement("ul");
                value.forEach(item => {
                    let listItem = document.createElement("li");

                    if (typeof item === "object" && item !== null) {
                        let keylist = Object.keys(item);
                        if (keylist.length > 0 && typeof item[keylist[0]] === "string") {
                            listItem.innerText = item[keylist[0]];
                        }
                    } else {
                        listItem.innerText = item;
                    }

                    list.appendChild(listItem);
                });
                section.appendChild(list);
            } else if (typeof value === "object" && value !== null) {
                for (let subKey in value) {
                    if (value.hasOwnProperty(subKey)) {
                        section.appendChild(createElementFromKeyValue(subKey, value[subKey], Math.min(level + 1, 5)));
                    }
                }
            }
            return section;
        }

        parsedData.forEach(entry => {
            if (entry._id_ && entry._text_) {
                let key = entry._id_;
                let value = entry._text_;
                if (key === "archetype") {
                    archetype = value.toLowerCase().replace(/\s+/g, '_');
                }
                container.appendChild(createElementFromKeyValue(key, value));
            }
        });

        if (archetype) {
            let imgContainer = document.createElement("div");
            imgContainer.classList.add("archetype-image");

            let img = document.createElement("img");
            img.src = `../static/assets/${archetype}.webp`;
            img.alt = `Image of ${archetype}`;
            imgContainer.appendChild(img);
            container.prepend(imgContainer);
        }
    }

    // Set initial state - select today's date if available
    const todayElement = document.getElementById("current-date");
    if (todayElement) {
        selectedDate = todayElement.dataset.date;
        fetchHistoryForDate(selectedDate);
    }

    // Remove this to allow page reloads
    // window.addEventListener("beforeunload", function (event) {
    //     console.warn("Page is attempting to reload!");
    //     event.preventDefault();
    //     return false;
    // });
});