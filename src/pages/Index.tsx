
import React from "react";
import GradeCalculator from "@/components/GradeCalculator";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calc-dark-bg to-gray-900 p-4 md:p-8">
      <div className="container mx-auto">
        <GradeCalculator />
        <footer className="text-center text-sm text-gray-400 mt-8 pb-4">
          © 2025 Calculus ni Baks | A handy professor-grade calculator
        </footer>
      </div>
    </div>
  );
};

export default Index;
