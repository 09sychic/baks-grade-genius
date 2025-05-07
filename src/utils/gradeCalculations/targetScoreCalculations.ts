
import { calculateAdjustedQuiz, calculateAdjustedExam } from './basicCalculations';

// Helper type for period state
export type PeriodState = {
  quizScores: (number | null)[];
  quizMaxScores: (number | null)[];
  examScore: number | null;
  examMaxScore: number | null;
  attendance: number | null;
  problemSet: number | null;
};

// Helper function to calculate the needed scores for missing quiz and exam values
export const calculateNeededScores = (
  periodState: PeriodState,
  isFinals: boolean,
  currentMidterm: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message: string;
} => {
  // Default attendance and problem set to full scores if missing
  const attendance = periodState.attendance || 10;
  const problemSet = periodState.problemSet || 10;
  
  // Initialize result object with default message
  const result = {
    neededScores: {} as { [key: string]: string },
    isPossible: true,
    message: "Here are the scores you need to reach the target grade." // Default message
  };
  
  // Calculate how much this period needs to contribute to the final grade
  let requiredContribution: number;
  
  if (isFinals) {
    // For finals: target = midterm * 0.3 + finals * 0.7
    // So, finals = (target - midterm * 0.3) / 0.7
    requiredContribution = (targetGrade - (currentMidterm * 0.3)) / 0.7;
  } else {
    // For midterm: target = midterm * 0.3 + finals * 0.7 (assume finals = 100 for now)
    // So, midterm = (target - 70) / 0.3
    const assumedFinals = 100; // Optimistic assumption
    requiredContribution = (targetGrade - (assumedFinals * 0.7)) / 0.3;
  }
  
  // Check if it's mathematically possible
  if (requiredContribution > 100) {
    return {
      neededScores: {},
      isPossible: false,
      message: isFinals 
        ? "Even with perfect finals scores, you can't reach the target grade."
        : "Even with perfect midterm scores, you'd need excellent finals to reach the target."
    };
  }
  
  // Calculate what we already have from filled fields
  const quizWeight = 0.35; // Quiz weight in period grade (35%)
  const examWeight = 0.45; // Exam weight in period grade (45%)
  const attendanceWeight = 0.10; // Attendance weight (10%)
  const problemSetWeight = 0.10; // Problem set weight (10%)
  
  // Calculate attendance and problem set contributions
  const attendanceContribution = (attendance / 10 * 100) * attendanceWeight;
  const problemSetContribution = (problemSet / 10 * 100) * problemSetWeight;
  
  // Find missing quizzes
  const missingQuizIndices = periodState.quizScores.map((score, index) => 
    score === null ? index : -1).filter(index => index !== -1);
  
  // Calculate current quiz contribution from filled quizzes
  let currentQuizContribution = 0;
  if (missingQuizIndices.length < periodState.quizScores.length) {
    const filledQuizScores = periodState.quizScores
      .map((score, idx) => score !== null ? { score, maxScore: periodState.quizMaxScores[idx] || 100 } : null)
      .filter((item): item is { score: number; maxScore: number } => item !== null);
    
    if (filledQuizScores.length > 0) {
      const quizSum = filledQuizScores.reduce((sum, { score }) => sum + score, 0);
      const maxSum = filledQuizScores.reduce((sum, { maxScore }) => sum + maxScore, 0);
      const quizAverage = maxSum > 0 ? (quizSum / maxSum) * 100 : 0;
      const adjustedQuiz = (quizAverage * 0.5) + 50;
      currentQuizContribution = adjustedQuiz * quizWeight;
    }
  }
  
  // Calculate current exam contribution if available
  let currentExamContribution = 0;
  if (periodState.examScore !== null && periodState.examMaxScore !== null && periodState.examMaxScore > 0) {
    const examPercentage = (periodState.examScore / periodState.examMaxScore) * 100;
    const adjustedExam = (examPercentage * 0.5) + 50;
    currentExamContribution = adjustedExam * examWeight;
  }
  
  // Calculate total current contribution
  const totalCurrentContribution = currentQuizContribution + currentExamContribution + 
                                 attendanceContribution + problemSetContribution;
  
  // Calculate what additional contribution is needed to reach the target
  const additionalNeeded = Math.max(0, requiredContribution - totalCurrentContribution);
  
  // If everything is already filled, no additional score is needed
  if (missingQuizIndices.length === 0 && periodState.examScore !== null) {
    return {
      neededScores: {},
      isPossible: true,
      message: "All fields are filled for this period."
    };
  }
  
  // Calculate how to distribute the needed points
  let isAnythingPossible = false;
  
  // Determine total remaining weight
  let totalRemainingWeight = 0;
  if (missingQuizIndices.length > 0) {
    // Each quiz gets an equal portion of the quiz weight
    totalRemainingWeight += (missingQuizIndices.length / periodState.quizScores.length) * quizWeight;
  }
  if (periodState.examScore === null) {
    totalRemainingWeight += examWeight;
  }
  
  if (totalRemainingWeight === 0) {
    return {
      neededScores: {},
      isPossible: false,
      message: "No missing fields detected."
    };
  }
  
  // Calculate needed contribution for each quiz
  if (missingQuizIndices.length > 0) {
    const quizWeightPerMissing = quizWeight / periodState.quizScores.length;
    const neededQuizContributionPerMissing = (additionalNeeded / totalRemainingWeight) * quizWeightPerMissing;
    
    missingQuizIndices.forEach(index => {
      // To get from contribution to raw score, need to invert the formula:
      // contribution = ((score/maxScore * 100) * 0.5 + 50) * weight
      // We need to solve for score
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededPercentage = (neededQuizContributionPerMissing / quizWeightPerMissing - 50) * 2;
      const neededRawScore = (neededPercentage / 100) * maxScore;
      
      // Clamp the score to valid range
      const clampedScore = Math.min(maxScore, Math.max(0, neededRawScore));
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      if (clampedScore >= maxScore) {
        result.neededScores[`Quiz ${quizNumber}`] = 
          `Max score is ${Math.round(maxScore)}, may not be enough alone`;
        result.isPossible = false;
      } else if (clampedScore <= 0) {
        result.neededScores[`Quiz ${quizNumber}`] = "No additional points needed";
      } else {
        result.neededScores[`Quiz ${quizNumber}`] = 
          `Need ${Math.ceil(clampedScore)} out of ${Math.round(maxScore)}`;
        isAnythingPossible = true;
      }
    });
  }
  
  // Calculate needed exam score, if missing
  if (periodState.examScore === null) {
    const examMaxScore = periodState.examMaxScore || 100;
    const neededExamContribution = (additionalNeeded / totalRemainingWeight) * examWeight;
    
    // Invert the exam calculation formula:
    // contribution = ((score/maxScore * 100) * 0.5 + 50) * weight
    const neededPercentage = (neededExamContribution / examWeight - 50) * 2;
    const neededRawScore = (neededPercentage / 100) * examMaxScore;
    
    // Clamp the score to valid range
    const clampedScore = Math.min(examMaxScore, Math.max(0, neededRawScore));
    
    if (clampedScore >= examMaxScore) {
      result.neededScores["Major Exam"] = 
        `Max score is ${Math.round(examMaxScore)}, may not be enough alone`;
      result.isPossible = false;
    } else if (clampedScore <= 0) {
      result.neededScores["Major Exam"] = "No additional points needed";
    } else {
      result.neededScores["Major Exam"] = 
        `Need ${Math.ceil(clampedScore)} out of ${Math.round(examMaxScore)}`;
      isAnythingPossible = true;
    }
  }
  
  // Update final message based on what we found
  if (Object.keys(result.neededScores).length === 0) {
    result.message = "No missing fields detected.";
  } else if (!isAnythingPossible && !result.isPossible) {
    result.message = "It may not be possible to reach the target grade with the current scores.";
  }
  
  return result;
};

