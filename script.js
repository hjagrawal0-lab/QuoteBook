/* =========================================================
   Quotebook - JavaScript
   Features: theme filter, search, favorites, copy,
   random quote, add your own quote (saved in localStorage)
   ========================================================= */

/* ---------- 1. DATA ---------- */
// Themes (key = used in code, name = shown on screen)
const THEMES = [
    { key: "motivation", name: "Motivation" },
    { key: "success",    name: "Success" },
    { key: "wisdom",     name: "Wisdom" },
    { key: "courage",    name: "Courage" },
    { key: "happiness",  name: "Happiness" }
];

// All built-in quotes. You can add or change quotes here.
const BASE_QUOTES = [
    // Motivation
    { id: 1,  text: "The journey of a thousand miles begins with a single step.", author: "Laozi", category: "motivation" },
    { id: 2,  text: "Arise, awake, and stop not till the goal is reached.", author: "Swami Vivekananda", category: "motivation" },
    { id: 3,  text: "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.", author: "A. P. J. Abdul Kalam", category: "motivation" },
    { id: 4,  text: "If you want to shine like a sun, first burn like a sun.", author: "A. P. J. Abdul Kalam", category: "motivation" },

    // Success
    { id: 5,  text: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", category: "success" },
    { id: 6,  text: "Well done is better than well said.", author: "Benjamin Franklin", category: "success" },
    { id: 7,  text: "Success usually comes to those who are too busy to be looking for it.", author: "Henry David Thoreau", category: "success" },
    { id: 8,  text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", category: "success" },

    // Wisdom
    { id: 9,  text: "The unexamined life is not worth living.", author: "Socrates", category: "wisdom" },
    { id: 10, text: "Imagination is more important than knowledge.", author: "Albert Einstein", category: "wisdom" },
    { id: 11, text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", category: "wisdom" },
    { id: 12, text: "The best way to predict the future is to invent it.", author: "Alan Kay", category: "wisdom" },

    // Courage
    { id: 13, text: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", category: "courage" },
    { id: 14, text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "courage" },
    { id: 15, text: "In three words I can sum up everything I've learned about life: it goes on.", author: "Robert Frost", category: "courage" },
    { id: 16, text: "Have the courage to follow your heart and intuition.", author: "Steve Jobs", category: "courage" },

    // Happiness
    { id: 17, text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", category: "happiness" },
    { id: 18, text: "Peace begins with a smile.", author: "Mother Teresa", category: "happiness" },
    { id: 19, text: "Walk as if you are kissing the Earth with your feet.", author: "Thich Nhat Hanh", category: "happiness" },
    { id: 20, text: "Whoever is happy will make others happy too.", author: "Anne Frank", category: "happiness" }
];

/* ---------- 2. STATE ---------- */
const STORAGE_FAV = "quotebook-favorites";
const STORAGE_OWN = "quotebook-own-quotes";

let customQuotes = loadJSON(STORAGE_OWN, []);          // quotes added by the user
let favorites    = new Set(loadJSON(STORAGE_FAV, [])); // ids of favorite quotes
let activeTheme  = "all";                              // "all", "favorites" or a theme key
let searchText   = "";
let lastHeroId   = null;

/* ---------- 3. SMALL HELPERS ---------- */
// localStorage can fail (private mode etc.), so always use try/catch
function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function saveJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        /* ignore: the site still works, it just won't remember */
    }
}

function allQuotes() {
    return BASE_QUOTES.concat(customQuotes);
}

function themeName(key) {
    if (key === "mine") return "My quotes";
    const found = THEMES.find(function (t) { return t.key === key; });
    return found ? found.name : key;
}

function themeColor(key) {
    return "var(--c-" + key + ")";
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

/* ---------- 4. PAGE ELEMENTS ---------- */
const themeListEl   = document.getElementById("themeList");
const quoteListEl   = document.getElementById("quoteList");
const resultsTitle  = document.getElementById("resultsTitle");
const resultsCount  = document.getElementById("resultsCount");
const searchInput   = document.getElementById("searchInput");
const heroQuoteEl   = document.getElementById("heroQuote");
const heroTextEl    = document.getElementById("heroText");
const heroAuthorEl  = document.getElementById("heroAuthor");
const heroThemeEl   = document.getElementById("heroTheme");
const randomBtn     = document.getElementById("randomBtn");
const addForm       = document.getElementById("addForm");
const newCategory   = document.getElementById("newCategory");
const toastEl       = document.getElementById("toast");

/* ---------- 5. THEME BUTTONS ---------- */
function buildThemeButtons() {
    const quotes = allQuotes();
    themeListEl.innerHTML = "";

    // The list of filters: All, each theme, My quotes (if any), Favorites
    const filters = [{ key: "all", name: "All quotes", count: quotes.length }];

    THEMES.forEach(function (t) {
        const count = quotes.filter(function (q) { return q.category === t.key; }).length;
        filters.push({ key: t.key, name: t.name, count: count });
    });

    const mineCount = quotes.filter(function (q) { return q.category === "mine"; }).length;
    if (mineCount > 0) filters.push({ key: "mine", name: "My quotes", count: mineCount });

    filters.push({ key: "favorites", name: "Favorites", count: favorites.size });

    filters.forEach(function (f) {
        const li = el("li");
        const btn = el("button", "theme-btn");
        btn.type = "button";
        btn.setAttribute("aria-pressed", String(activeTheme === f.key));
        btn.style.setProperty("--dot", f.key === "all" || f.key === "favorites" ? "var(--ink)" : themeColor(f.key));
        btn.appendChild(el("span", "", f.name));
        btn.appendChild(el("span", "theme-count", String(f.count)));

        btn.addEventListener("click", function () {
            activeTheme = f.key;
            render();
        });

        li.appendChild(btn);
        themeListEl.appendChild(li);
    });
}

/* ---------- 6. QUOTE LIST ---------- */
function getVisibleQuotes() {
    const term = searchText.trim().toLowerCase();

    return allQuotes().filter(function (q) {
        let themeOk = true;
        if (activeTheme === "favorites") themeOk = favorites.has(q.id);
        else if (activeTheme !== "all") themeOk = q.category === activeTheme;

        const searchOk = term === "" ||
            q.text.toLowerCase().includes(term) ||
            q.author.toLowerCase().includes(term);

        return themeOk && searchOk;
    });
}

function buildQuoteItem(q) {
    const item = el("article", "quote-item");
    item.style.setProperty("--tone", q.category === "mine" ? "var(--c-mine)" : themeColor(q.category));

    item.appendChild(el("p", "quote-text", "\u201C" + q.text + "\u201D"));

    const meta = el("div", "quote-meta");
    meta.appendChild(el("span", "", q.author));
    meta.appendChild(el("span", "tag", themeName(q.category)));
    item.appendChild(meta);

    const tools = el("div", "quote-tools");

    // Favorite button
    const favBtn = el("button", "tool-btn", favorites.has(q.id) ? "Saved" : "Save");
    favBtn.type = "button";
    favBtn.setAttribute("aria-pressed", String(favorites.has(q.id)));
    favBtn.setAttribute("aria-label", "Save to favorites: " + q.text);
    favBtn.addEventListener("click", function () {
        toggleFavorite(q.id);
    });

    // Copy button
    const copyBtn = el("button", "tool-btn", "Copy");
    copyBtn.type = "button";
    copyBtn.setAttribute("aria-label", "Copy quote by " + q.author);
    copyBtn.addEventListener("click", function () {
        copyQuote(q);
    });

    tools.appendChild(favBtn);
    tools.appendChild(copyBtn);
    item.appendChild(tools);

    return item;
}

function renderList() {
    const visible = getVisibleQuotes();
    quoteListEl.innerHTML = "";

    // Title above the list
    if (activeTheme === "all") resultsTitle.textContent = "All quotes";
    else if (activeTheme === "favorites") resultsTitle.textContent = "Your favorites";
    else resultsTitle.textContent = themeName(activeTheme);

    resultsCount.textContent = visible.length + (visible.length === 1 ? " quote" : " quotes");

    if (visible.length === 0) {
        let message = "No quotes match your search. Try another word.";
        if (activeTheme === "favorites" && searchText.trim() === "") {
            message = "No favorites yet. Press Save on any quote and it will appear here.";
        }
        quoteListEl.appendChild(el("p", "empty", message));
        return;
    }

    visible.forEach(function (q) {
        quoteListEl.appendChild(buildQuoteItem(q));
    });
}

function render() {
    buildThemeButtons();
    renderList();
}

/* ---------- 7. FAVORITES & COPY ---------- */
function toggleFavorite(id) {
    if (favorites.has(id)) {
        favorites.delete(id);
        showToast("Removed from favorites");
    } else {
        favorites.add(id);
        showToast("Saved to favorites");
    }
    saveJSON(STORAGE_FAV, Array.from(favorites));
    render();
}

function copyQuote(q) {
    const text = "\u201C" + q.text + "\u201D \u2014 " + q.author;

    // Modern way
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
            showToast("Quote copied");
        }, function () {
            showToast("Could not copy. Select the text and copy it.");
        });
    } else {
        showToast("Copy is not supported in this browser.");
    }
}

let toastTimer = null;
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toastEl.classList.remove("show");
    }, 1800);
}

