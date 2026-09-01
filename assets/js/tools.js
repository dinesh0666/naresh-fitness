/* ==========================================================================
   NARESH FITNESS — Free Fitness Calculators (BMI / TDEE / Macros)
   Vanilla JS, no dependencies. All maths run client-side only.
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Unit conversion helpers ---------- */
  function ftInToCm(ft, inches) { return ((ft || 0) * 12 + (inches || 0)) * 2.54; }
  function lbToKg(lb) { return lb * 0.453592; }
  function round(value, decimals) {
    var f = Math.pow(10, decimals || 0);
    return Math.round(value * f) / f;
  }

  /* ---------- BMI ---------- */
  function calcBMI(weightKg, heightCm) {
    var heightM = heightCm / 100;
    if (!heightM || heightM <= 0) return null;
    return weightKg / (heightM * heightM);
  }

  function bmiCategory(bmi) {
    if (bmi < 18.5) return { label: "Underweight", modifier: "under" };
    if (bmi < 25) return { label: "Normal Weight", modifier: "normal" };
    if (bmi < 30) return { label: "Overweight", modifier: "over" };
    return { label: "Obese", modifier: "obese" };
  }

  /* Maps a BMI value onto a 0-100% position along a 15-40 gauge for the pointer. */
  function bmiGaugePercent(bmi) {
    var min = 15, max = 40;
    var pct = ((bmi - min) / (max - min)) * 100;
    return Math.max(2, Math.min(98, pct));
  }

  /* ---------- BMR (Mifflin-St Jeor) + TDEE ---------- */
  function calcBMR(gender, weightKg, heightCm, age) {
    var base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === "female" ? base - 161 : base + 5;
  }

  var ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  function calcTDEE(bmr, activityKey) {
    var mult = ACTIVITY_MULTIPLIERS[activityKey] || 1.2;
    return bmr * mult;
  }

  var GOAL_ADJUSTMENTS = {
    lose: { factor: 0.8, label: "Fat Loss (20% deficit)" },
    maintain: { factor: 1, label: "Maintenance" },
    gain: { factor: 1.12, label: "Muscle Gain (12% surplus)" }
  };

  function calcGoalCalories(tdee, goalKey) {
    var goal = GOAL_ADJUSTMENTS[goalKey] || GOAL_ADJUSTMENTS.maintain;
    return { calories: tdee * goal.factor, label: goal.label };
  }

  /* ---------- Macro split ----------
     Protein: ~2g per kg bodyweight (evidence-based range for active adults)
     Fat: 25% of target calories
     Carbs: remaining calories                                            */
  function calcMacros(goalCalories, weightKg) {
    var proteinG = round(weightKg * 2, 0);
    var proteinCal = proteinG * 4;
    var fatCal = goalCalories * 0.25;
    var fatG = round(fatCal / 9, 0);
    var carbCal = Math.max(0, goalCalories - proteinCal - fatCal);
    var carbG = round(carbCal / 4, 0);

    var total = proteinCal + fatG * 9 + carbCal;
    return {
      protein: { grams: proteinG, cal: proteinCal, pct: total ? round((proteinCal / total) * 100) : 0 },
      fat: { grams: fatG, cal: fatG * 9, pct: total ? round(((fatG * 9) / total) * 100) : 0 },
      carbs: { grams: carbG, cal: carbCal, pct: total ? round((carbCal / total) * 100) : 0 }
    };
  }

  /* ---------- DOM wiring ---------- */
  function onReady(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function setupUnitToggle(root, onChange) {
    var radios = root.querySelectorAll("input[type=radio][name$='Unit']");
    var metricFields = root.querySelectorAll("[data-unit='metric']");
    var imperialFields = root.querySelectorAll("[data-unit='imperial']");
    radios.forEach(function (radio) {
      radio.addEventListener("change", function () {
        if (!radio.checked) return;
        metricFields.forEach(function (el) { el.hidden = radio.value !== "metric"; });
        imperialFields.forEach(function (el) { el.hidden = radio.value !== "imperial"; });
        if (onChange) onChange(radio.value);
      });
    });
  }

  /* Adds/removes an .is-active class on the label wrapping each radio in a
     group so the pill styling doesn't depend on the newer :has() selector. */
  function initPillActiveStates(root) {
    var groups = {};
    root.querySelectorAll(".unit-pill input[type=radio]").forEach(function (radio) {
      (groups[radio.name] = groups[radio.name] || []).push(radio);
    });
    Object.keys(groups).forEach(function (name) {
      var radios = groups[name];
      function sync() {
        radios.forEach(function (radio) {
          var pill = radio.closest(".unit-pill");
          if (pill) pill.classList.toggle("is-active", radio.checked);
        });
      }
      radios.forEach(function (radio) { radio.addEventListener("change", sync); });
      sync();
    });
  }

  function getHeightCm(form, unitName) {
    var unit = form.querySelector("input[name='" + unitName + "']:checked");
    var isMetric = !unit || unit.value === "metric";
    if (isMetric) {
      return parseFloat(form.querySelector("[data-field='heightCm']").value) || 0;
    }
    var ft = parseFloat(form.querySelector("[data-field='heightFt']").value) || 0;
    var inches = parseFloat(form.querySelector("[data-field='heightIn']").value) || 0;
    return ftInToCm(ft, inches);
  }

  function getWeightKg(form, unitName) {
    var unit = form.querySelector("input[name='" + unitName + "']:checked");
    var isMetric = !unit || unit.value === "metric";
    if (isMetric) {
      return parseFloat(form.querySelector("[data-field='weightKg']").value) || 0;
    }
    var lb = parseFloat(form.querySelector("[data-field='weightLb']").value) || 0;
    return lbToKg(lb);
  }

  /* ---------- BMI Calculator wiring ---------- */
  function initBMICalculator() {
    var form = document.getElementById("bmiForm");
    if (!form) return;
    var result = document.getElementById("bmiResult");
    var errorEl = document.getElementById("bmiError");

    setupUnitToggle(form);
    initPillActiveStates(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var heightCm = getHeightCm(form, "bmiUnit");
      var weightKg = getWeightKg(form, "bmiUnit");

      if (!heightCm || !weightKg || heightCm < 60 || heightCm > 260 || weightKg < 20 || weightKg > 350) {
        errorEl.hidden = false;
        result.hidden = true;
        return;
      }
      errorEl.hidden = true;

      var bmi = calcBMI(weightKg, heightCm);
      var cat = bmiCategory(bmi);

      document.getElementById("bmiValue").textContent = round(bmi, 1).toFixed(1);
      var catEl = document.getElementById("bmiCategoryLabel");
      catEl.textContent = cat.label;
      catEl.className = "tool-badge tool-badge--" + cat.modifier;
      document.getElementById("bmiGaugeMarker").style.left = bmiGaugePercent(bmi) + "%";

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ---------- Calorie / Macro Calculator wiring ---------- */
  function initCalorieCalculator() {
    var form = document.getElementById("calorieForm");
    if (!form) return;
    var result = document.getElementById("calorieResult");
    var errorEl = document.getElementById("calorieError");

    setupUnitToggle(form);
    initPillActiveStates(form);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var genderInput = form.querySelector("input[name='calGender']:checked");
      var gender = genderInput ? genderInput.value : "male";
      var age = parseFloat(form.querySelector("[data-field='age']").value) || 0;
      var activity = form.querySelector("[data-field='activity']").value;
      var goal = form.querySelector("[data-field='goal']").value;
      var heightCm = getHeightCm(form, "calUnit");
      var weightKg = getWeightKg(form, "calUnit");

      if (!heightCm || !weightKg || !age || age < 14 || age > 90 || heightCm < 120 || heightCm > 230 || weightKg < 30 || weightKg > 300) {
        errorEl.hidden = false;
        result.hidden = true;
        return;
      }
      errorEl.hidden = true;

      var bmr = calcBMR(gender, weightKg, heightCm, age);
      var tdee = calcTDEE(bmr, activity);
      var goalResult = calcGoalCalories(tdee, goal);
      var macros = calcMacros(goalResult.calories, weightKg);

      document.getElementById("bmrValue").textContent = Math.round(bmr).toLocaleString("en-IN");
      document.getElementById("tdeeValue").textContent = Math.round(tdee).toLocaleString("en-IN");
      document.getElementById("goalCalValue").textContent = Math.round(goalResult.calories).toLocaleString("en-IN");
      document.getElementById("goalCalLabel").textContent = goalResult.label;

      document.getElementById("macroProteinG").textContent = macros.protein.grams + "g";
      document.getElementById("macroProteinCal").textContent = Math.round(macros.protein.cal) + " kcal";
      document.getElementById("macroCarbsG").textContent = macros.carbs.grams + "g";
      document.getElementById("macroCarbsCal").textContent = Math.round(macros.carbs.cal) + " kcal";
      document.getElementById("macroFatG").textContent = macros.fat.grams + "g";
      document.getElementById("macroFatCal").textContent = Math.round(macros.fat.cal) + " kcal";

      document.getElementById("macroBarProtein").style.width = macros.protein.pct + "%";
      document.getElementById("macroBarCarbs").style.width = macros.carbs.pct + "%";
      document.getElementById("macroBarFat").style.width = macros.fat.pct + "%";

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  onReady(function () {
    initBMICalculator();
    initCalorieCalculator();
  });

  /* Exposed for reuse/testing */
  window.NareshFitnessTools = {
    calcBMI: calcBMI,
    bmiCategory: bmiCategory,
    calcBMR: calcBMR,
    calcTDEE: calcTDEE,
    calcGoalCalories: calcGoalCalories,
    calcMacros: calcMacros,
    ftInToCm: ftInToCm,
    lbToKg: lbToKg
  };
})();