// Calculate scores needed to reach a 75 final grade
export const calculatePointsNeeded = (
  midtermState: PeriodState,
  finalsState: PeriodState,
  currentMidtermGrade: number,
  currentFinalsGrade: number,
  targetGrade: number = 75
): {
  neededScores: { [key: string]: string };
  isPossible: boolean;
  message: string;
} => {
  // Check if midterm is incomplete
  const isMidtermComplete = midtermState.quizScores.every(score => score !== null) && 
                           midtermState.examScore !== null;
                           
  // Check if finals is incomplete
  const isFinalsComplete = finalsState.quizScores.every(score => score !== null) && 
                          finalsState.examScore !== null;
  
  // If both periods are complete, return appropriate message
  if (isMidtermComplete && isFinalsComplete) {
    const finalGrade = currentMidtermGrade * 0.30 + currentFinalsGrade * 0.70;
    return {
      neededScores: {},
      isPossible: finalGrade >= targetGrade,
      message: finalGrade >= targetGrade 
        ? "All fields are filled and you've reached the target grade!"
        : `All fields are filled but you've only reached ${finalGrade.toFixed(2)}%.`
    };
  }
  
  // If midterm is incomplete, calculate needed scores for midterm
  if (!isMidtermComplete) {
    return calculateNeededScores(midtermState, false, currentFinalsGrade, targetGrade);
  }
  
  // If finals is incomplete, calculate needed scores for finals
  if (!isFinalsComplete) {
    return calculateNeededScores(finalsState, true, currentMidtermGrade, targetGrade);
  }
  
  // Default fallback (should never reach here)
  return {
    neededScores: {},
    isPossible: true,
    message: "No missing fields detected."
  };
};