/* ---------- 8. HERO (random quote) ---------- */
function showRandomQuote() {
    const quotes = allQuotes();
    let pick;

    // do not show the same quote twice in a row
    do {
        pick = quotes[Math.floor(Math.random() * quotes.length)];
    } while (quotes.length > 1 && pick.id === lastHeroId);

    lastHeroId = pick.id;

    heroTextEl.textContent = "\u201C" + pick.text + "\u201D";
    heroAuthorEl.textContent = pick.author;
    heroThemeEl.textContent = themeName(pick.category);
    heroThemeEl.style.background = pick.category === "mine" ? "var(--c-mine)" : themeColor(pick.category);

    // restart the small fade animation
    heroQuoteEl.classList.remove("swap");
    void heroQuoteEl.offsetWidth;
    heroQuoteEl.classList.add("swap");
}

/* ---------- 9. ADD YOUR OWN QUOTE ---------- */
function fillCategorySelect() {
    THEMES.forEach(function (t) {
        const option = el("option", "", t.name);
        option.value = t.key;
        newCategory.appendChild(option);
    });
    const mine = el("option", "", "My quotes");
    mine.value = "mine";
    newCategory.appendChild(mine);
}

addForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const text = document.getElementById("newText").value.trim();
    const author = document.getElementById("newAuthor").value.trim();
    const category = newCategory.value;

    if (text === "" || author === "") {
        showToast("Please fill in the quote and the author");
        return;
    }

    // new id = biggest id so far + 1
    const nextId = allQuotes().reduce(function (max, q) { return Math.max(max, q.id); }, 0) + 1;

    customQuotes.push({ id: nextId, text: text, author: author, category: category });
    saveJSON(STORAGE_OWN, customQuotes);

    addForm.reset();
    activeTheme = category;     // jump to the theme where the new quote lives
    searchText = "";
    searchInput.value = "";
    render();
    showToast("Quote added to " + themeName(category));
    document.getElementById("library").scrollIntoView({ behavior: "smooth" });
});

/* ---------- 10. EVENTS & START ---------- */
searchInput.addEventListener("input", function () {
    searchText = searchInput.value;
    renderList();
});

randomBtn.addEventListener("click", showRandomQuote);

fillCategorySelect();
showRandomQuote();
render();
