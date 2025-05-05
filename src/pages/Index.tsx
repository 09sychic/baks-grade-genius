
import React from "react";
import GradeCalculator from "@/components/GradeCalculator";
import ThemeToggle from "@/components/ThemeToggle";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-6 text-center relative">
          <div className="absolute right-2 top-2">
            <ThemeToggle />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">Grade Genius</h1>
          <p className="text-muted-foreground">Calculate your grades with precision</p>
        </header>
        <GradeCalculator />
        <footer className="text-center text-sm text-muted-foreground mt-8 pb-4">
          Developed by @driyqnn
        </footer>
      </div>
    </div>
  );
};

export default Index;
