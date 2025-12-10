// ================  Fetch and parse CSV data ====================

const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTgJ8tq-Zv7p8Ayu80Q_DjQESChGmyIMq23fhgYZmfE1XRYidmT0ihY_AugaQxCGpDG3V1x33PM_pR/pub?output=csv';
let sheetData = [];

let data = {
    regulations: [],
    departments: [],
    semesters: []
};
function fetchSheetData() {
    fetch(sheetUrl)
        .then(response => response.text())
        .then(csvText => {
            const rows = csvText.trim().split('\n').map(row => row.split(','));
            const headers = rows.shift().map(h => h.trim().toLowerCase());

            sheetData = rows.map(row => {
                const entry = {};
                headers.forEach((header, i) => {
                    entry[header] = row[i] ? row[i].trim() : '';
                });
                return entry;
            });
            regDropdown('gpa');
            regDropdown('cgpa');
            regDropdown('target');
        })
        .catch(error => console.error('Error fetching sheet data:', error));
}

// Cache elements in objects
const gpa = {
    reg: document.getElementById('gpa-reg'),
    dep: document.getElementById('gpa-dep'),
    sem: document.getElementById('gpa-sem'),
    tableDiv: document.getElementById('gpa-table-div'),
    tableBody: document.getElementById('gpa-table-div').querySelector('tbody')
};

const cgpa = {
    reg: document.getElementById('cgpa-reg'),
    dep: document.getElementById('cgpa-dep'),
    sem: document.getElementById('cgpa-sem'),
    tableDiv: document.getElementById('cgpa-table-div'),
    tableBody: document.getElementById('cgpa-table-div').querySelector('tbody')
};

const target = {
    reg: document.getElementById('target-reg'),
    dep: document.getElementById('target-dep'),
    sem: document.getElementById('target-sem'),
    currentCgpa: document.getElementById('currentCGPA'),
    targetCgpa: document.getElementById('targetCGPA')
};

const typeMap = { gpa, cgpa, target };

//=================== UI ===================
function UI(mode) {

    // Reset display for all sections
    const sections = ['Intro', 'GPA', 'CGPA', 'Target'];
    const icons = document.querySelectorAll('.bx');

    // Set the title and hide all sections
    document.getElementById('title').textContent = `${mode} Calculator`;
    sections.forEach(section => {
        document.getElementById(section).style.display = (section === mode) ? 'block' : 'none';
    });

    // Remove the selected class from all icons
    icons.forEach(icon => icon.classList.remove('selected'));

    // Add the selected class to the clicked icon
    const iconMap = { 'GPA': '#i-1', 'CGPA': '#i-2', 'Target': '#i-3' };
    document.querySelector(iconMap[mode]).classList.add('selected');
}

// ================  Fetch grade Point ====================
function getGradePoints(grade) {
    const gradeMap = {
        "O": 10,
        "A+": 9,
        "A": 8,
        "B+": 7,
        "B": 6,
        "C": 5,
        "F": 0
    };
    return gradeMap[grade] || 0;
}

