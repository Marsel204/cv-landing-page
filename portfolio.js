export function selectProjects(projects, category = "all", expanded = false) {
  return projects.filter((project) => {
    const matches = category === "all" || project.categories.includes(category);
    return matches && (category !== "all" || expanded || !project.more);
  });
}

function initPortfolio() {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const projects = {
    deploy: {
      title: "Adaptive Traffic Control",
      image: "proj_deploy_atsc.jpg",
      alt: "Traffic perception calibration on a road camera feed",
      problem:
        "DeploySkripsi is an undergraduate thesis runtime for adaptive traffic signal control on NVIDIA Jetson Orin Nano. It connects traffic perception to signal actuation.",
      approach:
        "YOLO11 and ByteTrack provide vehicle detection and tracking. Sugeno ANFIS supports adaptive control, with RS-485 communication to the actuation layer.",
      tags: ["NVIDIA Jetson", "YOLO11", "ByteTrack", "Sugeno ANFIS", "RS-485"],
      url: "https://github.com/Marsel204/DeploySkripsi",
    },
    rca: {
      title: "Industrial Root Cause Analysis",
      image: "proj_industrial_rca.png",
      alt: "IndustrialRCA diagnostic workspace and telemetry dashboard",
      problem:
        "IndustrialRCA brings industrial telemetry and a structured diagnostic process into a multi-agent root cause analysis workflow.",
      approach:
        "LangGraph orchestrates agent reasoning with RAG and DeepSeek AI. The system uses ISA-95 asset hierarchies, ISO 14224 / FMEA taxonomies, and Modbus RTU telemetry.",
      tags: ["LangGraph", "Python", "Modbus RTU", "ISA-95", "RAG"],
      url: "https://github.com/Marsel204/IndustrialRCA",
    },
    fuzzy: {
      title: "Food Freshness Touchscreen",
      image: "proj_fuzzylogic_tft.png",
      alt: "Material selection and freshness inspection screens from the prototype",
      problem:
        "fuzzylogic-tft is a food freshness research prototype combining fuzzy inference with an interactive touchscreen interface. The pictured screens include demonstration data.",
      approach:
        "C99 and Python fuzzy inference engines are paired with an ESP32-S3 and GUITION JC2432W328C touchscreen. The interface guides material selection, inspection, and repeat measurement.",
      tags: ["ESP32-S3", "C99", "Python", "GUITION TFT", "Fuzzy logic"],
      url: "https://github.com/Marsel204/fuzzylogic-tft",
    },
    suite: {
      title: "Embedded Engineering Suite",
      image: "proj_embedded_suite.png",
      alt: "Embedded Engineering Suite project illustration",
      problem:
        "Antigravity Embedded Engineering Suite is an agentic development framework for microcontroller engineering tasks.",
      approach:
        "Four pillars cover KiCad schematic generation, headless firmware compilation and flashing, sensor calibration, and crash triage for embedded workflows.",
      tags: ["KiCad", "ESP32", "Arduino", "Python", "Sensor calibration"],
      url: "https://github.com/Marsel204/antigravity-embedded-suite",
    },
    elevator: {
      title: "PLC Elevator Controller",
      image: "proj_elevator.png",
      alt: "Elevator control simulation in TIA Portal and Factory I/O",
      problem:
        "A multi-floor industrial elevator controller simulated in Factory I/O and integrated with Siemens TIA Portal.",
      approach:
        "PLC ladder logic handles call request sequencing, position encoders, safety interlocks, and motor direction controls. The original portfolio describes the simulation as verified.",
      tags: ["Siemens TIA Portal", "Factory I/O", "PLC ladder logic"],
      url: null,
    },
    cad: {
      title: "DOL Motor Starter Panel",
      image: "proj_cad.png",
      alt: "Motor starter electrical diagram and panel layout",
      problem:
        "A complete electrical schematic and physical panel layout for a Direct On Line motor starter.",
      approach:
        "AutoCAD Electrical covers power and control circuits, contactor and thermal overload sizing, terminal numbering, and a bill of materials.",
      tags: ["AutoCAD Electrical", "Panel layout", "DOL starter", "BOM"],
      url: null,
    },
  };
  const legacySections = {
    "#hero": "#about",
    "#certifications": "#credentials",
  };
  const section = legacySections[window.location.hash];
  if (section) {
    window.history.replaceState(null, "", section);
    document.querySelector(section).scrollIntoView();
  }
  const cards = $$(".project");
  const imageFor = (filename) => {
    const project = Object.keys(projects).find(
      (key) => projects[key].image === filename,
    );
    return $(`[data-project="${project}"]`)
      .closest(".project")
      .querySelector("img").src;
  };
  let filter = "all",
    expanded = false;
  function renderProjects() {
    let count = 0;
    const visible = new Set(
      selectProjects(
        cards.map((card) => ({
          card,
          categories: card.dataset.category.split(" "),
          more: card.hasAttribute("data-more"),
        })),
        filter,
        expanded,
      ).map((project) => project.card),
    );
    cards.forEach((card) => {
      card.hidden = !visible.has(card);
      if (!card.hidden) count++;
    });
    $$(".filter").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.filter === filter),
      );
      if (button.dataset.filter === "all")
        button.textContent = expanded ? "All projects" : "Selected projects";
    });
    $("#show-more").hidden = filter !== "all";
    $("#show-more").setAttribute("aria-expanded", String(expanded));
    $("#show-more").firstChild.textContent = expanded
      ? "Show selected projects "
      : "Explore more projects ";
    $("#project-count").textContent =
      filter === "all" && !expanded
        ? "Showing 3 selected projects"
        : `Showing ${count} projects`;
  }
  $$(".filter").forEach((button) =>
    button.addEventListener("click", () => {
      filter = button.dataset.filter;
      renderProjects();
    }),
  );
  $("#show-more").addEventListener("click", () => {
    expanded = !expanded;
    renderProjects();
    if (!expanded)
      $("#projects").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  });
  $$("[data-skill-filter]").forEach((link) =>
    link.addEventListener("click", () => {
      filter = link.dataset.skillFilter;
      renderProjects();
    }),
  );
  $$("[data-project]").forEach((button) =>
    button.addEventListener("click", () => {
      const data = projects[button.dataset.project];
      $("#detail-title").textContent = data.title;
      $("#detail-image").src = imageFor(data.image);
      $("#detail-image").alt = data.alt;
      $("#detail-problem").textContent = data.problem;
      $("#detail-approach").textContent = data.approach;
      $("#detail-tags").replaceChildren(
        ...data.tags.map((tag) => {
          const li = document.createElement("li");
          li.textContent = tag;
          return li;
        }),
      );
      $("#detail-repo").hidden = !data.url;
      if (data.url) $("#detail-repo").href = data.url;
      $("#project-dialog").showModal();
      $("#project-dialog").scrollTop = 0;
    }),
  );
  $$("[data-open-cv]").forEach((button) =>
    button.addEventListener("click", () => $("#cv-dialog").showModal()),
  );
  $$("[data-certificate]").forEach((button) =>
    button.addEventListener("click", () => {
      const card = button.closest(".credential"),
        image = card.querySelector("img");
      $("#certificate-title").textContent = card.dataset.certTitle;
      $("#certificate-issuer").textContent = card.dataset.certIssuer;
      $("#certificate-image").src = image.src;
      $("#certificate-image").alt = image.alt;
      $("#certificate-dialog").showModal();
      $("#certificate-dialog").scrollTop = 0;
    }),
  );
  $$(".dialog").forEach((dialog) => {
    dialog
      .querySelector("[data-close]")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
  });
  const menu = $("#menu-toggle"),
    navigation = $("#navigation");
  function closeMenu() {
    navigation.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Open navigation");
  }
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    navigation.classList.toggle("is-open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
  });
  navigation
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      closeMenu();
      menu.focus();
    }
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navigation.querySelectorAll("a").forEach((link) => {
              if (link.hash === `#${entry.target.id}`)
                link.setAttribute("aria-current", "location");
              else link.removeAttribute("aria-current");
            });
          }
        });
      },
      { rootMargin: "-15% 0px -65% 0px" },
    );
    ["about", "projects", "experience", "credentials"].forEach((id) =>
      observer.observe(document.getElementById(id)),
    );
  }
  $("#copy-email").addEventListener("click", async () => {
    const email = "marselinusalen@gmail.com";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(email);
      } else {
        const input = document.createElement("textarea");
        input.value = email;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.append(input);
        input.select();
        const success = document.execCommand("copy");
        input.remove();
        if (!success) throw new Error("Clipboard unavailable");
      }
      $("#copy-label").textContent = "Email copied";
    } catch {
      $("#copy-label").textContent = email;
    }
    setTimeout(() => {
      $("#copy-label").textContent = "Copy email address";
    }, 3500);
  });
}

if (typeof document !== "undefined") initPortfolio();
