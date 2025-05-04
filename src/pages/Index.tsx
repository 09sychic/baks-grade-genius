
import React from "react";
import GradeCalculator from "@/components/GradeCalculator";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-calc-dark-bg to-gray-900 p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-calc-purple mb-2">Grade Genius</h1>
          <p className="text-gray-400">Calculate your grades with precision</p>
        </header>
        <GradeCalculator />
        <footer className="text-center text-sm text-gray-400 mt-8 pb-4">
          Developed by @driyqnn
        </footer>
      </div>
    </div>
  );
};

export default Index;