// ================  Populate Dropdowns ====================
function regDropdown(type) {
    // Generate the dropdown and associated elements based on the passed parameter
    const regulationSelect = typeMap[type].reg;
    const departmentElement = typeMap[type].dep;
    const semesterElement = typeMap[type].sem;

    // Disable department and semester elements
    departmentElement.disabled = true;
    semesterElement.disabled = true;

    const tableDiv = typeMap[type].tableDiv;
    if (tableDiv) tableDiv.style.display = 'none';

    // Get unique regulations from sheetData
    const uniqueRegs = [...new Set(sheetData.map(row => row['regulation']))];

    // Filter out unwanted values ('Regulation' and empty strings)
    const filteredRegs = uniqueRegs.filter(reg => reg && reg !== 'Regulation');

    // Reset dropdown and populate with filtered regulations
    regulationSelect.innerHTML = '<option value="">Select Regulation</option>';
    filteredRegs.forEach(reg => {
        const option = document.createElement('option');
        option.value = reg;
        option.textContent = reg;
        regulationSelect.appendChild(option);
    });
}
function depDropdown(type) {
    // Generate the correct element IDs based on the passed 'type' (e.g., 'gpa', 'cgpa', 'target')
    const regulationSelect = typeMap[type].reg;
    const departmentSelect = typeMap[type].dep;
    const semesterSelect = typeMap[type].sem;

    // Disable department and semester dropdowns
    departmentSelect.disabled = false;
    semesterSelect.disabled = true;

    const tableDiv = typeMap[type].tableDiv;
    if (tableDiv) tableDiv.style.display = 'none';

    // Reset the dropdowns
    departmentSelect.innerHTML = '<option value="">Select Department</option>';
    semesterSelect.innerHTML = '<option value="">Select Semester</option>';


    // Get the selected regulation
    const regulation = regulationSelect.value;
    if (!regulation) return; // Exit if no regulation is selected

    // Gather unique departments for the selected regulation
    var departments = [...new Set(sheetData
        .filter(row => row['regulation'] === regulation)
        .map(row => row['department']))];

    // Filter out unwanted departments
    departments = departments.filter(dept => dept && dept !== 'Department');

    // Populate the department dropdown
    departments.forEach(department => {
        const option = document.createElement('option');
        option.value = department;
        option.textContent = department;
        departmentSelect.appendChild(option);
    });
}
function semDropdown(type) {
    const regulation = typeMap[type].reg.value;
    const department = typeMap[type].dep.value;
    const semesterSelect = typeMap[type].sem;

    // Reset
    semesterSelect.disabled = false;
    semesterSelect.innerHTML = '<option value="">Select Semester</option>';

    // Hide the table
    const tableDiv = typeMap[type].tableDiv;
    if (tableDiv) tableDiv.style.display = 'none';

    // Hide GPA final section if it exists
    const finalGpa = document.getElementById('final-gpa');
    if (finalGpa) finalGpa.style.visibility = 'hidden';

    // Skip if either regulation or department not selected
    if (!regulation || !department) return;

    // Get unique semesters
    const semesters = [...new Set(
        sheetData
            .filter(row => row['regulation'] === regulation && row['department'] === department)
            .map(row => row['semester'])
    )].filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b));

    // Populate the dropdown
    semesters.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.textContent = `Semester ${sem}`;
        semesterSelect.appendChild(option);
    });
}
function loadSubjects(type, includePrevious = false) {
    const reg = typeMap[type].reg.value;
    const dep = typeMap[type].dep.value;
    const sem = typeMap[type].sem.value;

    if (!reg || !dep || !sem) return;

    const tableDiv = typeMap[type].tableDiv;
    const tableBody = tableDiv.querySelector('tbody');
    tableBody.innerHTML = '';

    sheetData.forEach(entry => {
        const matchesRegDept =
            entry['regulation'] === reg && entry['department'] === dep;

        const matchesSemester = includePrevious
            ? parseInt(entry['semester']) <= parseInt(sem)
            : entry['semester'] === sem;

        if (matchesRegDept && matchesSemester) {
            const row = tableBody.insertRow();
            const subCodeCell = row.insertCell(0);
            const subjectCell = row.insertCell(1);
            const creditsCell = row.insertCell(2);
            const gradeCell = row.insertCell(3);

            subCodeCell.textContent = entry['code'];
            subjectCell.textContent = entry['subject'];
            creditsCell.textContent = entry['credits'];

            const gradeSelect = document.createElement('select');
            ["O", "A+", "A", "B+", "B", "C", "F"].forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = grade;
                gradeSelect.appendChild(option);
            });

            gradeCell.appendChild(gradeSelect);
        }
    });

    tableDiv.style.display = 'block';
}
function calculate(type) {
    // Define element IDs based on type
    const regId = `${type}-reg`;
    const depId = `${type}-dep`;
    const semId = `${type}-sem`;      // For GPA: single semester, for CGPA: completed semester
    const tableId = `${type}-table`;
    const resultId = type === 'cgpa' ? 'cgpa-result' : 'final-gpa';

    // Get selected values
    const regulation = document.getElementById(regId).value;
    const department = document.getElementById(depId).value;
    const semester = document.getElementById(semId).value;

    if (!regulation || !department || !semester) {
        createPopup(`Please select Regulation, Department, and ${type === 'cgpa' ? 'Completed Semester' : 'Semester'}.`);
        return;
    }

    // Table body
    const table = document.getElementById(tableId).getElementsByTagName('tbody')[0];

    let totalCredits = 0;
    let totalGradePoints = 0;

    for (let row of table.rows) {
        const credits = parseFloat(row.cells[2].textContent);
        const grade = row.cells[3].querySelector('select').value;
        const gradePoints = getGradePoints(grade);

        if (type === 'cgpa') {
            // Include all semesters <= completed semester
            const subjectSem = parseInt(sheetData.find(entry =>
                entry['code'] === row.cells[0].textContent &&
                entry['department'] === department &&
                entry['regulation'] === regulation
            )['semester']);

            if (subjectSem > parseInt(semester)) continue;
        }

        totalGradePoints += credits * gradePoints;
        totalCredits += credits;
    }

    const gpa = totalGradePoints / totalCredits;

    const resultDiv = document.getElementById(resultId);
    resultDiv.style.visibility = 'visible';
    resultDiv.children[0].textContent = gpa.toFixed(2);
}

