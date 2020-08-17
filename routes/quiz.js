const express = require('express');
const router = express.Router();
const { resolveNaptr } = require('dns');
const { QuizSession } = require('../modules/QuizSession.js');
const { preferenceQuestions, scenarioQuestions, trivaQuestions } = require('../data/quizQuestions.js');


/* The career map is updated at the end of every quiz session by popping all of the elements in the answerStack */
// input = career map and questions array

function updateCareerMap(activeQuizSession){

  let careerMap = activeQuizSession.getCareerMap();

  while(!activeQuizSession.emptyAnswerStack()) {

    // we get choice object that correspond to the user's answer
    let userChoice = activeQuizSession.getLastUserAnswer();

    // for every career track in the choice object use abbreviation (key) to update score in career map
    Object.keys(userChoice).forEach(function(key,index) {
      careerMap.get(key).score = careerMap.get(key).score + userChoice[key];
    });
  }

  activeQuizSession.setCareerRankingMap(careerMap);
};


/* IMPORTANT: DO NOT TOUCH. These are critical runtime data structure */

// This is the runtime data structure used to store the quiz progress of all users.
let quizSessions = new Map();






// Helper function for debugging
const logReqBody = (req) => {

  const quizSessionId = req.body.quizSessionId

  console.log("The title of the question was: " + req.body.checked);
  console.log("The answer of the user was: " + req.body.userChoice);
  console.log("The id of the quiz session is: " + quizSessionId);
  console.log("The id of the last question is: " + parseInt(req.body.questionId));
  console.log(`Checking that quizSessionID is in map... ${quizSessions.has(quizSessionId)}`);
  console.log("The current section of this quiz is: " + req.body.section);
  console.log("...");

}



/* The client with first access the get method. The post method will be used
for subsequent interactions with the client. The post method checks the question
title/name and the answer the uer provided. This can be used to update the
career track rankings and to dynamically pass a question object to the client
currently, only two question objects are defined, but we can add more very
easily. */
router.get("/quiz", (req, res) => {

  const NewQuizSession = new QuizSession();

  quizSessions.set(NewQuizSession.getQuizSessionId(), NewQuizSession);

  console.log(quizSessions);

  NewQuizSession.setCurrentQuestion(preferenceQuestions[0]);

  res.render('quiz', { title: 'career quiz', quizSession: NewQuizSession});
});







router.post("/quiz", (req, res) => {

  // First extract all relevant info from the request body
  const userAnswer = req.body.userChoice;
  const questionTitle = req.body.questionTitle;
  const quizSessionId = req.body.quizSessionId;
  const previousQuestionId = parseInt(req.body.questionId);
  const section = req.body.section;

  // Log post request
  logReqBody(req);

  // First check to see if the quizSessionId corresponds to an active quiz
  // session. If no, respond to the post request with an error page.
  if ( ! quizSessions.has(quizSessionId) ) {
    res.render(error.ejs);
  }

  // Assuming the the quizSessionId corresponds to an active quiz session,
  // we can not process the post reqeust

  // Get the quizSession correspoinding to the quizSessionId
  let ActiveQuizSession = quizSessions.get(quizSessionId);

  // The quiz is logical segemented into three sections: preferences,
  // scenarios, and cultural
  if (section === "preferences") {

    const currentQuestionId = previousQuestionId + 1;

    if (currentQuestionId === preferenceQuestions.length) {
      console.log("end of preference questions")
      res.render('interlude_2', {quizSession: ActiveQuizSession});
    }
    else if(currentQuestionId == preferenceQuestions.length + scenarioQuestions.length) {
      console.log('end of questions');
      res.render('results')
    } else {

      const currentQuestion = preferenceQuestions[currentQuestionId];
      ActiveQuizSession.setCurrentQuestion(currentQuestion);
      res.render('quiz', { title: 'career quiz', quizSession: ActiveQuizSession});
    }

  }


  if (section === "scenarios") {

    let currentQuestionId;

    if ( previousQuestionId === -1 ) {
      currentQuestionId = 0;
      const currentQuestion = scenarioQuestions[currentQuestionId];
      ActiveQuizSession.setCurrentQuestion(currentQuestion);
      res.render('quiz', { title: 'career quiz', quizSession: ActiveQuizSession});

    } else {

      const currentQuestionId = previousQuestionId + 1;

      if (currentQuestionId === scenarioQuestions.length) {
        console.log("end of scenarios questions")
        res.send("finished scenarioQuestions");
      } else {

        const currentQuestion = scenarioQuestions[currentQuestionId];
        ActiveQuizSession.setCurrentQuestion(currentQuestion);
        res.render('quiz', { title: 'career quiz', quizSession: ActiveQuizSession});
      }

    }

  }




});

module.exports = router;
