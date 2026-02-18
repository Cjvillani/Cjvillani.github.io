// exercises.js

function getCounterValue() {
  const counterSpan = document.getElementById("counter");
  return Number(counterSpan.textContent) || 0;
}

function setCounterValue(newValue) {
  document.getElementById("counter").textContent = String(newValue);
}

// 1pt: Simple Functions
function tickUp() {
  const current = getCounterValue();
  setCounterValue(current + 1);
}

function tickDown() {
  const current = getCounterValue();
  setCounterValue(current - 1);
}

// 1pt: Simple For Loop
function runForLoop() {
  const n = getCounterValue();
  const out = [];

  // If counter is negative, there are no numbers from 0..n
  if (n >= 0) {
    for (let i = 0; i <= n; i++) {
      out.push(i);
    }
  }

  document.getElementById("forLoopResult").textContent = out.join(" ");
}

// 1pt: Repetition with Condition
function showOddNumbers() {
  const n = getCounterValue();
  const out = [];

  for (let i = 1; i <= n; i++) {
    if (i % 2 !== 0) out.push(i);
  }

  document.getElementById("oddNumberResult").textContent = out.join(" ");
}

// 1pt: Arrays
function addMultiplesToArray() {
  const n = getCounterValue();
  const arr = [];

  // Multiples of 5 up to n, in reverse order
  for (let i = n; i >= 5; i--) {
    if (i % 5 === 0) arr.push(i);
  }

  // Important: print the array itself (not arr.join)
  console.log(arr);
}

// 2pts: Objects and Form Fields
function printCarObject() {
  const type = document.getElementById("carType").value;
  const mpg = document.getElementById("carMPG").value;
  const color = document.getElementById("carColor").value;

  // Match the footer object property names: cType, cMPG, cColor
  const carObj = { cType: type, cMPG: mpg, cColor: color };
  console.log(carObj);
}

// 2pts: Objects and Form Fields pt. 2
function loadCar(carNumber) {
  // These objects exist globally because they were declared with "let" in the footer script
  let selected = null;

  if (carNumber === 1) selected = carObject1;
  if (carNumber === 2) selected = carObject2;
  if (carNumber === 3) selected = carObject3;

  if (!selected) return;

  document.getElementById("carType").value = selected.cType;
  document.getElementById("carMPG").value = selected.cMPG;
  document.getElementById("carColor").value = selected.cColor;
}

// 2pt: Changing Styles
function changeColor(choice) {
  const p = document.getElementById("styleParagraph");

  if (choice === 1) p.style.color = "red";
  if (choice === 2) p.style.color = "green";
  if (choice === 3) p.style.color = "blue";
}
