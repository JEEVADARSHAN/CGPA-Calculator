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

//=================== UI ===================
function UI(mode) {
    // Reset display for all sections
    document.getElementById('title').textContent = mode + " Calculator";
    document.getElementById('GPA').style.display = 'none';
    document.getElementById('CGPA').style.display = 'none';
    document.getElementById('Target').style.display = 'none';
    document.getElementById('Intro').style.display = 'none';

    // Show the relevant section
    if (mode == "GPA") {
        document.getElementById('GPA').style.display = 'block';
    } else if (mode == "CGPA") {
        document.getElementById('CGPA').style.display = 'block';
    } else if (mode == "Target") {
        document.getElementById('Target').style.display = 'block';
    }

    // Get all the icons with the class .bx
    const icons = document.querySelectorAll('.bx');

    // Remove the selected class from all icons
    icons.forEach(icon => {
        icon.classList.remove('selected');
    });
    // Add the selected class to the clicked icon
    switch (mode) {
        case 'GPA':
            document.querySelector('#i-1').classList.add('selected');
            break;
        case 'CGPA':
            document.querySelector('#i-2').classList.add('selected');
            break;
        case 'Target':
            document.querySelector('#i-3').classList.add('selected');
            break;
    }
}


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

            populateRegulationDropdown();
            populateRegulationDropdownCGPA()
            populateTargetRegulationDropdown()
        })
        .catch(error => console.error('Error fetching sheet data:', error));
}

//================  Populate regulation dropdown ====================
function populateRegulationDropdown() {
    const regulationSelect = document.getElementById('regulation');
    document.getElementById('final-gpa').visibility = 'hidden';
    data.regulations = [];

    sheetData.forEach(entry => {
        const regulation = entry['regulation'];
        if (regulation && !data.regulations.includes(regulation)) {
            data.regulations.push(regulation);
        }
    });
    data.regulations = data.regulations.filter(reg => reg && reg !== 'Regulation');
    regulationSelect.innerHTML = '<option value="">Select Regulation</option>';
    data.regulations.forEach(regulation => {
        const option = document.createElement('option');
        option.value = regulation;
        option.textContent = regulation;
        regulationSelect.appendChild(option);
    });
    document.getElementById('department').disabled = true;
    document.getElementById('semester').disabled = true;
}

// ================  Populate departments based on selected regulation ====================
function fetchDepartments() {
    document.getElementById('department').disabled = false;
    document.getElementById('semester').disabled = true;

    const regulation = document.getElementById('regulation').value;

    document.getElementById('department').innerHTML = '<option value="">Select Department</option>';
    document.getElementById('semester').innerHTML = '<option value="">Select Semester</option>';
    document.getElementById('gpa-table').style.display = 'none';
    document.getElementById('final-gpa').visibility = 'hidden';

    if (regulation) {
        data.departments = [];
        const departmentSelect = document.getElementById('department');

        sheetData.forEach(entry => {
            if (entry['regulation'] === regulation) {
                const department = entry['department'];
                if (department && !data.departments.includes(department)) {
                    data.departments.push(department);
                }
            }
        });
        data.departments = data.departments.filter(dept => dept && dept !== 'Department')
        data.departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentSelect.appendChild(option);
        });
    }
}

//================  Populate semesters dynamically ==================== 
function fetchSemesters() {
    document.getElementById('semester').disabled = false;

    const regulation = document.getElementById('regulation').value;
    const department = document.getElementById('department').value;

    document.getElementById('semester').innerHTML = '<option value="">Select Semester</option>';
    document.getElementById('gpa-table').style.display = 'none';
    document.getElementById('final-gpa').style.visibility = 'hidden';

    if (regulation && department) {
        const semesterSelect = document.getElementById('semester');
        const semestersSet = new Set();

        sheetData.forEach(entry => {
            if (entry['regulation'] === regulation && entry['department'] === department) {
                const semester = entry['semester'];
                if (semester) {
                    semestersSet.add(semester);
                }
            }
        });

        const sortedSemesters = Array.from(semestersSet).sort((a, b) => parseInt(a) - parseInt(b));
        sortedSemesters.forEach(sem => {
            const option = document.createElement('option');
            option.value = sem;
            option.textContent = `Semester ${sem}`;
            semesterSelect.appendChild(option);
        });
    }
}

