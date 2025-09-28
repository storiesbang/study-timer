const timerDisplay = document.querySelector('.timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const finishBtn = document.getElementById('finish-btn');
const resetBtn = document.getElementById('reset-btn');
const categoryNameInput = document.getElementById('category-name');
const addCategoryBtn = document.getElementById('add-category-btn');
const categoriesList = document.getElementById('categories');
const categoryDropdown = document.getElementById('category-dropdown');
const countdownMode = document.getElementById('countdown-mode');
const stopwatchMode = document.getElementById('stopwatch-mode');
const customTimeInput = document.getElementById('custom-time-input');
const recordsList = document.getElementById('records-list');
const dateFilter = document.getElementById('date-filter');
const totalCategoryTime = document.getElementById('total-category-time');
const totalDateTime = document.getElementById('total-date-time');

let interval;
let timeInSeconds;
let timerMode = 'countdown'; // 'countdown' or 'stopwatch'
let studyRecords = {};
let timerRunning = false;

// Load from local storage
function loadFromLocalStorage() {
    const storedCategories = localStorage.getItem('studyCategories');
    if (storedCategories) {
        const categories = JSON.parse(storedCategories);
        categories.forEach(category => {
            addCategoryToDOM(category);
            if (!studyRecords[category]) {
                studyRecords[category] = [];
            }
        });
    }

    const storedRecords = localStorage.getItem('studyRecords');
    if (storedRecords) {
        studyRecords = JSON.parse(storedRecords);
    }
    displayRecords();
    updateTotalTimes();
}

// Save to local storage
function saveToLocalStorage() {
    localStorage.setItem('studyRecords', JSON.stringify(studyRecords));
    const categories = Array.from(categoriesList.children).map(li => li.firstChild.textContent.trim());
    localStorage.setItem('studyCategories', JSON.stringify(categories));
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

function updateTimerDisplay() {
    const minutes = Math.floor(Math.abs(timeInSeconds) / 60);
    const seconds = Math.abs(timeInSeconds) % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (timerRunning) return;
    timerRunning = true;

    const selectedCategory = categoryDropdown.value;
    if (!selectedCategory) {
        alert('Please select a category first!');
        timerRunning = false;
        return;
    }

    if (timerMode === 'countdown') {
        if (!timeInSeconds) {
            timeInSeconds = customTimeInput.value * 60;
        }
        interval = setInterval(() => {
            timeInSeconds--;
            updateTimerDisplay();
            if (timeInSeconds <= 0) {
                clearInterval(interval);
                saveStudyRecord(customTimeInput.value * 60);
                timerRunning = false;
                resetTimer(false);
            }
        }, 1000);
    } else { // stopwatch
        if (!timeInSeconds) {
            timeInSeconds = 0;
        }
        interval = setInterval(() => {
            timeInSeconds++;
            updateTimerDisplay();
        }, 1000);
    }
}

function pauseTimer() {
    if (!timerRunning) return;
    timerRunning = false;
    clearInterval(interval);
}

function finishTimer() {
    if (!timerRunning && (!timeInSeconds || timeInSeconds === 0)) return;

    let duration = 0;
    if (timerMode === 'countdown') {
        duration = customTimeInput.value * 60 - timeInSeconds;
    } else { // stopwatch
        duration = timeInSeconds;
    }
    if (duration > 0) {
        saveStudyRecord(duration);
    }

    pauseTimer();
    resetTimer(false);
}

function resetTimer(saveRecord = false) {
    pauseTimer();
    if (saveRecord && timeInSeconds > 0) {
        saveStudyRecord(timeInSeconds);
    }
    timeInSeconds = (timerMode === 'countdown') ? customTimeInput.value * 60 : 0;
    updateTimerDisplay();
}

function addCategory() {
    const categoryName = categoryNameInput.value.trim();
    if (categoryName && !studyRecords[categoryName]) {
        studyRecords[categoryName] = [];
        addCategoryToDOM(categoryName);
        saveToLocalStorage();
        categoryNameInput.value = '';
    }
}

function addCategoryToDOM(categoryName) {
    const newCategoryItem = document.createElement('li');
    newCategoryItem.innerHTML = `<span>${categoryName}</span><button class="delete-btn">Delete</button>`;
    categoriesList.appendChild(newCategoryItem);

    const newCategoryOption = document.createElement('option');
    newCategoryOption.value = categoryName;
    newCategoryOption.textContent = categoryName;
    categoryDropdown.appendChild(newCategoryOption);
}

function deleteCategory(categoryName) {
    const categoryItems = Array.from(categoriesList.children);
    const itemToRemove = categoryItems.find(item => item.firstChild.textContent.trim() === categoryName);
    if (itemToRemove) {
        categoriesList.removeChild(itemToRemove);
    }

    const categoryOptions = Array.from(categoryDropdown.options);
    const optionToRemove = categoryOptions.find(option => option.value === categoryName);
    if (optionToRemove) {
        categoryDropdown.removeChild(optionToRemove);
    }

    delete studyRecords[categoryName];
    saveToLocalStorage();
    displayRecords();
    updateTotalTimes();
}

function saveStudyRecord(duration) {
    const selectedCategory = categoryDropdown.value;
    if (!selectedCategory) return;

    const now = new Date();
    const record = {
        id: Date.now(),
        category: selectedCategory,
        duration: duration,
        date: now.toISOString().split('T')[0], // YYYY-MM-DD
        fullDate: now.toLocaleString()
    };
    if (!studyRecords[selectedCategory]) {
        studyRecords[selectedCategory] = [];
    }
    studyRecords[selectedCategory].push(record);
    saveToLocalStorage();
    displayRecords();
    updateTotalTimes();
}

function displayRecords() {
    recordsList.innerHTML = '';
    const selectedCategory = categoryDropdown.value;
    const selectedDate = dateFilter.value;

    if (selectedCategory && studyRecords[selectedCategory]) {
        let recordsToDisplay = studyRecords[selectedCategory];

        if (selectedDate) {
            recordsToDisplay = recordsToDisplay.filter(record => record.date === selectedDate);
        }

        recordsToDisplay.forEach(record => {
            addRecordToDOM(record);
        });
    }
}

function addRecordToDOM(record) {
    const newRecordItem = document.createElement('li');
    newRecordItem.dataset.id = record.id;
    newRecordItem.dataset.category = record.category;
    newRecordItem.innerHTML = `<span>${record.fullDate} - ${formatTime(record.duration)}</span><button class="delete-btn">Delete</button>`;
    recordsList.appendChild(newRecordItem);
}

function deleteRecord(recordId) {
    for (const category in studyRecords) {
        const recordIndex = studyRecords[category].findIndex(r => r.id == recordId);
        if (recordIndex > -1) {
            studyRecords[category].splice(recordIndex, 1);
            break;
        }
    }
    saveToLocalStorage();
    displayRecords();
    updateTotalTimes();
}

function updateTotalTimes() {
    const selectedCategory = categoryDropdown.value;
    const selectedDate = dateFilter.value;

    let categoryTotal = 0;
    let dateTotal = 0;

    if (selectedCategory && studyRecords[selectedCategory]) {
        studyRecords[selectedCategory].forEach(record => {
            categoryTotal += record.duration;
            if (selectedDate && record.date === selectedDate) {
                dateTotal += record.duration;
            }
        });
    }

    totalCategoryTime.textContent = formatTime(categoryTotal);
    totalDateTime.textContent = formatTime(dateTotal);
}

function setTimerMode() {
    timerMode = this.value;
    resetTimer(false);
}

// Event Listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
finishBtn.addEventListener('click', finishTimer);
resetBtn.addEventListener('click', () => resetTimer(false));
addCategoryBtn.addEventListener('click', addCategory);
countdownMode.addEventListener('change', setTimerMode);
stopwatchMode.addEventListener('change', setTimerMode);
customTimeInput.addEventListener('change', () => {
    if (timerMode === 'countdown') {
        timeInSeconds = customTimeInput.value * 60;
        updateTimerDisplay();
    }
});

categoriesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const categoryName = e.target.parentElement.firstChild.textContent.trim();
        deleteCategory(categoryName);
    }
});

recordsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const recordId = e.target.parentElement.dataset.id;
        deleteRecord(recordId);
    }
});

categoryDropdown.addEventListener('change', () => {
    displayRecords();
    updateTotalTimes();
});

dateFilter.addEventListener('change', () => {
    displayRecords();
    updateTotalTimes();
});

document.addEventListener('DOMContentLoaded', loadFromLocalStorage);

// Initial setup
function initialize() {
    timeInSeconds = (timerMode === 'countdown') ? customTimeInput.value * 60 : 0;
    updateTimerDisplay();
}

initialize();