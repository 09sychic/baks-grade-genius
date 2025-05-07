
// Calculate adjusted quiz score
export const calculateAdjustedQuiz = (scores: number[], maxScores: number[]): number => {
  // If any score or max is missing or zero, return 0
  if (!scores.length || scores.some(score => score === null || score === undefined) || 
      !maxScores.length || maxScores.some(max => max === 0)) {
    return 0;
  }

  // Calculate percentage for each quiz (out of 100)
  const percentages = scores.map((score, index) => (score / maxScores[index]) * 100);
  
  // Calculate average percentage
  const average = percentages.reduce((sum, percent) => sum + percent, 0) / percentages.length;
  
  // Apply formula: ((score * 0.5) + 50) * 0.35
  return ((average * 0.5) + 50) * 0.35;
};

// Calculate adjusted exam score
export const calculateAdjustedExam = (score: number, maxScore: number): number => {
  if (score === null || score === undefined || maxScore === 0) {
    return 0;
  }
  
  // Convert to percentage (out of 100)
  const percentage = (score / maxScore) * 100;
  
  // Apply formula: ((score * 0.5) + 50) * 0.45
  return ((percentage * 0.5) + 50) * 0.45;
};

// Calculate the period grade (midterm or finals)
export const calculatePeriodGrade = (
  quizScores: number[], 
  quizMaxScores: number[], 
  examScore: number,
  examMaxScore: number,
  attendance: number,
  problemSet: number
): number => {
  const adjustedQuiz = calculateAdjustedQuiz(quizScores, quizMaxScores);
  const adjustedExam = calculateAdjustedExam(examScore, examMaxScore);
  
  // Convert attendance and problem set to percentage (out of 100) before adding
  const attendancePercentage = attendance / 10 * 100;
  const problemSetPercentage = problemSet / 10 * 100;
  
  return adjustedQuiz + adjustedExam + (attendancePercentage * 0.10) + (problemSetPercentage * 0.10);
};

// Calculate final grade
export const calculateFinalGrade = (midterm: number, finals: number): number => {
  return midterm * 0.30 + finals * 0.70;
};

// Natural rounding function (rounds to nearest whole number, .5 rounds up)
export const naturalRound = (num: number): number => {
  return Math.round(num);
};
