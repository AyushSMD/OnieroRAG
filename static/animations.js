document.querySelector(".send-button").addEventListener("click", () => {
    animateOut()
    setTimeout(() => loadingAnimation(), 1000);
    setTimeout(() =>animateLetters2(), 1000);
});

function loadingAnimation(){
    const gen = document.querySelector(".gen");
    if (gen) {
        gen.classList.add("loading")
    }
}

function animateOut(){
    const container = document.getElementById("projectName");
        const text = container.textContent.trim();
        container.textContent = "";
        
        const letters = text.split("").map(char => {
            const span = document.createElement("span");
            span.textContent = char;
            span.classList.add("letter2");
            container.appendChild(span);
            return span;
        });
        
        let currentIndex = 0;
        function animateLetters() {
            if (currentIndex < letters.length) {
                letters[currentIndex].classList.add("fade");
                currentIndex++;
                setTimeout(animateLetters, 100);
            }
        }
        
        animateLetters();
}

const container = document.getElementById("genLoad");
const text = container.textContent.trim();
container.textContent=""
const letters = [];

text.split("").forEach((char, index) => {
    const span = document.createElement("span");
    span.textContent = char;
    span.classList.add("letter");
    container.appendChild(span);
    letters.push(span);
});

let currentIndex = 0;
function animateLetters2() {
    
    letters.forEach((letter, i) => letter.classList.remove("highlight"));
    letters[currentIndex].classList.add("highlight");
    currentIndex = (currentIndex + 1) % letters.length;
    setTimeout(animateLetters2, 1000);
}
