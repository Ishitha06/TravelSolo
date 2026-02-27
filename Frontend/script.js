const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const steps = document.querySelectorAll(".step");
const progressBar = document.getElementById("progressBar");
const questionsSection = document.getElementById("questions");
const itinerarySection = document.getElementById("itinerary");
const cityInput = document.getElementById("cityInput");

let currentStep = 0;
let answers = {};

startBtn.onclick = () => {
  document.querySelector(".hero").style.display = "none";
  questionsSection.classList.remove("hidden");
};

document.querySelectorAll(".card").forEach(card => {
  card.onclick = () => {
    card.parentElement.querySelectorAll(".card").forEach(c =>
      c.classList.remove("selected")
    );
    card.classList.add("selected");
    answers[currentStep] = card.dataset.value;
  };
});
// HELPER FUNCTION
// function extractSection(text, section) {
//   const regex = new RegExp(section + ":(.*?)(?=Morning:|Afternoon:|Evening:|$)", "s");
//   const match = text.match(regex);
//   return match ? match[1].trim() : "No activity planned.";
// }

// function extractSection(text, section) {
//   const regex = new RegExp(
//     `\\*?\\*?${section}\\*?\\*?\\s*:?\\s*([\\s\\S]*?)(?=\\*?\\*?(Morning|Afternoon|Evening)\\*?\\*?\\s*:|$)`,
//     "i"
//   );

//   const match = text.match(regex);
//   return match && match[1].trim()
//     ? match[1].trim()
//     : "No activity planned.";
// }

function extractSection(text, section) {
  const regex = new RegExp(
    `\\*?\\*?${section}\\*?\\*?\\s*:?\\s*([\\s\\S]*?)(?=\\*?\\*?(Morning|Afternoon|Evening)\\*?\\*?\\s*:|$)`,
    "i"
  );

  const match = text.match(regex);
  return match && match[1].trim()
    ? match[1].trim()
    : "No activity planned.";
}

nextBtn.onclick = async () => {
  if (!answers[currentStep]) {
    alert("Please select an option");
    return;
  }

  steps[currentStep].classList.remove("active");
  currentStep++;

  if (currentStep < steps.length) {
    steps[currentStep].classList.add("active");
    progressBar.style.width = (currentStep / steps.length) * 100 + "%";
  } else {
    questionsSection.classList.add("hidden");
    itinerarySection.classList.remove("hidden");

    // Call backend
    try {

      const loader = document.getElementById("fullLoader");
loader.classList.remove("hidden");

// Hide itinerary content while loading
document.getElementById("itinerary").style.visibility = "hidden";

      const response = await fetch("http://localhost:5000/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          city: cityInput.value,
          days: answers[0],
          pace: answers[1],
          budget: answers[2],
          vibe: answers[3],
          motivation: answers[4],
          food: answers[5]
        })
      });

      const data = await response.json();

      if (data.error) {
        document.getElementById("cityTitle").innerText = "Error";
        document.getElementById("personalityTag").innerText = data.error;
        return;
      }

      document.getElementById("cityTitle").innerText = cityInput.value;
      document.getElementById("personalityTag").innerText = "Your Personalized Itinerary";
const rawText = data.itinerary;

// 👇STEP  (Personalization)
const hotelMatch = rawText.match(/Hotel:\s*(.*)/i);
if (hotelMatch) {
  document.querySelector(".hotel-card p").innerText = hotelMatch[1];
}



// Extract FULL budget block
const budgetBlockMatch = rawText.match(/Budget Breakdown:\s*([\s\S]*?)(?=Day\s*\d+:|$)/i);

if (budgetBlockMatch) {
  const budgetBlock = budgetBlockMatch[1].trim();

  const accommodation = budgetBlock.match(/Accommodation:.*$/im)?.[0] || "";
  const foodCost = budgetBlock.match(/Food.*$/im)?.[0] || "";
  const activities = budgetBlock.match(/Attractions.*$|Activities.*$/im)?.[0] || "";
  const total = budgetBlock.match(/Total:.*$/im)?.[0] || "";

  document.querySelector(".budget-card").innerHTML = `
    <h3>💸 Estimated Budget</h3>
    <p>${accommodation}</p>
    <p>${foodCost}</p>
    <p>${activities}</p>
    <h4>${total}</h4>
  `;
}

  // STEP 4 Timeline

  // ===== Timeline =====
const timeline = document.getElementById("timeline");
timeline.innerHTML = "";

// Match complete Day blocks
const dayBlocks = rawText.match(/Day\s*\d+[\s\S]*?(?=Day\s*\d+|$)/gi);

let renderedDays = 0;

if (dayBlocks) {
  dayBlocks.forEach((dayText, index) => {

    const morning = extractSection(dayText, "Morning");
    const afternoon = extractSection(dayText, "Afternoon");
    const evening = extractSection(dayText, "Evening");

    // If ALL sections are empty → skip this day
    if (
      morning === "No activity planned." &&
      afternoon === "No activity planned." &&
      evening === "No activity planned."
    ) {
      return; // stop rendering this day
    }

    renderedDays++;

    timeline.innerHTML += `
      <div class="day-card">
        <h2 class="day-title">Day ${renderedDays}</h2>

        <div class="activity morning">
          <h4>☀ Morning</h4>
          <p>${morning}</p>
        </div>

        <div class="activity afternoon">
          <h4>🌇 Afternoon</h4>
          <p>${afternoon}</p>
        </div>

        <div class="activity evening">
          <h4>🌙 Evening</h4>
          <p>${evening}</p>
        </div>
      </div>
    `;
  });


}

    // HIDE LOADER AFTER DATA ARRIVES
    loader.classList.add("hidden");
    itinerarySection.style.visibility = "visible";

// If no more valid days after rendering
if (renderedDays < (dayBlocks ? dayBlocks.length : 0)) {
  timeline.innerHTML += `
    <div style="
      text-align:center;
      margin-top:20px;
      padding:20px;
      font-size:16px;
      color:#64748b;
    ">
      ✨ You explored most of the tourist attractions.
    </div>
  `;
}
    


    } catch (error) {

      loader.classList.add("hidden");
    itinerarySection.style.visibility = "visible";


      document.getElementById("cityTitle").innerText = "Error";
      document.getElementById("personalityTag").innerText = "Something went wrong.";

    
    }
  }
};