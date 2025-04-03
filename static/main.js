document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.getElementById("dream");
    const form = document.getElementById("dreamForm");
    const responseDiv = document.getElementById("response");
    const container = document.getElementById("contentContainer");
    const submitButton = document.getElementById("submitButton");
    const historyList = document.getElementById("history-list");
    const historyDateHeader = document.getElementById("history-date");
    const interpretation = document.getElementById("interpretation");
    
    // Keep track of selected date
    let selectedDate = null;

    // Setup tabs functionality
    setupTabs();

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

    // display parsed data
    function displayResults(parsedData) {
        interpretation.innerHTML = "";
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
                interpretation.appendChild(createElementFromKeyValue(key, value));
            }
        });

        if (archetype) {
            let imgContainer = document.createElement("div");
            imgContainer.classList.add("archetype-image");

            let img = document.createElement("img");
            img.src = `../static/assets/${archetype}.webp`;
            img.alt = `Image of ${archetype}`;
            imgContainer.appendChild(img);
            interpretation.prepend(imgContainer);
        }

        //initializeCharts()
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

// Chart functionality
// Dark theme settings for all charts
Chart.defaults.color = '#eee';
Chart.defaults.borderColor = '#333';

// Custom gradient for Bar Chart
function createBarGradient(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#5964F3');
    gradient.addColorStop(0.5, '#F650A0');
    gradient.addColorStop(1, '#DCB7F4');
    return gradient;
}