//================  Show GPA input table for selected semester ==================== 
function fetchGPA() {
    const regulation = document.getElementById('regulation').value;
    const department = document.getElementById('department').value;
    const semester = document.getElementById('semester').value;

    document.getElementById('gpa-table').style.display = 'none';
    document.getElementById('final-gpa').style.visibility = 'hidden';

    if (regulation && department && semester) {
        loadSubjectsForSemester(regulation, department, semester);
        document.getElementById('gpa-table').style.display = 'block';
    }
}

//================  Load subject rows ====================
function loadSubjectsForSemester(regulation, department, semester) {
    const tableBody = document.getElementById('grades-table').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';

    sheetData.forEach(entry => {
        if (
            entry['regulation'] === regulation &&
            entry['department'] === department &&
            entry['semester'] === semester
        ) {
            const row = tableBody.insertRow();
            const subCodeCell = row.insertCell(0);
            const subjectCell = row.insertCell(1);
            const creditsCell = row.insertCell(2);
            const gradeCell = row.insertCell(3);

            subCodeCell.textContent = entry['code'];
            subjectCell.textContent = entry['subject'];
            creditsCell.textContent = entry['credits'];

            const gradeSelect = document.createElement('select');
            const grades = ["O", "A+", "A", "B+", "B", "C", "F"];
            grades.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = grade;
                gradeSelect.appendChild(option);
            });

            gradeCell.appendChild(gradeSelect);
        }
    });
}