//================  Main Target GPA Logic  ================ 
function calculateTargetGPA() {
    const regulation = typeMap['target'].reg.value;
    const department = typeMap['target'].dep.value;
    const semester = parseInt(typeMap['target'].sem.value);
    const currentCGPA = parseFloat(typeMap['target'].currentCgpa.value);
    const targetCGPA = parseFloat(typeMap['target'].targetCgpa.value);

    if (!regulation || !department || isNaN(semester) || isNaN(currentCGPA) || isNaN(targetCGPA)) {
        createPopup("Please complete all fields.");
        return;
    }

    let completedCredits = 0;
    let totalCredits = 0;

    sheetData.forEach(entry => {
        if (entry['regulation'] === regulation && entry['department'] === department) {
            const entrySem = parseInt(entry['semester']);
            const credits = parseFloat(entry['credits']);
            if (!isNaN(credits)) {
                totalCredits += credits;
                if (entrySem < semester) {
                    completedCredits += credits;
                }
            }
        }
    });

    const remainingCredits = totalCredits - completedCredits;
    if (remainingCredits <= 0) {
        createPopup("No remaining credits found for this selection.");
        return;
    }

    const earnedPoints = currentCGPA * completedCredits;
    const requiredTotalPoints = targetCGPA * totalCredits;
    const neededPoints = requiredTotalPoints - earnedPoints;
    const requiredGPA = neededPoints / remainingCredits;

    const resultEl = document.getElementById('requiredGPAResult');
    const span = resultEl.querySelector('span');

    if (requiredGPA > 10) {
        span.textContent = "more than 10 (not achievable)";
    } else if (requiredGPA < 0) {
        span.textContent = "0 (you've already reached your target!)";
    } else {
        span.textContent = requiredGPA.toFixed(2);
    }

    resultEl.style.display = 'block';
}

// Start the flow
fetchSheetData();

//================  THEME Logic  ================

// Get the theme button and icon elements
const themeButton = document.getElementById('theme-btn');
const icon = themeButton.querySelector('i');

// Load saved theme from localStorage if exists, otherwise fallback to system preference
let currentTheme = localStorage.getItem('theme') || getSystemTheme();
document.documentElement.setAttribute('data-theme', currentTheme);
updateIcon(currentTheme);

// Event listener for the theme toggle button
themeButton.addEventListener('click', () => {
    currentTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateIcon(currentTheme);
});

// Function to update the icon based on the current theme
function updateIcon(theme) {
    if (theme === 'light') {
        icon.classList.replace('bx-sun', 'bx-moon'); // Light mode shows moon to switch to dark
    } else {
        icon.classList.replace('bx-moon', 'bx-sun'); // Dark mode shows sun to switch to light
    }
}

// Function to get the system's preferred theme
function getSystemTheme() {
    // Check system preference using matchMedia
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return isDarkMode ? 'dark' : 'light';
}

// Listen for system theme changes and update theme accordingly
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const newTheme = e.matches ? 'dark' : 'light';
    if (!localStorage.getItem('theme')) {  // Only update if no custom theme is saved
        document.documentElement.setAttribute('data-theme', newTheme);
        updateIcon(newTheme);
    }
});


// =================  Intersection Observer for Animations ====================

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const animationType = entry.target.getAttribute('data-animation');
            entry.target.classList.add('in-view', animationType);
        } else {
            entry.target.classList.remove('in-view', entry.target.getAttribute('data-animation'));
        }
    });
},
    {
        threshold: 0.1
    });

document.querySelectorAll('.animate').forEach((element) => {
    observer.observe(element);
});

// =================  SERVICE WORKER ====================
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/JS/service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.error("Service Worker failed:", err));
}z