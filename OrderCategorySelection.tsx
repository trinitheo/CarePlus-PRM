// Code change to fix click handling on category cards

// Removed unnecessary z-index constraints

// Ensure proper event propagation
import React from 'react';

const OrderCategorySelection = () => {
  const handleClick = (event) => {
    // Ensure event propagation is handled correctly
    event.stopPropagation();
    // Add additional click handling logic here
  };

  return (
    <div className="category-cards">
      {/* Render your category cards here */}
      <div className="category-card" onClick={handleClick}>
        Category 1
      </div>
      <div className="category-card" onClick={handleClick}>
        Category 2
      </div>
      {/* other category cards */}
    </div>
  );
};

export default OrderCategorySelection;