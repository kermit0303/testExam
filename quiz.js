let randomQuestions = [];
let currentQuestionIndex = 0; // 当前题目的索引
let timer; // 倒计时定时器
const totalTime = 60; // 设置总时间为60秒
let timeLeft = totalTime; // 剩余时间

// 隨機選擇 8 道題目
function getRandomQuestions() {
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 8);
}

// 顯示题目
function displayQuestion() {
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = ""; // 清空当前内容

    const q = randomQuestions[currentQuestionIndex]; // 获取当前问题
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

    // 更新按钮显示
    document.getElementById("prev-btn").style.display = currentQuestionIndex === 0 ? "none" : "inline";
    document.getElementById("next-btn").style.display = currentQuestionIndex === randomQuestions.length - 1 ? "none" : "inline";
}

// 倒计时功能
function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById("time").innerText = formatTime(timeLeft); // 显示格式化时间

        if (timeLeft <= 0) {
            clearInterval(timer);
            showresult(); // 超时直接显示结果
        }
    }, 1000);
}

// 格式化时间为“分钟:秒”
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
}

// 提交答案
function submitAnswer() {
    clearInterval(timer); // 停止倒计时
    showresult(); // 提交答案并显示结果
}

// 重新开始测验
function restartQuiz() {
    currentQuestionIndex = 0; // 重置当前题目索引
    timeLeft = totalTime; // 重置剩余时间
    randomQuestions = getRandomQuestions(); // 重新选择题目
    displayQuestion(); // 显示第一题
    startTimer(); // 开始倒计时
    document.getElementById("result").innerHTML = ""; // 清空结果显示
    document.getElementById("time").innerText = formatTime(timeLeft); // 更新显示时间
}

// 初始化显示题目
randomQuestions = getRandomQuestions();
displayQuestion();
startTimer(); // 开始倒计时

// 处理“下一题”和“上一题”按钮的点击事件
document.getElementById("next-btn").addEventListener("click", () => {
    if (currentQuestionIndex < randomQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        showresult(); // 最后一题时直接显示结果
    }
});

document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
});

// 提交按钮事件处理
document.getElementById("submit-btn").addEventListener("click", () => {
    submitAnswer(); // 提交答案并显示结果
});

// 重新开始按钮事件处理
document.getElementById("restart-btn").addEventListener("click", () => {
    restartQuiz(); // 重新开始测验
});

// 作答总览按钮事件处理
document.getElementById("overview-btn").addEventListener("click", () => {
    showOverview(); // 显示作答总览
});

// 显示结果函数
function showresult() {
    const quizContainer = document.getElementById("quiz-container");
    quizContainer.innerHTML = ""; // 清空当前内容

    const resultElement = document.getElementById("result");
    let score = 0;
    let resultDetails = "";

    const selectedAnswers = Array.from(document.querySelectorAll("input[type='radio']:checked"));
    
    // 检查每一题的答案
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

// 显示作答总览
function showOverview() {
    const overviewContainer = document.getElementById("quiz-container");
    overviewContainer.innerHTML = ""; // 清空当前内容

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

// 跳转到特定题目
function goToQuestion(index) {
    currentQuestionIndex = index; // 更新当前题目索引
    displayQuestion(); // 显示指定的题目
}