let randomQuestions = [];
let currentQuestionIndex = 0; 
let timer; 
const totalTime = 60*100; 
let timeLeft = totalTime; 

// 隨機選擇 80 道題目
function getRandomQuestions() {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 80);
}

// 顯示題目
function displayQuestion() {
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = ""; 

    const q = randomQuestions[currentQuestionIndex]; 
    const questionElement = document.createElement("div");
    questionElement.classList.add("question");
    questionElement.innerHTML = `<strong>${currentQuestionIndex + 1}. ${q.question}</strong>`;

    const optionsList = document.createElement("ul");
    optionsList.classList.add("options");

    q.options.forEach(option => {
        const listItem = document.createElement("li");
        listItem.innerHTML = `<input type="radio" name="question${currentQuestionIndex}" value="${option}"> ${option}`;
        optionsList.appendChild(listItem);
    });

    questionElement.appendChild(optionsList);
    quizContainer.appendChild(questionElement);

    
    document.getElementById("prev-btn").style.display = currentQuestionIndex === 0 ? "none" : "inline";
    document.getElementById("next-btn").style.display = currentQuestionIndex === randomQuestions.length - 1 ? "none" : "inline";
}


function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("time").innerText = formatTime(timeLeft); 

        if (timeLeft <= 0) {
            clearInterval(timer);
            showresult(); 
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
}

// 提交答案
function submitAnswer() {
    clearInterval(timer); 
    showresult(); 
}


function restartQuiz() {
    currentQuestionIndex = 0; 
    timeLeft = totalTime; 
    randomQuestions = getRandomQuestions(); 
    displayQuestion(); 
    startTimer(); 
    document.getElementById("result").innerHTML = ""; 
    document.getElementById("time").innerText = formatTime(timeLeft); 
}


randomQuestions = getRandomQuestions();
displayQuestion();
startTimer(); 


document.getElementById("next-btn").addEventListener("click", () => {
    if (currentQuestionIndex < randomQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showresult(); 
    }
});

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
});

document.getElementById("submit-btn").addEventListener("click", () => {
    submitAnswer(); 
});

document.getElementById("restart-btn").addEventListener("click", () => {
    restartQuiz(); 
});

document.getElementById("overview-btn").addEventListener("click", () => {
    showOverview(); 
});

function showresult() {
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = ""; 

    const resultElement = document.getElementById("result");
    let score = 0;
    let resultDetails = "";

    const selectedAnswers = Array.from(document.querySelectorAll("input[type='radio']:checked"));
    
    randomQuestions.forEach((question, index) => {
        const selectedAnswer = selectedAnswers.find(answer => answer.name === `question${index}`);
        const userAnswer = selectedAnswer ? selectedAnswer.value : "未作答";

        if (userAnswer === question.answer) {
            score++;
            resultDetails += `<p>${index + 1}. ${question.question} - <span style="color:green;">正確!</span> (你的答案: ${userAnswer})</p>`;
        } else {
            resultDetails += `<p>${index + 1}. ${question.question} - <span style="color:red;">錯誤!</span> (正確答案: ${question.answer}, 你的答案: ${userAnswer})</p>`;
        }
    });

    resultElement.innerHTML = `您的得分是: ${score} / 8<br><br>${resultDetails}`;
}

function showOverview() {
    const overviewContainer = document.getElementById("quiz-container");
    overviewContainer.innerHTML = ""; 

    const overviewElement = document.createElement("div");
    overviewElement.innerHTML = "<h3>作答总览</h3>";
    
    randomQuestions.forEach((question, index) => {
        const selectedAnswer = document.querySelector(`input[name="question${index}"]:checked`);
        const userAnswer = selectedAnswer ? selectedAnswer.value : "未作答";
        
        const questionOverview = document.createElement("div");
        questionOverview.innerHTML = `<strong>${index + 1}. ${question.question}</strong> - 你的答案: ${userAnswer} 
        <button onclick="goToQuestion(${index})">前往此题</button>`;
        overviewElement.appendChild(questionOverview);
    });

    overviewContainer.appendChild(overviewElement);
}

function goToQuestion(index) {
    currentQuestionIndex = index; 
    displayQuestion(); 
}