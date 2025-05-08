
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
  scenarios: Array<{ description: string; scores: { [key: string]: string } }>;
} => {
  // Default attendance and problem set to full scores if missing
  const attendance = periodState.attendance || 10;
  const problemSet = periodState.problemSet || 10;
  
  // Initialize result object
  const result = {
    neededScores: {} as { [key: string]: string },
    isPossible: true,
    message: "",
    scenarios: [] as Array<{ description: string; scores: { [key: string]: string } }>
  };
  
  // Calculate how much this period needs to contribute to the final grade
  let requiredContribution: number;
  
  if (isFinals) {
    // For finals: target = midterm * 0.3 + finals * 0.7
    // So, finals = (target - midterm * 0.3) / 0.7
    requiredContribution = (targetGrade - (currentMidterm * 0.3)) / 0.7;
  } else {
    // For midterm: target = midterm * 0.3 + finals * 0.7 (assume finals = targetGrade for minimum required)
    // So, midterm = (target - targetGrade * 0.7) / 0.3
    requiredContribution = (targetGrade - (targetGrade * 0.7)) / 0.3;
  }
  
  // Check if it's mathematically possible
  if (requiredContribution > 100) {
    return {
      neededScores: {},
      isPossible: false,
      message: isFinals 
        ? "Even with perfect finals scores, you can't reach the target grade."
        : "Even with perfect midterm scores, you'd need excellent finals to reach the target.",
      scenarios: []
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
  
  // Find missing quiz scores
  const missingQuizIndices = periodState.quizScores.map((score, index) => 
    score === null ? index : -1).filter(index => index !== -1);
  
  // Check if exam score is missing
  const isExamMissing = periodState.examScore === null;
  
  // No missing fields, return early
  if (missingQuizIndices.length === 0 && !isExamMissing) {
    return {
      neededScores: {},
      isPossible: true,
      message: "All fields are filled.",
      scenarios: []
    };
  }

  // If we're already at or above the target, no additional scores are needed
  if (additionalNeeded <= 0) {
    const message = "You're already on track to reach the target grade!";
    return {
      neededScores: {},
      isPossible: true,
      message,
      scenarios: []
    };
  }
  
  // Calculate total weight of missing components
  const quizWeight = 0.35; // Total quiz weight
  const examWeight = 0.45; // Exam weight
  
  // Generate different scenarios based on missing components
  // First Scenario: Even distribution across all missing components
  if ((missingQuizIndices.length > 0 || isExamMissing)) {
    const scenario1Scores: { [key: string]: string } = {};
    let isPossible = true;
    
    // Calculate proportional weights for missing quizzes
    if (missingQuizIndices.length > 0) {
      const perQuizWeight = quizWeight / periodState.quizScores.length;
      const totalMissingQuizWeight = perQuizWeight * missingQuizIndices.length;
      
      // If there are missing quizzes, distribute evenly
      missingQuizIndices.forEach(index => {
        const maxScore = periodState.quizMaxScores[index] || 100;
        const quizProportion = additionalNeeded * (perQuizWeight / (totalMissingQuizWeight + (isExamMissing ? examWeight : 0)));
        
        // Calculate needed raw quiz score
        const quizAdjustedContribution = quizProportion / perQuizWeight;
        const rawPercentage = ((quizAdjustedContribution - 50) * 2);
        
        // Convert percentage to actual score
        let neededScore = Math.max(0, (rawPercentage / 100) * maxScore);
        neededScore = Math.min(maxScore, Math.ceil(neededScore));
        
        const quizNumber = isFinals ? index + 3 : index + 1;
        
        if (neededScore >= maxScore) {
          scenario1Scores[`Quiz ${quizNumber}`] = `Max score needed (${maxScore})`;
          isPossible = isPossible && (neededScore <= maxScore);
        } else {
          scenario1Scores[`Quiz ${quizNumber}`] = `${neededScore} out of ${maxScore}`;
        }
      });
    }
    
    // Handle missing exam
    if (isExamMissing) {
      const maxScore = periodState.examMaxScore || 100;
      const examProportion = additionalNeeded * (examWeight / (examWeight + (missingQuizIndices.length > 0 ? quizWeight * missingQuizIndices.length / periodState.quizScores.length : 0)));
      
      // Calculate needed raw exam score
      const examAdjustedContribution = examProportion / examWeight;
      const rawPercentage = ((examAdjustedContribution - 50) * 2);
      
      // Convert percentage to actual score
      let neededScore = Math.max(0, (rawPercentage / 100) * maxScore);
      neededScore = Math.min(maxScore, Math.ceil(neededScore));
      
      if (neededScore >= maxScore) {
        scenario1Scores["Major Exam"] = `Max score needed (${maxScore})`;
        isPossible = isPossible && (neededScore <= maxScore);
      } else {
        scenario1Scores["Major Exam"] = `${neededScore} out of ${maxScore}`;
      }
    }
    
    // Add this scenario to the result
    result.scenarios.push({
      description: "Even distribution across all missing components",
      scores: scenario1Scores
    });
    
    // Use this as the main needed scores
    result.neededScores = scenario1Scores;
    result.isPossible = isPossible;
  }
  
  // Second Scenario: Focus on Major Exam if missing
  if (isExamMissing) {
    const scenario2Scores: { [key: string]: string } = {};
    let isPossible = true;
    
    // Calculate minimum required scores for quizzes (if missing)
    if (missingQuizIndices.length > 0) {
      missingQuizIndices.forEach(index => {
        const maxScore = periodState.quizMaxScores[index] || 100;
        // Require moderate scores on quizzes (60%)
        const minQuizScore = Math.min(maxScore, Math.ceil(maxScore * 0.6));
        const quizNumber = isFinals ? index + 3 : index + 1;
        scenario2Scores[`Quiz ${quizNumber}`] = `${minQuizScore} out of ${maxScore}`;
      });
    }
    
    // Calculate how much the exam needs to contribute
    const maxScore = periodState.examMaxScore || 100;
    let examNeeded = additionalNeeded;
    
    // Adjust for the quiz contributions we've allocated
    if (missingQuizIndices.length > 0) {
      const quizPercentage = 0.6; // 60% on quizzes
      const perQuizWeight = quizWeight / periodState.quizScores.length;
      
      missingQuizIndices.forEach(index => {
        const maxScore = periodState.quizMaxScores[index] || 100;
        const quizScore = maxScore * quizPercentage;
        const quizRawPercentage = (quizScore / maxScore) * 100;
        const quizAdjustedContribution = ((quizRawPercentage * 0.5) + 50) * perQuizWeight;
        examNeeded -= quizAdjustedContribution;
      });
    }
    
    // Calculate exam score needed
    const examRawPercentage = (examNeeded / examWeight - 50) * 2;
    let neededExamScore = Math.max(0, (examRawPercentage / 100) * maxScore);
    neededExamScore = Math.min(maxScore, Math.ceil(neededExamScore));
    
    if (neededExamScore >= maxScore) {
      scenario2Scores["Major Exam"] = `Max score needed (${maxScore})`;
      isPossible = false;
    } else {
      scenario2Scores["Major Exam"] = `${neededExamScore} out of ${maxScore}`;
    }
    
    // Add this scenario to the result
    result.scenarios.push({
      description: "Focus on Major Exam",
      scores: scenario2Scores
    });
    
    // If first scenario isn't possible but this one is, use this one
    if (!result.isPossible && isPossible) {
      result.neededScores = scenario2Scores;
      result.isPossible = isPossible;
    }
  }
  
  // Third Scenario: Focus on Quizzes if missing
  if (missingQuizIndices.length > 0) {
    const scenario3Scores: { [key: string]: string } = {};
    let isPossible = true;
    
    // Calculate minimum required score for exam (if missing)
    // We need to create a local variable for our adjusted needed points
    let remainingNeeded = additionalNeeded;
    
    if (isExamMissing) {
      const maxScore = periodState.examMaxScore || 100;
      // Require moderate score on exam (70%)
      const minExamScore = Math.min(maxScore, Math.ceil(maxScore * 0.7));
      scenario3Scores["Major Exam"] = `${minExamScore} out of ${maxScore}`;
      
      // Adjust the local remainingNeeded variable for the exam contribution
      const examRawPercentage = (minExamScore / maxScore) * 100;
      const examAdjustedContribution = ((examRawPercentage * 0.5) + 50) * examWeight;
      remainingNeeded -= examAdjustedContribution;
    }
    
    // Calculate how much each quiz needs to contribute
    const perQuizWeight = quizWeight / periodState.quizScores.length;
    const perQuizNeeded = remainingNeeded / missingQuizIndices.length; 
    
    missingQuizIndices.forEach(index => {
      const maxScore = periodState.quizMaxScores[index] || 100;
      const quizRawPercentage = (perQuizNeeded / perQuizWeight - 50) * 2;
      let neededQuizScore = Math.max(0, (quizRawPercentage / 100) * maxScore);
      neededQuizScore = Math.min(maxScore, Math.ceil(neededQuizScore));
      
      const quizNumber = isFinals ? index + 3 : index + 1;
      
      if (neededQuizScore >= maxScore) {
        scenario3Scores[`Quiz ${quizNumber}`] = `Max score needed (${maxScore})`;
        isPossible = isPossible && (neededQuizScore <= maxScore);
      } else {
        scenario3Scores[`Quiz ${quizNumber}`] = `${neededQuizScore} out of ${maxScore}`;
      }
    });
    
    // Add this scenario to the result
    result.scenarios.push({
      description: "Focus on Quizzes",
      scores: scenario3Scores
    });
    
    // If previous scenarios aren't possible but this one is, use this one
    if (!result.isPossible && isPossible) {
      result.neededScores = scenario3Scores;
      result.isPossible = isPossible;
    }
  }
  
  // Set a message based on the possibility
  if (!result.isPossible) {
    result.message = "Some required scores may exceed maximum possible scores.";
  } else if (Object.keys(result.neededScores).length > 0) {
    result.message = "Here are the scores you need to reach the target grade.";
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
  scenarios: Array<{ description: string; scores: { [key: string]: string } }>;
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
        : `All fields are filled but you've only reached ${finalGrade.toFixed(2)}%.`,
      scenarios: []
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
    message: "No missing fields detected.",
    scenarios: []
  };
};