class ChartManager {
    constructor() {
        this.chartInstances = {};
        this.apiBaseUrl = window.location.origin;
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`);
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    createBarChart() {
        this.fetchData('/get_bar_data').then(data => {
            if (!data) return;
            const ctx = document.getElementById('barChart').getContext('2d');
            const gradient = createBarGradient(ctx);
            
            // Check if chart instance exists and destroy it
            if (window.barChartInstance) {
                window.barChartInstance.destroy();
            }
            
            window.barChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: gradient,
                        borderColor: 'transparent',
                        borderRadius: 5,
                        barPercentage: 0.6,
                        maxBarThickness: 50
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: '#1e1e2e',
                            titleColor: '#eee',
                            bodyColor: '#eee',
                            borderColor: '#333',
                            borderWidth: 1,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return `Count: ${context.parsed.y}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error("Error fetching bar chart data:", error);
        });
    }


    // createBarChart() {
    //     console.log("Creating bar chart...");
    //     const ctx = document.getElementById("barChart")?.getContext("2d");
    //     if (!ctx) {
    //         console.error("Canvas for barChart not found!");
    //         return;
    //     }
        
    //     this.destroyChart("barChart");
        
    //     this.chartInstances["barChart"] = new Chart(ctx, {
    //         type: "bar",
    //         data: {
    //             labels: ["Dream A", "Dream B", "Dream C"],
    //             datasets: [{ data: [5, 10, 7], backgroundColor: "#5964F3" }]
    //         },
    //         options: { responsive: true, maintainAspectRatio: true }
    //     });
    // }

    createDoughnutChart() {
        this.fetchData('/get_doughnut_data').then(data => {
            if (!data) return;
            const ctx = document.getElementById('doughnutChart').getContext('2d');
            
            // Custom colors for doughnut segments
            const colors = [
                '#5964F3', // Blue
                '#F650A0', // Pink
                '#DCB7F4', // Light Purple
                '#64B5F6', // Light Blue
                '#BA68C8'  // Purple
            ];
            
            // Check if chart instance exists and destroy it
            if (window.doughnutChartInstance) {
                window.doughnutChartInstance.destroy();
            }
            
            window.doughnutChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: colors,
                        borderColor: '#1e1e2e',
                        borderWidth: 2,
                        hoverOffset: 10
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '60%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 15,
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1e1e2e',
                            titleColor: '#eee',
                            bodyColor: '#eee',
                            borderColor: '#333',
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${context.label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error("Error fetching doughnut chart data:", error);
        });
    }

    createTimeSeriesChart() {
        this.fetchData('/get_time_series_data').then(data => {
            if (!data) return;
            const ctx = document.getElementById('timeSeriesChart').getContext('2d');
            
            // Custom colors for different archetypes
            const colors = [
                '#5964F3', // Blue
                '#F650A0', // Pink
                '#DCB7F4', // Light Purple
                '#64B5F6', // Light Blue
                '#BA68C8'  // Purple
            ];
            
            const datasets = data.data.map((item, index) => {
                return {
                    label: item.archetype,
                    data: item.values,
                    borderColor: colors[index % colors.length],
                    backgroundColor: `${colors[index % colors.length]}33`, // Add transparency
                    borderWidth: 2,
                    tension: 0.3, // Smooth curve
                    fill: false,
                    pointRadius: 4,
                    pointHoverRadius: 6
                };
            });
            
            // Check if chart instance exists and destroy it
            if (window.timeSeriesChartInstance) {
                window.timeSeriesChartInstance.destroy();
            }
            
            window.timeSeriesChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.dates,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                boxWidth: 12,
                                padding: 15,
                                font: {
                                    size: 11
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1e1e2e',
                            titleColor: '#eee',
                            bodyColor: '#eee',
                            borderColor: '#333',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: false
                            },
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
        }).catch(error => {
            console.error("Error fetching time series data:", error);
        });
    }


    createRarityGauge() {
        this.fetchData('/get_rarity_score').then(data => {
            if (!data) return;
            const ctx = document.getElementById('rarityGauge').getContext('2d');
            
            // Create gradient for gauge
            const gradientSegments = ctx.createLinearGradient(0, 0, 400, 0);
            gradientSegments.addColorStop(0, '#5964f3');    // Common - Blue
            // gradientSegments.addColorStop(0.4, '#5964F3');  // Uncommon - Deeper Blue
            // gradientSegments.addColorStop(0.7, '#F650A0');  // Rare - Pink
            gradientSegments.addColorStop(1, '#f650a0');    // Mythic - Purple
            
            // Check if chart instance exists and destroy it
            if (window.rarityGaugeInstance) {
                window.rarityGaugeInstance.destroy();
            }
            
            // Create gauge chart
            window.rarityGaugeInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    datasets: [{
                        data: [data.score, 100 - data.score],
                        backgroundColor: [
                            gradientSegments,
                            'rgba(62, 62, 75, 0.6)'  // Dark background for empty part
                        ],
                        circumference: 180,
                        rotation: 270,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    cutout: '75%',
                    plugins: {
                        tooltip: {
                            enabled: false
                        },
                        legend: {
                            display: false
                        }
                    }
                },
                plugins: [{
                    id: 'rarityText',
                    afterDraw: (chart) => {
                        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
                        
                        ctx.save();
                        
                        // Draw score
                        ctx.font = 'bold 24px JetBrains Mono';
                        ctx.fillStyle = '#eee';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${data.score}`, width / 2 + left, height / 2 + top - 10);
                        
                        // Draw label
                        ctx.font = '14px JetBrains Mono';
                        ctx.fillStyle = '#ccc';
                        ctx.textAlign = 'center';
                        ctx.fillText('Rarity Score', width / 2 + left, height / 2 + top + 15);
                        
                        // Draw archetype
                        ctx.font = 'italic 14px JetBrains Mono';
                        ctx.fillStyle = '#aaa';
                        ctx.textAlign = 'center';
                        ctx.fillText(`Archetype: ${data.archetype}`, width / 2 + left, height / 2 + top + 40);
                        
                        // Draw scale markers
                        ctx.font = '11px JetBrains Mono';
                        ctx.fillStyle = '#999';
                        ctx.textAlign = 'left';
                        ctx.fillText('0', left + 10, bottom - 5);
                        
                        ctx.textAlign = 'right';
                        ctx.fillText('100', right - 10, bottom - 5);
                        
                        ctx.restore();
                    }
                }]
            });
            
            // Update rarity description
            let rarityDescription;
            if (data.score < 25) rarityDescription = "Common";
            else if (data.score < 50) rarityDescription = "Uncommon";
            else if (data.score < 75) rarityDescription = "Rare";
            else rarityDescription = "Mythic";
            
            document.getElementById('rarityDescription').textContent = rarityDescription;
        }).catch(error => {
            console.error("Error fetching rarity score:", error);
        });
    }

    destroyChart(chartId) {
        if (this.chartInstances[chartId]) {
            this.chartInstances[chartId].destroy();
            delete this.chartInstances[chartId];
        }
    }

    initializeCharts() {
        this.createBarChart();
        this.createDoughnutChart();
        this.createTimeSeriesChart();
        this.createRarityGauge();
    }
}

// Initialize charts when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const chartManager = new ChartManager();
    chartManager.initializeCharts();
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// Resource tab content generator
function populateResourcesTab(archetype) {
    const resourcesGrid = document.querySelector('.resources-grid');
    resourcesGrid.innerHTML = ''; // Clear existing content
    
    // Fetch resources from server based on archetype
    fetchResourcesForArchetype(archetype)
        .then(resources => {
            // Generate resource cards
            resources.forEach(resource => {
                const card = document.createElement('div');
                card.className = 'resource-card';
                
                card.innerHTML = `
                    <h3>${resource.title}</h3>
                    <p>${resource.description}</p>
                    <div class="resource-links">
                        ${resource.links.map(link => `
                            <a href="${link.url}" class="resource-link" onclick="return false;">
                                ${link.type} <span class="resource-arrow">→</span>
                            </a>
                        `).join('')}
                    </div>
                `;
                
                resourcesGrid.appendChild(card);
            });
        })
        .catch(error => {
            console.error("Error fetching resources:", error);
            resourcesGrid.innerHTML = '<p class="error-message">Failed to load resources. Please try again later.</p>';
        });
}

populateResourcesTab()

// Fetch resources from Flask server
async function fetchResourcesForArchetype(archetype) {
    try {
        const response = await fetch(`/get_resources/${archetype}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching resources:", error);
        console.log("encountered an error")
        // Return default resources as fallback
        return [
            {
                title: "Understanding Jungian Archetypes",
                description: "An introduction to Carl Jung's theory of archetypes and their significance in dream interpretation.",
                links: [
                    { type: "Article", url: "https://conorneill.com/2018/04/21/understanding-personality-the-12-jungian-archetypes/" },
                ]
            },
            {
                title: "Dream Symbolism Dictionary",
                description: "Comprehensive guide to common dream symbols and their potential meanings across cultures.",
                links: [
                    { type: "Reference", url: "https://www.dreamdictionary.org/" }
                ]
            }
        ];
    }
}