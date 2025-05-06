import React, { useState, useEffect } from "react";
import GradingPeriod from "./GradingPeriod";
import { Calculator, Copy, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { 
  calculatePeriodGrade, 
  calculateFinalGrade, 
  calculateGPE,
  getGradeColor,
  formatFinalGrade,
  calculatePointsNeeded,
  naturalRound
} from "@/utils/calculationUtils";
import { copyGradesToClipboard, exportGradesAsImage } from "@/utils/exportUtils";

const GradeCalculator: React.FC = () => {
  // Midterm state
  const [midtermState, setMidtermState] = useState({
    quizScores: [null, null] as [number | null, number | null],
    quizMaxScores: [100, 100] as [number | null, number | null],
    examScore: null as number | null,
    examMaxScore: 100 as number | null,
    attendance: 10 as number | null,
    problemSet: 10 as number | null,
  });

  // Finals state
  const [finalsState, setFinalsState] = useState({
    quizScores: [null, null] as [number | null, number | null],
    quizMaxScores: [100, 100] as [number | null, number | null],
    examScore: null as number | null,
    examMaxScore: 100 as number | null,
    attendance: 10 as number | null,
    problemSet: 10 as number | null,
  });

  // Validation state
  const [errors, setErrors] = useState<{
    midterm: { [key: string]: string | null },
    finals: { [key: string]: string | null }
  }>({
    midterm: {},
    finals: {}
  });

  // Calculated grades
  const [grades, setGrades] = useState({
    midterm: 0,
    finals: 0,
    finalGrade: 0,
    gpe: "N/A",
  });

  // Points needed to reach 75
  const [pointsNeeded, setPointsNeeded] = useState({
    midtermNeeded: null as number | null,
    finalsNeeded: null as number | null,
    isPossible: true,
  });

  // Action states
  const [copying, setCopying] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Check if there are any validation errors
  const hasErrors = () => {
    return Object.values(errors.midterm).some(error => error !== null) || 
           Object.values(errors.finals).some(error => error !== null);
  };

  // Validate inputs
  const validateInput = (value: number | null, field: string, max: number = 100): string | null => {
    if (value === null) return null;
    if (isNaN(Number(value))) return "Must be a number";
    if (value < 0) return "Cannot be negative";
    if (field.includes("attendance") || field.includes("problemSet")) {
      if (value > 10) return "Maximum is 10";
    } else if (value > max) {
      return `Maximum is ${max}`;
    }
    return null;
  };

  // Handle changes to midterm inputs with validation
  const handleMidtermChange = (field: string, value: number | null, index?: number) => {
    // Validate the input
    let error: string | null = null;
    let maxValue = 100;
    
    if (field === "quizScores" && index !== undefined) {
      maxValue = midtermState.quizMaxScores[index] || 100;
    } else if (field === "examScore") {
      maxValue = midtermState.examMaxScore || 100;
    }
    
    error = validateInput(value, field, maxValue);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      midterm: {
        ...prev.midterm,
        [index !== undefined ? `${field}${index}` : field]: error
      }
    }));
    
    // If there's no error, update the state
    setMidtermState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle changes to finals inputs with validation
  const handleFinalsChange = (field: string, value: number | null, index?: number) => {
    // Validate the input
    let error: string | null = null;
    let maxValue = 100;
    
    if (field === "quizScores" && index !== undefined) {
      maxValue = finalsState.quizMaxScores[index] || 100;
    } else if (field === "examScore") {
      maxValue = finalsState.examMaxScore || 100;
    }
    
    error = validateInput(value, field, maxValue);
    
    // Update errors state
    setErrors(prev => ({
      ...prev,
      finals: {
        ...prev.finals,
        [index !== undefined ? `${field}${index}` : field]: error
      }
    }));
    
    // If there's no error, update the state
    setFinalsState((prev) => {
      if (index !== undefined && (field === "quizScores" || field === "quizMaxScores")) {
        const newArray = [...prev[field]];
        newArray[index] = value;
        return { ...prev, [field]: newArray };
      }
      return { ...prev, [field]: value };
    });
  };

  // Calculate grades whenever inputs change
  useEffect(() => {
    // If there are validation errors, don't calculate
    if (hasErrors()) {
      return;
    }

    // Calculate midterm grade
    const midtermGrade = calculatePeriodGrade(
      midtermState.quizScores.filter((score): score is number => score !== null),
      midtermState.quizMaxScores.filter((max): max is number => max !== null),
      midtermState.examScore || 0,
      midtermState.examMaxScore || 100,
      midtermState.attendance || 10,
      midtermState.problemSet || 10
    );

    // Calculate finals grade
    const finalsGrade = calculatePeriodGrade(
      finalsState.quizScores.filter((score): score is number => score !== null),
      finalsState.quizMaxScores.filter((max): max is number => max !== null),
      finalsState.examScore || 0,
      finalsState.examMaxScore || 100,
      finalsState.attendance || 10,
      finalsState.problemSet || 10
    );

    // Calculate final grade and GPE
    const finalGrade = calculateFinalGrade(midtermGrade, finalsGrade);
    const gpe = calculateGPE(finalGrade);

    setGrades({
      midterm: midtermGrade,
      finals: finalsGrade,
      finalGrade: finalGrade,
      gpe: gpe,
    });

    // Calculate points needed to reach 75
    const needed = calculatePointsNeeded(midtermGrade, finalsGrade);
    setPointsNeeded(needed);
    
  }, [midtermState, finalsState, errors]);

  // Handle copy to clipboard
  const handleCopyToClipboard = async () => {
    setCopying(true);
    try {
      await copyGradesToClipboard(midtermState, finalsState, grades);
      // No notification shown to user as requested
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    } finally {
      setCopying(false);
    }
  };

  // Handle export as image
  const handleExportAsImage = async () => {
    setExporting(true);
    try {
      await exportGradesAsImage("grade-results-container");
      // No notification shown to user as requested
    } catch (error) {
      console.error("Error exporting as image:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Remove the duplicate header and keep just the calculator icon for context */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center justify-center text-primary">
          <Calculator className="h-8 w-8" />
        </span>
        <p className="text-muted-foreground">
          Real-time grade calculator for Calculus students
        </p>
      </div>

      {/* Make this div have better styling for export */}
      <div id="grade-results-container" className="space-y-6 rounded-lg overflow-hidden bg-background p-4 border border-border">
        {/* Grading Periods */}
        <div className="space-y-6">
          <GradingPeriod
            periodName="Midterm"
            quizNumbers={[1, 2]}
            quizScores={midtermState.quizScores}
            quizMaxScores={midtermState.quizMaxScores}
            examScore={midtermState.examScore}
            examMaxScore={midtermState.examMaxScore}
            attendance={midtermState.attendance}
            problemSet={midtermState.problemSet}
            periodGrade={grades.midterm}
            onChange={handleMidtermChange}
            errors={errors.midterm}
          />

          <GradingPeriod
            periodName="Finals"
            quizNumbers={[3, 4]}
            quizScores={finalsState.quizScores}
            quizMaxScores={finalsState.quizMaxScores}
            examScore={finalsState.examScore}
            examMaxScore={finalsState.examMaxScore}
            attendance={finalsState.attendance}
            problemSet={finalsState.problemSet}
            periodGrade={grades.finals}
            onChange={handleFinalsChange}
            errors={errors.finals}
          />
        </div>

        {/* Scores Needed to Pass Section */}
        <Card className="mt-6">
          <CardHeader className="pb-3 px-5">
            <h3 className="font-medium">Scores Needed to Pass (75%)</h3>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground mb-4">
              Based on your current grades, here's what final score you need to achieve a passing grade (75%):
            </div>
            
            {pointsNeeded.midtermNeeded !== null && (
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="font-medium mb-1">Midterm Score Needed:</div>
                <div className="text-xl font-bold text-yellow-500">
                  {pointsNeeded.isPossible 
                    ? `${naturalRound(pointsNeeded.midtermNeeded)}% overall score`
                    : "Not possible with current finals grade"}
                </div>
                {pointsNeeded.isPossible && (
                  <div className="text-sm mt-1 text-muted-foreground">
                    You need this score in your midterm period to reach a 75% final grade.
                  </div>
                )}
              </div>
            )}
            
            {pointsNeeded.finalsNeeded !== null && (
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <div className="font-medium mb-1">Finals Score Needed:</div>
                <div className="text-xl font-bold text-yellow-500">
                  {pointsNeeded.isPossible 
                    ? `${naturalRound(pointsNeeded.finalsNeeded)}% overall score`
                    : "Not possible with current midterm grade"}
                </div>
                {pointsNeeded.isPossible && (
                  <div className="text-sm mt-1 text-muted-foreground">
                    You need this score in your finals period to reach a 75% final grade.
                  </div>
                )}
              </div>
            )}
            
            {pointsNeeded.midtermNeeded === null && pointsNeeded.finalsNeeded === null && (
              <div className={`p-4 rounded-lg mb-4 ${
                grades.finalGrade >= 75 ? "bg-green-800/20" : "bg-destructive/20"
              }`}>
                <div className="font-medium mb-1">Current Status:</div>
                <div className={`text-xl font-bold ${
                  grades.finalGrade >= 75 ? "text-green-500" : "text-destructive"
                }`}>
                  {grades.finalGrade >= 75 
                    ? "You are currently passing! 🎉" 
                    : `You need to improve your overall grade by ${Math.ceil(75 - grades.finalGrade)} percentage points`}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Final Results */}
        <Card className="mt-6">
          <CardHeader className="pb-3 px-5">
            <h3 className="font-medium">Final Results</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grade-result">
                <h3>Final Grade</h3>
                <div className={`grade-value text-2xl ${getGradeColor(grades.finalGrade)}`}>
                  {formatFinalGrade(grades.finalGrade)}
                </div>
              </div>
              <div className="grade-result">
                <h3>Grade Point Equivalent (GPE)</h3>
                <div className={`grade-value text-2xl ${getGradeColor(grades.finalGrade)}`}>
                  {grades.gpe}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Export Actions */}
      <div className="flex justify-end mt-4 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleCopyToClipboard}
          disabled={copying || hasErrors()}
        >
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          onClick={handleExportAsImage}
          disabled={exporting || hasErrors()}
        >
          <Image className="h-4 w-4" />
          Export as Image
        </Button>
      </div>
    </div>
  );
};

export default GradeCalculator;