// ================  Calculate final GPA ====================
function calculateFinalGPA() {
    const regulation = document.getElementById('regulation').value;
    const department = document.getElementById('department').value;
    const semester = document.getElementById('semester').value;

    if (!regulation || !department || !semester) {
        alert("Please select Regulation, Department, and Semester.");
        return;
    }

    const table = document.getElementById('grades-table').getElementsByTagName('tbody')[0];
    let totalCredits = 0;
    let weightedGradePoints = 0;

    for (let row of table.rows) {
        const credits = parseFloat(row.cells[2].textContent);
        const grade = row.cells[3].querySelector('select').value;
        const gradePoints = getGradePoints(grade);
        weightedGradePoints += credits * gradePoints;
        totalCredits += credits;
    }

    const finalGPA = weightedGradePoints / totalCredits;
    document.getElementById('final-gpa').style.visibility = 'visible';
    document.getElementById('final-gpa').children[0].textContent = finalGPA.toFixed(2);
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


//================  Populate regulation dropdown ====================
function populateTargetRegulationDropdown() {
    const select = document.getElementById('target-regulation');

    const uniqueRegs = [...new Set(sheetData.map(row => row['regulation']))];
    data.regulations = data.regulations.filter(reg => reg && reg !== 'Regulation');

    select.innerHTML = '<option value="">Select Regulation</option>';

    uniqueRegs.forEach(reg => {
        if (reg && reg !== 'Regulation') {
            const option = document.createElement('option');
            option.value = reg;
            option.textContent = reg;
            select.appendChild(option);
        }
    });
    
    document.getElementById('target-department').disabled = true;
    document.getElementById('target-semester').disabled = true;
}

// ================  Populate departments based on selected regulation ====================
function fetchTargetDepartments() {
    
    document.getElementById('target-department').disabled = false;
    document.getElementById('target-semester').disabled = true;

    const regulation = document.getElementById('target-regulation').value;
    const deptSelect = document.getElementById('target-department');

    deptSelect.innerHTML = '<option value="">Select Department</option>';
    document.getElementById('target-semester').innerHTML = '<option value="">Select Semester</option>';

    if (!regulation) return;

    const departments = [...new Set(sheetData
        .filter(row => row['regulation'] === regulation)
        .map(row => row['department']))];

    data.departments = data.departments.filter(dept => dept && dept !== 'Department');

    departments.forEach(dept => {
        if (dept && dept !== 'Department') {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        }
    });
}

//================  Populate semesters dynamically ==================== 
function fetchTargetSemesters() {
    document.getElementById('target-semester').disabled = false;

    const regulation = document.getElementById('target-regulation').value;
    const department = document.getElementById('target-department').value;
    const semSelect = document.getElementById('target-semester');

    semSelect.innerHTML = '<option value="">Select Semester</option>';

    if (!regulation || !department) return;

    const semesters = [...new Set(sheetData
        .filter(row => row['regulation'] === regulation && row['department'] === department)
        .map(row => row['semester']))].sort((a, b) => parseInt(a) - parseInt(b));

    semesters.forEach(sem => {
        const option = document.createElement('option');
        option.value = sem;
        option.textContent = `Semester ${sem}`;
        semSelect.appendChild(option);
    });
}

//================  Main Target GPA Logic  ================ 
function calculateTargetGPA() {
    const regulation = document.getElementById('target-regulation').value;
    const department = document.getElementById('target-department').value;
    const semester = parseInt(document.getElementById('target-semester').value);
    const currentCGPA = parseFloat(document.getElementById('currentCGPA').value);
    const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);

    if (!regulation || !department || isNaN(semester) || isNaN(currentCGPA) || isNaN(targetCGPA)) {
        alert("Please complete all fields.");
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
        alert("No remaining credits found for this selection.");
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


// ================  CGPA ====================
function populateRegulationDropdownCGPA() {
    document.getElementById('departmentCGPA').disabled = true;
    document.getElementById('completedSemester').disabled = true;

    const regulationSelect = document.getElementById('regulationCGPA');
    regulationSelect.innerHTML = '<option value="">Select Regulation</option>';
    data.regulations = [];

    sheetData.forEach(entry => {
        const regulation = entry['regulation'];
        if (regulation && !data.regulations.includes(regulation)) {
            data.regulations.push(regulation);
        }
    });
    data.regulations = data.regulations.filter(reg => reg && reg !== 'Regulation');
    data.regulations.forEach(regulation => {
        const option = document.createElement('option');
        option.value = regulation;
        option.textContent = regulation;
        regulationSelect.appendChild(option);
    });
}

// ================  Populate departments based on selected regulation ====================

function fetchDepartmentsCGPA() {
    document.getElementById('departmentCGPA').disabled = false;
    document.getElementById('completedSemester').disabled = true;

    const regulation = document.getElementById('regulationCGPA').value;
    document.getElementById('departmentCGPA').innerHTML = '<option value="">Select Department</option>';
    document.getElementById('completedSemester').innerHTML = '<option value="">Select Completed Semester</option>';
    document.getElementById('subjectsTableCGPA').style.display = 'none';

    if (regulation) {
        data.departments = [];
        const departmentSelect = document.getElementById('departmentCGPA');

        sheetData.forEach(entry => {
            if (entry['regulation'] === regulation) {
                const department = entry['department'];
                if (department && !data.departments.includes(department)) {
                    data.departments.push(department);
                }
            }
        });
        data.departments = data.departments.filter(dept => dept && dept !== 'Department');  // 'Department' is an example, adjust if needed

        data.departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentSelect.appendChild(option);
        });
    }
}

//================  Populate semesters dynamically ==================== 

function fetchCompletedSemesters() {

    const regulation = document.getElementById('regulationCGPA').value;
    const department = document.getElementById('departmentCGPA').value;

    document.getElementById('completedSemester').innerHTML = '<option value="">Select Completed Semester</option>';
    document.getElementById('subjectsTableCGPA').style.display = 'none';

    if (regulation && department) {
        const semesterSelect = document.getElementById('completedSemester');
        const semestersSet = new Set();

        sheetData.forEach(entry => {
            if (entry['regulation'] === regulation && entry['department'] === department) {
                const semester = entry['semester'];
                if (semester) {
                    semestersSet.add(semester);
                }
            }
        });

        const sortedSemesters = Array.from(semestersSet).sort((a, b) => parseInt(a) - parseInt(b));
        sortedSemesters.forEach(sem => {
            const option = document.createElement('option');
            option.value = sem;
            option.textContent = `Semester ${sem}`;
            semesterSelect.appendChild(option);
        });
    }
}


