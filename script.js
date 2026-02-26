// ============================
// DOM ELEMENTS
// ============================

const welcomeUser = document.getElementById("welcomeUser");
const userRole = document.getElementById("userRole");
const studentDashboard = document.getElementById("studentDashboard");
const studentManagementSection = document.getElementById("studentManagementSection");
const myNameDisplay = document.getElementById("myNameDisplay");
const studentDesignBox = document.getElementById("studentDesignBox");
const studentList = document.getElementById("studentList");
const attendanceChart = document.getElementById("attendanceChart");
const dashboardStatsBox = document.getElementById("dashboardStats"); // FIXED NAME
const commentInput = document.getElementById("commentInput");
const commentList = document.getElementById("commentList");
const commentPage = document.getElementById("commentPage"); // FIXED
const loginMessage = document.getElementById("loginMessage");
const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regRole = document.getElementById("regRole");
const registerMessage = document.getElementById("registerMessage");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const searchInput = document.getElementById("searchInput");
const studentName = document.getElementById("studentName");
const studentGrade = document.getElementById("studentGrade");
const studentSection = document.getElementById("studentSection");

// ============================
// STORAGE INIT
// ============================

if (!localStorage.getItem("students"))
    localStorage.setItem("students", JSON.stringify([]));

if (!localStorage.getItem("attendance"))
    localStorage.setItem("attendance", JSON.stringify([]));

if (!localStorage.getItem("users"))
    localStorage.setItem("users", JSON.stringify([
        {username:"admin", password:"admin123", role:"admin"}
    ]));

if (!localStorage.getItem("comments"))
    localStorage.setItem("comments", JSON.stringify([]));

// ============================
// AUTO LOGIN
// ============================

window.onload = function(){
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if(user){
        showDashboard(user);
    }
};

// ============================
// LOGIN / REGISTER
// ============================

function login(){
    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value.trim();
    const users = JSON.parse(localStorage.getItem("users"));

    const user = users.find(u =>
        u.username === usernameVal &&
        u.password === passwordVal
    );

    if(!user){
        loginMessage.innerText = "Invalid credentials!";
        return;
    }

    localStorage.setItem("currentUser", JSON.stringify(user));
    showDashboard(user);
}

function logout(){
    localStorage.removeItem("currentUser");
    location.reload();
}

function showRegister(){
    document.getElementById("loginSection").style.display="none";
    document.getElementById("registerSection").style.display="block";
}

function showLogin(){
    document.getElementById("registerSection").style.display="none";
    document.getElementById("loginSection").style.display="block";
}

function register(){
    const usernameVal = regUsername.value.trim();
    const passwordVal = regPassword.value.trim();
    const roleVal = regRole.value;

    let users = JSON.parse(localStorage.getItem("users"));

    if(users.find(u=>u.username===usernameVal)){
        registerMessage.innerText="Username exists!";
        return;
    }

    users.push({
        username:usernameVal,
        password:passwordVal,
        role:roleVal
    });

    localStorage.setItem("users", JSON.stringify(users));
    registerMessage.innerText="Account created!";
}

// ============================
// DASHBOARD
// ============================

function showDashboard(user){
    document.getElementById("loginSection").style.display="none";
    document.getElementById("registerSection").style.display="none";
    document.getElementById("dashboard").style.display="block";

    applyRolePermissions(user.role);

    if(user.role!=="student"){
        displayStudents();
    }

    loadChart();
    updateDashboardStats(); // FIXED
}

function applyRolePermissions(role){

    const currentUser = JSON.parse(localStorage.getItem("currentUser"));

    welcomeUser.innerText = "Welcome: " + currentUser.username;
    userRole.innerText = "Role: " + role;

    if(role==="student"){
        studentDashboard.style.display="block";
        studentManagementSection.style.display="none";
        showStudentDashboard();
    } else {
        studentDashboard.style.display="none";
        studentManagementSection.style.display="block";
    }
}

// ============================
// STUDENT DASHBOARD
// ============================

function showStudentDashboard(){
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const students = JSON.parse(localStorage.getItem("students"));

    const studentRecord = students.find(s=>s.name===user.username);

    if(studentRecord){
        myNameDisplay.innerText = "Name: " + studentRecord.name;
    }

    const saved = localStorage.getItem("design_"+user.username);
    if(saved){
        studentDesignBox.value = saved;
    }
}

function saveStudentDesign(){
    const user = JSON.parse(localStorage.getItem("currentUser"));
    localStorage.setItem("design_"+user.username, studentDesignBox.value);
    alert("Design saved!");
}

function markSelf(status){
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const students = JSON.parse(localStorage.getItem("students"));
    const attendance = JSON.parse(localStorage.getItem("attendance"));

    const studentRecord = students.find(s=>s.name===user.username);

    if(!studentRecord){
        alert("Not registered as student.");
        return;
    }

    const today = new Date().toLocaleDateString();
    const existing = attendance.find(a=>a.studentId===studentRecord.id && a.date===today);

    if(existing){
        existing.status = status; // FIXED: allow update
    } else {
        attendance.push({
            studentId: studentRecord.id,
            status: status,
            date: today
        });
    }

    localStorage.setItem("attendance", JSON.stringify(attendance));
    loadChart();
    updateDashboardStats();
}

// ============================
// STUDENT MANAGEMENT
// ============================

