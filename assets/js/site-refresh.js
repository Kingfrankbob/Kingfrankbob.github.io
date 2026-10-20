(function () {
  const accents = [
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet",
  ];
  const titles = [
    "Michael's Site",
    "M'S DEEEP ABYSS",
    "Michaels Game Dev Closet",
  ];
  const accentKey = "michaels-site-accent";
  const customColorKey = "michaels-site-custom-accent";
  const fireworksKey = "michaels-site-fireworks";
  const defaultFireworks = {
    enabled: true,
    launchRate: 2,
    burstSize: 50,
    trails: true,
    colorMode: "rainbow",
  };
  let titleIndex = 0;
  let deepAbyssLogoClicks = 0;

  function readStored(key, fallback) {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function chooseRandomAccent() {
    if (Math.random() < 0.0001) return "rainbow";
    return accents[Math.floor(Math.random() * accents.length)];
  }

  function applyAccent(choice, customColor) {
    document.body.style.removeProperty("--refresh-accent");
    if (choice === "custom") {
      document.body.dataset.accent = "custom";
      document.body.style.setProperty(
        "--refresh-accent",
        customColor || "#ff72b6",
      );
      return;
    }
    document.body.dataset.accent =
      choice === "random" || choice === "roygbiv"
        ? chooseRandomAccent()
        : choice;
  }

  const savedAccentChoice = readStored(accentKey, "random");
  const savedAccent =
    accents.includes(savedAccentChoice) ||
    savedAccentChoice === "custom" ||
    savedAccentChoice === "roygbiv"
      ? savedAccentChoice
      : "random";
  const savedCustomColor = readStored(customColorKey, "#ff72b6");
  applyAccent(savedAccent, savedCustomColor);

  if (document.body.dataset.rotateTitle === "true") {
    const cycleTitle = () => {
      titleIndex = (titleIndex + 1) % titles.length;
      document.title = titles[titleIndex];
      if (document.title !== "M'S DEEEP ABYSS") deepAbyssLogoClicks = 0;
      window.setTimeout(
        cycleTitle,
        document.title === "M'S DEEEP ABYSS" ? 15000 : 3200,
      );
    };
    window.setTimeout(cycleTitle, 3200);
  }

  const dialog = document.getElementById("settings-dialog");
  const logo = document.getElementById("logo-trigger");
  const accentSelect = document.getElementById("settings-accent");
  const customColor = document.getElementById("settings-custom-color");
  const customColorField = document.getElementById(
    "settings-custom-color-field",
  );
  const fireworksEnabled = document.getElementById(
    "settings-fireworks-enabled",
  );
  const launchRate = document.getElementById("settings-launch-rate");
  const burstSize = document.getElementById("settings-burst-size");
  const trailsEnabled = document.getElementById("settings-trails-enabled");
  const fireworkColorMode = document.getElementById("settings-firework-color");
  const unlockTitle = "M'S DEEEP ABYSS";

  if (!dialog || !logo || !accentSelect) return;

  accentSelect.value =
    accents.includes(savedAccent) ||
    savedAccent === "roygbiv" ||
    savedAccent === "custom"
      ? savedAccent
      : "random";
  customColor.value = savedCustomColor;
  customColorField.hidden = accentSelect.value !== "custom";

  let storedFireworks = defaultFireworks;
  try {
    storedFireworks = {
      ...defaultFireworks,
      ...JSON.parse(readStored(fireworksKey, "{}")),
    };
  } catch {
    storedFireworks = defaultFireworks;
  }

  fireworksEnabled.checked = storedFireworks.enabled !== false;
  launchRate.value = String(storedFireworks.launchRate);
  burstSize.value = String(storedFireworks.burstSize);
  trailsEnabled.checked = storedFireworks.trails !== false;
  fireworkColorMode.value =
    storedFireworks.colorMode === "accent" ? "accent" : "rainbow";

  const updateOutput = (inputId, outputId, suffix) => {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    const update = () => {
      output.value = `${input.value}${suffix}`;
      output.textContent = output.value;
    };
    input.addEventListener("input", update);
    update();
  };

  updateOutput("settings-launch-rate", "settings-launch-rate-value", "/sec");
  updateOutput("settings-burst-size", "settings-burst-size-value", " sparks");

  accentSelect.addEventListener("change", () => {
    customColorField.hidden = accentSelect.value !== "custom";
  });

  logo.addEventListener("click", (event) => {
    event.preventDefault();
    if (document.title !== unlockTitle) return;

    deepAbyssLogoClicks += 1;
    if (deepAbyssLogoClicks >= 15) {
      deepAbyssLogoClicks = 0;
      dialog.showModal();
    }
  });

  dialog
    .querySelector("[data-close-settings]")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.getElementById("settings-apply").addEventListener("click", () => {
    const accent = accentSelect.value;
    const fireworksSettings = {
      enabled: fireworksEnabled.checked,
      launchRate: Number(launchRate.value),
      burstSize: Number(burstSize.value),
      trails: trailsEnabled.checked,
      colorMode: fireworkColorMode.value,
    };

    localStorage.setItem(accentKey, accent);
    localStorage.setItem(customColorKey, customColor.value);
    localStorage.setItem(fireworksKey, JSON.stringify(fireworksSettings));
    applyAccent(accent, customColor.value);
    window.dispatchEvent(
      new CustomEvent("site-settings-updated", { detail: fireworksSettings }),
    );
    dialog.close();
  });

  document
    .getElementById("settings-random-accent")
    .addEventListener("click", () => {
      localStorage.setItem(accentKey, "random");
      dialog.close();
      window.location.reload();
    });
})();