//================  Populate semesters dynamically ==================== 
function fetchCompletedSemesters() {
    document.getElementById('completedSemester').disabled = false;

    const regulation = document.getElementById('regulationCGPA').value;
    const department = document.getElementById('departmentCGPA').value;

    document.getElementById('completedSemester').innerHTML = '<option value="">Select Completed Semester</option>';
    document.getElementById('subjectsTableCGPA').style.display = 'none';

    if (regulation && department) {
        const semesterSelect = document.getElementById('completedSemester');
        const semestersSet = new Set();

        sheetData.forEach(entry => {
            if (entry['regulation'] === regulation && entry['department'] === department) {
                const semester = entry['semester'];
                if (semester) {
                    semestersSet.add(semester);
                }
            }
        });

        const sortedSemesters = Array.from(semestersSet).sort((a, b) => parseInt(a) - parseInt(b));
        sortedSemesters.forEach(sem => {
            const option = document.createElement('option');
            option.value = sem;
            option.textContent = `Semester ${sem}`;
            semesterSelect.appendChild(option);
        });
    }
}

//================  Populate subjects dynamically ==================== 

function fetchSubjectsForCompletedSemesters() {
    const regulation = document.getElementById('regulationCGPA').value;
    const department = document.getElementById('departmentCGPA').value;
    const completedSemester = document.getElementById('completedSemester').value;

    if (regulation && department && completedSemester) {
        const tableBody = document.getElementById('grades-tableCGPA').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';

        sheetData.forEach(entry => {
            if (
                entry['regulation'] === regulation &&
                entry['department'] === department &&
                parseInt(entry['semester']) <= parseInt(completedSemester)
            ) {
                const row = tableBody.insertRow();
                const subCodeCell = row.insertCell(0);
                const subjectCell = row.insertCell(1);
                const creditsCell = row.insertCell(2);
                const gradeCell = row.insertCell(3);

                subCodeCell.textContent = entry['code'];
                subjectCell.textContent = entry['subject'];
                creditsCell.textContent = entry['credits'];

                const gradeSelect = document.createElement('select');
                const grades = ["O", "A+", "A", "B+", "B", "C", "F"];
                grades.forEach(grade => {
                    const option = document.createElement('option');
                    option.value = grade;
                    option.textContent = grade;
                    gradeSelect.appendChild(option);
                });

                gradeCell.appendChild(gradeSelect);
            }
        });

        document.getElementById('subjectsTableCGPA').style.display = 'block';
    }
}

//================  CGPA Logic  ================

function calculateCGPA() {
    const regulation = document.getElementById('regulationCGPA').value;
    const department = document.getElementById('departmentCGPA').value;
    const completedSemester = document.getElementById('completedSemester').value;

    // Check if regulation, department, and completed semester are selected
    if (!regulation || !department || !completedSemester) {
        alert("Please select Regulation, Department, and Completed Semester.");
        return;
    }
    const table = document.getElementById('grades-tableCGPA').getElementsByTagName('tbody')[0];
    let totalCredits = 0;
    let totalGradePoints = 0;

    for (let row of table.rows) {
        const credits = parseFloat(row.cells[2].textContent);
        const grade = row.cells[3].querySelector('select').value;
        const gradePoints = getGradePoints(grade);
        totalGradePoints += credits * gradePoints;
        totalCredits += credits;
    }

    const cgpa = totalGradePoints / totalCredits;
    document.getElementById('cgpa-result').style.visibility = 'visible';
    document.getElementById('cgpa-result').children[0].textContent = cgpa.toFixed(2);
}




// Start the flow
fetchSheetData();
