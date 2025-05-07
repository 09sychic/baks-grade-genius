
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
    message: "" // Set a default empty message
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
  const filledQuizScores = periodState.quizScores.filter((score): score is number => 
    score !== null && score !== undefined);
  const filledQuizMaxScores = periodState.quizMaxScores.filter((max): max is number => 
    max !== null && max !== undefined);
  
  // Current contribution from quizzes (if any are filled)
  let currentQuizContribution = 0;
  if (filledQuizScores.length > 0) {
    currentQuizContribution = calculateAdjustedQuiz(filledQuizScores, filledQuizMaxScores);
  }
  
  // Current contribution from exam (if filled)
  let currentExamContribution = 0;
  if (periodState.examScore !== null && periodState.examMaxScore !== null) {
    currentExamContribution = calculateAdjustedExam(periodState.examScore, periodState.examMaxScore);
  }
  
  // Current contribution from attendance and problem set
  const attendanceContribution = (attendance / 10 * 100) * 0.10;
  const problemSetContribution = (problemSet / 10 * 100) * 0.10;
  
  // Total current contribution
  const currentTotalContribution = currentQuizContribution + currentExamContribution + 
                                 attendanceContribution + problemSetContribution;
  
  // Calculate what more we need
  const additionalNeeded = Math.max(0, requiredContribution - currentTotalContribution);
  
  // Check missing quiz scores
  const missingQuizIndices = periodState.quizScores.map((score, index) => 
    score === null ? index : -1).filter(index => index !== -1);
  
  // Check if exam score is missing
  const isExamMissing = periodState.examScore === null;
  
  // Calculate needed scores based on what's missing
  if (missingQuizIndices.length > 0 && !isExamMissing) {
    // Only quizzes are missing
    const quizWeight = 0.35; // Quiz weight in period grade
    const neededQuizPercentage = (additionalNeeded / quizWeight);
    
    // This needs to be distributed across all missing quizzes
    const perQuizPercentage = neededQuizPercentage * 2; // Double it since formula is (score*0.5)+50
    
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededScore = (perQuizPercentage / 100) * maxScore;
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      result.neededScores[`Quiz ${quizNumber}`] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    });
    
    // Set a success message if scores are calculated
    if (Object.keys(result.neededScores).length > 0) {
      result.message = "Here are the scores you need to reach the target grade.";
    } else {
      result.message = "No missing quizzes detected.";
    }
  } 
  else if (isExamMissing && missingQuizIndices.length === 0) {
    // Only exam is missing
    const examWeight = 0.45; // Exam weight in period grade
    const neededExamPercentage = (additionalNeeded / examWeight);
    
    // Calculate actual score needed based on formula: ((score * 0.5) + 50)
    const rawExamPercentage = (neededExamPercentage - 50) * 2;
    const maxScore = periodState.examMaxScore || 100;
    const neededScore = (rawExamPercentage / 100) * maxScore;
    
    result.neededScores["Major Exam"] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    result.message = "Here's the exam score you need to reach the target grade.";
  }
  else if (missingQuizIndices.length > 0 && isExamMissing) {
    // Both quizzes and exam are missing - distribute proportionally
    // Assume equal distribution among missing components for simplicity
    const quizWeight = 0.35; // Quiz weight
    const examWeight = 0.45; // Exam weight
    const totalMissingWeight = quizWeight + examWeight;
    
    // Distribute proportionally
    const quizPortion = (quizWeight / totalMissingWeight) * additionalNeeded;
    const examPortion = (examWeight / totalMissingWeight) * additionalNeeded;
    
    // Calculate for quizzes
    const quizPercentageNeeded = (quizPortion / quizWeight);
    const perQuizPercentage = quizPercentageNeeded * 2; // Double it since formula is (score*0.5)+50
    
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const neededScore = (perQuizPercentage / 100) * maxScore;
      const quizNumber = isFinals ? index + 3 : index + 1; // Quiz 3/4 for finals, 1/2 for midterm
      
      result.neededScores[`Quiz ${quizNumber}`] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    });
    
    // Calculate for exam
    const examPercentageNeeded = (examPortion / examWeight);
    const rawExamPercentage = (examPercentageNeeded - 50) * 2;
    const maxScore = periodState.examMaxScore || 100;
    const neededScore = (rawExamPercentage / 100) * maxScore;
    
    result.neededScores["Major Exam"] = `Need ${Math.ceil(neededScore)} out of ${maxScore}`;
    result.message = "Here are the scores you need for both quizzes and exam to reach the target grade.";
  } else {
    // No missing components detected
    result.message = "No missing components detected.";
  }
  
  // Check if any needed scores exceed max scores
  let allPossible = true;
  for (const [key, value] of Object.entries(result.neededScores)) {
    const [needed, max] = value.split(' out of ').map(v => parseInt(v.match(/\d+/)?.[0] || "0"));
    if (needed > max) {
      allPossible = false;
      result.message = "Some required scores exceed maximum possible scores.";
      break;
    }
  }
  
  result.isPossible = allPossible;
  if (!allPossible && result.message === "") {
    result.message = "Some required scores exceed maximum possible scores.";
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