function addStudent(){

    if(!studentName.value || !studentGrade.value || !studentSection.value){
        alert("Fill all fields");
        return;
    }

    const students = JSON.parse(localStorage.getItem("students"));

    students.push({
        id:Date.now(),
        name:studentName.value,
        grade:studentGrade.value,
        section:studentSection.value
    });

    localStorage.setItem("students", JSON.stringify(students));
    displayStudents();
}

function displayStudents(){
    renderStudentList(JSON.parse(localStorage.getItem("students")));
}

function renderStudentList(students){

    const user = JSON.parse(localStorage.getItem("currentUser"));
    studentList.innerHTML="";

    students.forEach(student=>{
        const li=document.createElement("li");

        li.innerHTML=`
        <div>${student.name} - ${student.grade} - ${student.section}</div>
        <div class="button-group">
            <button onclick="markAttendance(${student.id},'Present')">Present</button>
            <button onclick="markAttendance(${student.id},'Absent')">Absent</button>
            <button onclick="markAttendance(${student.id},'Late')">Late</button>
            ${(user.role!=="student") ?
                `<button onclick="editStudent(${student.id})">Edit</button>
                 <button onclick="deleteStudent(${student.id})">Delete</button>`
            : ""}
        </div>`;

        studentList.appendChild(li);
    });
}

// ============================
// SEARCH / SORT
// ============================

function searchStudent(){
    const students = JSON.parse(localStorage.getItem("students"));
    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(searchInput.value.toLowerCase())
    );
    renderStudentList(filtered);
}

function sortByName(){
    const students=JSON.parse(localStorage.getItem("students"));
    students.sort((a,b)=>a.name.localeCompare(b.name));
    renderStudentList(students);
}

function sortById(){
    const students=JSON.parse(localStorage.getItem("students"));
    students.sort((a,b)=>a.id-b.id);
    renderStudentList(students);
}

function editStudent(id){
    const students=JSON.parse(localStorage.getItem("students"));
    const s=students.find(x=>x.id===id);

    s.name=prompt("Name:",s.name)||s.name;
    s.grade=prompt("Grade:",s.grade)||s.grade;
    s.section=prompt("Section:",s.section)||s.section;

    localStorage.setItem("students",JSON.stringify(students));
    displayStudents();
}

function deleteStudent(id){
    if(!confirm("Delete student?")) return;

    let students=JSON.parse(localStorage.getItem("students"));
    students=students.filter(s=>s.id!==id);

    localStorage.setItem("students",JSON.stringify(students));
    displayStudents();
}

// ============================
// ATTENDANCE
// ============================

function markAttendance(id,status){

    const attendance=JSON.parse(localStorage.getItem("attendance"));
    const date=new Date().toLocaleDateString();

    const existing=attendance.find(a=>a.studentId===id && a.date===date);

    if(existing){
        existing.status=status;
    } else {
        attendance.push({studentId:id,status,date});
    }

    localStorage.setItem("attendance",JSON.stringify(attendance));
    loadChart();
    updateDashboardStats();
}

function loadChart(){

    const attendance=JSON.parse(localStorage.getItem("attendance"));
    const today=new Date().toLocaleDateString();
    const todayRecords=attendance.filter(a=>a.date===today);

    const present=todayRecords.filter(a=>a.status==="Present").length;
    const absent=todayRecords.filter(a=>a.status==="Absent").length;
    const late=todayRecords.filter(a=>a.status==="Late").length;

    if(window.chart) window.chart.destroy();

    window.chart=new Chart(attendanceChart,{
        type:"pie",
        data:{
            labels:["Present","Absent","Late"],
            datasets:[{
                data:[present,absent,late],
                backgroundColor:["green","red","orange"]
            }]
        }
    });
}

function updateDashboardStats(){   // RENAMED FUNCTION

    const attendance=JSON.parse(localStorage.getItem("attendance"));
    const today=new Date().toLocaleDateString();
    const todayRecords=attendance.filter(a=>a.date===today);

    dashboardStatsBox.innerText =
        `Present: ${todayRecords.filter(a=>a.status==="Present").length} |
         Absent: ${todayRecords.filter(a=>a.status==="Absent").length} |
         Late: ${todayRecords.filter(a=>a.status==="Late").length}`;
}

// ============================
// COMMENTS
// ============================

function goToComments(){
    document.getElementById("dashboard").style.display="none";
    commentPage.style.display="block";
    loadComments();
}

function backToDashboard(){
    commentPage.style.display="none";
    document.getElementById("dashboard").style.display="block";
}

function postComment(){

    const user=JSON.parse(localStorage.getItem("currentUser"));

    if(!commentInput.value.trim()) return;

    const comments=JSON.parse(localStorage.getItem("comments"));

    comments.push({
        user:user.username,
        text:commentInput.value,
        date:new Date().toLocaleString()
    });

    localStorage.setItem("comments",JSON.stringify(comments));

    commentInput.value="";
    loadComments();
}

function loadComments(){

    const comments=JSON.parse(localStorage.getItem("comments"));
    commentList.innerHTML="";

    comments.forEach(c=>{
        const li=document.createElement("li");
        li.innerHTML=
        `<strong>${c.user}</strong> (${c.date})<br>
         ${c.text}<hr>`;
        commentList.appendChild(li);
    });
}