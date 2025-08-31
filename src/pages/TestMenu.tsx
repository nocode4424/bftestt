import React from 'react';

const TestMenu: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          🍣 Bluefin Sushi Menu
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          React is working! The menu should load here.
        </p>
        <div className="bg-primary text-primary-foreground p-4 rounded-lg">
          <p className="font-semibold">Test Component Loaded Successfully</p>
          <p className="text-sm mt-2">If you can see this, React is working!</p>
        </div>
      </div>
    </div>
  );
};

export default TestMenu;
